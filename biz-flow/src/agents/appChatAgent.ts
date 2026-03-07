import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { buildModel } from "../config/model";
import { log } from "../utils/logger";
import {
  getAppById,
  getAppData,
  getAppChatHistory,
  saveAppChatMessage,
  upsertAppData,
  AppRow,
  AppDataRow,
  AppChatRow,
} from "../services/app.service";

// ─── System prompt builder ───────────────────────────────────────────────────

const buildAppSystemPrompt = (
  app: AppRow,
  appData: AppDataRow[],
): string => {
  const dataSection = appData.length > 0
    ? appData.map((d) => `${d.key}: ${JSON.stringify(d.value, null, 2)}`).join("\n\n")
    : "(No data yet)";

  return `
You are an AI assistant operating inside an application called "${app.name}".
${app.description ? `App Description: ${app.description}` : ""}

CORE RULES:
- The app schema defines the UI layout and components. NEVER modify the schema.
- app_data is the single source of truth for this app's state.
- Use the provided app data to understand the current state before responding.
- When the user requests an action that changes data, you MUST return a data_updates array.
- Keep responses concise and helpful.

APP SCHEMA:
${JSON.stringify(app.schema, null, 2)}

CURRENT APP DATA:
${dataSection}

RESPONSE FORMAT (CRITICAL):
You MUST return a RAW JSON object in one of these formats. Do NOT use markdown backticks.

1. When you need to update app data:
{
  "type": "data_update",
  "message": "Description of what was done",
  "data_updates": [
    { "key": "expenses", "value": [...] }
  ]
}

2. When you need clarification:
{
  "type": "clarification",
  "question": "What did you mean?",
  "options": ["Option A", "Option B"]
}

3. When you provide a final response (no data changes):
{
  "type": "final",
  "message": "Your response here"
}

IMPORTANT:
- For data_updates, always include the FULL updated value for each key, not just the diff.
- If a key doesn't exist yet in app_data, you can create it.
- Never include raw UUIDs or system details in your message to the user.
- If the user's request is ambiguous, ask for clarification.
`.trim();
};

// ─── Build chat history as LangChain messages ────────────────────────────────

const buildChatMessages = (recentChats: AppChatRow[]): BaseMessage[] =>
  recentChats.map((c) =>
    c.role === "user"
      ? new HumanMessage(c.message)
      : new AIMessage(c.message),
  );

// ─── Response cleaner ────────────────────────────────────────────────────────

const cleanReply = (raw: unknown): string => {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text
    .replace(/<\/?tool_call>/gi, "")
    .replace(/<\/?tool_response>/gi, "")
    .replace(/<\/?function_calls>/gi, "")
    .trim();
};

// ─── Response parser ─────────────────────────────────────────────────────────

interface DataUpdate {
  key: string;
  value: unknown;
}

interface ParsedAppResponse {
  type: "final" | "clarification" | "data_update";
  message: string;
  dataUpdates?: DataUpdate[];
}

const classifyParsed = (parsed: Record<string, unknown>): ParsedAppResponse | null => {
  if (parsed.type === "data_update" && Array.isArray(parsed.data_updates)) {
    return {
      type: "data_update",
      message: (parsed.message as string) || "Data updated successfully.",
      dataUpdates: parsed.data_updates as DataUpdate[],
    };
  }
  if (parsed.type === "clarification") {
    return { type: "clarification", message: JSON.stringify(parsed) };
  }
  if (parsed.type === "final" && parsed.message) {
    return { type: "final", message: parsed.message as string };
  }
  if (parsed.message) {
    return { type: "final", message: parsed.message as string };
  }
  return null;
};

const extractLeadingJson = (text: string): { json: Record<string, unknown>; rest: string } | null => {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("{")) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        try {
          const candidate = trimmed.substring(0, i + 1);
          const parsed = JSON.parse(candidate);
          return { json: parsed, rest: trimmed.substring(i + 1).trim() };
        } catch {
          return null;
        }
      }
    }
  }
  return null;
};

const parseAppResponse = (rawContent: string): ParsedAppResponse => {
  // 1. Try clean JSON parse
  try {
    const parsed = JSON.parse(rawContent);
    if (parsed && typeof parsed === "object") {
      const result = classifyParsed(parsed);
      if (result) return result;
    }
  } catch {
    // 2. Try extracting leading JSON with brace-depth tracking
    const extracted = extractLeadingJson(rawContent);
    if (extracted) {
      const result = classifyParsed(extracted.json);
      if (result) {
        if (extracted.rest && result.type === "final") {
          result.message = `${result.message}\n\n${extracted.rest}`;
        }
        return result;
      }
    }

    // 3. Try extracting from fenced code block
    const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        const result = classifyParsed(parsed);
        if (result) return result;
      } catch {
        // fall through
      }
    }
  }

  return { type: "final", message: rawContent };
};

// ─── Main agent runner ───────────────────────────────────────────────────────

export interface AppChatResult {
  reply: string;
  dataUpdates?: DataUpdate[];
}

export const runAppChatAgent = async (
  appId: string,
  userId: string,
  userMessage: string,
): Promise<AppChatResult> => {
  // Step 1: Fetch all app context in parallel
  const [app, appData, recentChats] = await Promise.all([
    getAppById(appId),
    getAppData(appId),
    getAppChatHistory(appId, userId, 20),
  ]);

  if (!app) {
    throw new Error("App not found");
  }

  log({
    event: "app_chat_started",
    appId,
    userId,
    appName: app.name,
    dataKeys: appData.map((d) => d.key),
    chatHistoryCount: recentChats.length,
  });

  // Step 2: Save user message
  await saveAppChatMessage(appId, userId, "user", userMessage);

  // Step 3: Build message stack with real conversation turns
  const systemPrompt = buildAppSystemPrompt(app, appData);
  const historyMessages = buildChatMessages(recentChats);

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...historyMessages,
    new HumanMessage(userMessage),
  ];

  // Step 4: Invoke LLM (no tools — app chat uses structured JSON responses)
  const llm = buildModel();
  const response = await llm.invoke(messages);

  const rawContent = cleanReply(response.content);

  log({
    event: "app_chat_llm_response",
    appId,
    userId,
    rawContent,
  });

  // Step 5: Parse response
  const parsed = parseAppResponse(rawContent);

  // Step 6: Apply data updates if present
  if (parsed.type === "data_update" && parsed.dataUpdates?.length) {
    for (const update of parsed.dataUpdates) {
      await upsertAppData(appId, update.key, update.value);
      log({
        event: "app_data_updated",
        appId,
        key: update.key,
      });
    }
  }

  const replyText = parsed.message || "I processed your request.";

  // Step 7: Save AI reply
  await saveAppChatMessage(appId, userId, "ai", replyText);

  log({
    event: "app_chat_completed",
    appId,
    userId,
    responseType: parsed.type,
  });

  return {
    reply: replyText,
    dataUpdates: parsed.dataUpdates,
  };
};
