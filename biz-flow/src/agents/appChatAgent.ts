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

const buildAppSystemPrompt = (app: AppRow, appData: AppDataRow[]): string => {
  const dataSection =
    appData.length > 0
      ? appData
          .map((d) => `${d.key}: ${JSON.stringify(d.value, null, 2)}`)
          .join("\n\n")
      : "(No data yet)";

  return `
You are an AI assistant operating inside an application called "${app.name}".
${app.description ? `App Description: ${app.description}` : ""}

YOUR CAPABILITIES (VERY IMPORTANT):
You are a FULLY CAPABLE assistant for this app. You can handle ANY request the user makes by updating app_data via data_updates. This includes but is not limited to:
- Generating invoices, documents, reports, letters, contracts — as rich Markdown
- Managing lists (todos, recipes, contacts, inventory) — as arrays
- Tracking data (expenses, budgets, scores, habits) — as arrays or objects
- Computing totals, balances, summaries — store results in data keys
- Creating and formatting any content the user asks for

ABSOLUTE RULE: NEVER say "I don't have tools", "I can't process", "I'm unable to", or "I don't have the capability". You DO have the capability — you update app_data. If the user asks you to do something, DO IT by returning a data_update response.

CORE RULES:
- The app schema defines the UI layout and components. NEVER modify the schema.
- app_data is the single source of truth for this app's state.
- Use the provided app data to understand the current state before responding.
- When the user requests an action that changes data, you MUST return a data_updates array.
- Keep responses concise and helpful.
- The members list is managed automatically by the system (from the app_members table). Do NOT update members_list in app_data. Only manage non-member data keys.

HOW THE UI WORKS:
- Schema components are DISPLAY-ONLY cards. They show data from app_data. They are NOT interactive forms or clickable buttons.
- There are no input fields, dropdowns, or submit buttons in the UI. ALL user interaction happens through THIS CHAT.
- NEVER tell the user to "fill in a form", "click a button", or "submit". Instead, ask the user to tell you the information in chat, then YOU update the data.
- When components show "No data", it means you need to populate them via data_updates when the user provides information.

PREVIEW / VIEWER / DOCUMENT COMPONENTS (CRITICAL):
- Any component whose name contains "preview", "viewer", "markdown", or "document" is a RENDERED DISPLAY component. It shows rich Markdown content to the user.
- Whenever you update data in this app, you MUST ALSO update the preview/viewer/document component with a fully formatted Markdown string that reflects the current state of ALL the app's data.
- For example, in an invoice app: every time items, client details, or any data changes, regenerate the full invoice as a Markdown string and include it in data_updates for the preview component.
- The preview component should contain a COMPLETE, beautifully formatted document — not just a summary. Use Markdown headers, tables, bold text, line breaks, etc.
- NEVER leave a preview/viewer/document component empty when there is data to display.

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
    { "key": "some_key", "value": "..." }
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

IMPORTANT RULES:
- For data_updates, always include the FULL updated value for each key, not just the diff. When updating a list, include the ENTIRE list with the changes applied.
- If a key doesn't exist yet in app_data, you can create it.
- When generating documents, reports, or invoices, use rich Markdown formatting (headers, tables, bold, etc.) in the data value so it renders beautifully in the UI.
- Never include raw UUIDs or system details in your message to the user.
- If the user's request is ambiguous, ask for clarification.
- Prefer "data_update" responses over "final" whenever the user asks you to create, generate, add, update, or change anything.
- When the user says "create new", "start fresh", "new invoice", "reset", or similar, clear the relevant data keys (set arrays to [], objects to {}, strings to "") and start from scratch.
- When the user asks to UPDATE existing data (change price, add item, remove item, edit details), merge the changes into the EXISTING data — do NOT discard what was there.

EXAMPLES OF CORRECT BEHAVIOR:

Example 1 — User asks to create/generate a document (invoice, report, letter, etc):
User: "make an invoice for 3 eggs at 5 each and milk at 2 each"
You MUST update BOTH the structured data AND the preview/viewer/document component:
{
  "type": "data_update",
  "message": "I've generated your invoice with 2 items totaling 17.00.",
  "data_updates": [
    {
      "key": "invoice_items",
      "value": [
        { "item": "Eggs", "qty": 3, "price": 5, "total": 15 },
        { "item": "Milk", "qty": 1, "price": 2, "total": 2 }
      ]
    },
    {
      "key": "invoice_preview",
      "value": "# Invoice\n\n**Date:** 2026-01-01\n\n| # | Item | Qty | Unit Price | Total |\n|---|------|-----|-----------|-------|\n| 1 | Eggs | 3 | 5.00 | 15.00 |\n| 2 | Milk | 1 | 2.00 | 2.00 |\n\n---\n\n**Subtotal:** 17.00\n\n**Grand Total: 17.00**"
    }
  ]
}

Example 2 — User UPDATES existing data (change, add, remove items):
User: "update milk price to 10" (when invoice_items already has Eggs and Milk)
You MUST include ALL existing items with the change applied:
{
  "type": "data_update",
  "message": "Updated Milk price to 10. New total: 25.00.",
  "data_updates": [
    {
      "key": "invoice_items",
      "value": [
        { "item": "Eggs", "qty": 3, "price": 5, "total": 15 },
        { "item": "Milk", "qty": 1, "price": 10, "total": 10 }
      ]
    },
    {
      "key": "invoice_preview",
      "value": "# Invoice\n\n**Date:** 2026-01-01\n\n| # | Item | Qty | Unit Price | Total |\n|---|------|-----|-----------|-------|\n| 1 | Eggs | 3 | 5.00 | 15.00 |\n| 2 | Milk | 1 | 10.00 | 10.00 |\n\n---\n\n**Subtotal:** 25.00\n\n**Grand Total: 25.00**"
    }
  ]
}

Example 3 — User manages a list (tasks, recipes, contacts, etc):
User: "add task: buy groceries"
{
  "type": "data_update",
  "message": "Added 'buy groceries' to your task list.",
  "data_updates": [
    { "key": "task_list", "value": [{ "title": "buy groceries", "done": false }] }
  ]
}

Example 4 — User wants to start fresh:
User: "create a new invoice" or "start over"
Clear the data and confirm:
{
  "type": "data_update",
  "message": "I've cleared the previous data. Tell me the details for your new invoice.",
  "data_updates": [
    { "key": "invoice_items", "value": [] },
    { "key": "client_details", "value": {} },
    { "key": "invoice_preview", "value": "" }
  ]
}
`.trim();
};

// ─── Build chat history as LangChain messages ────────────────────────────────

const buildChatMessages = (recentChats: AppChatRow[]): BaseMessage[] =>
  recentChats.map((c) =>
    c.role === "user" ? new HumanMessage(c.message) : new AIMessage(c.message),
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

const classifyParsed = (
  parsed: Record<string, unknown>,
): ParsedAppResponse | null => {
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

/**
 * Repair JSON that has literal newlines/tabs inside string values.
 * LLMs often put real line breaks in markdown strings instead of \n escapes.
 */
const repairJsonStrings = (text: string): string => {
  const chars: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      chars.push(ch);
      continue;
    }

    if (ch === "\\") {
      escape = true;
      chars.push(ch);
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      chars.push(ch);
      continue;
    }

    if (inString) {
      if (ch === "\n") {
        chars.push("\\n");
        continue;
      }
      if (ch === "\r") {
        chars.push("\\r");
        continue;
      }
      if (ch === "\t") {
        chars.push("\\t");
        continue;
      }
    }

    chars.push(ch);
  }

  return chars.join("");
};

const extractLeadingJson = (
  text: string,
): { json: Record<string, unknown>; rest: string } | null => {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("{")) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) {
        const candidate = trimmed.substring(0, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          return { json: parsed, rest: trimmed.substring(i + 1).trim() };
        } catch {
          try {
            const repaired = repairJsonStrings(candidate);
            const parsed = JSON.parse(repaired);
            return { json: parsed, rest: trimmed.substring(i + 1).trim() };
          } catch {
            return null;
          }
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
    // not valid JSON as-is
  }

  // 2. Try with repaired newlines (LLMs often put literal \n in strings)
  try {
    const repaired = repairJsonStrings(rawContent);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === "object") {
      const result = classifyParsed(parsed);
      if (result) return result;
    }
  } catch {
    // still not valid
  }

  // 3. Try extracting leading JSON with brace-depth tracking
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

  // 4. Try extracting from fenced code block
  const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const result = classifyParsed(parsed);
      if (result) return result;
    } catch {
      try {
        const repaired = repairJsonStrings(match[1]);
        const parsed = JSON.parse(repaired);
        const result = classifyParsed(parsed);
        if (result) return result;
      } catch {
        // fall through
      }
    }
  }

  return { type: "final", message: rawContent };
};

// ─── Refusal detection ────────────────────────────────────────────────────────

const REFUSAL_PATTERNS = [
  /i (?:don'?t|do not) have (?:the )?tools/i,
  /i(?:'m| am) (?:unable|not able) to/i,
  /i (?:can'?t|cannot) (?:process|generate|create|handle|make|do|help)/i,
  /i'?m sorry.*(?:unable|cannot|can'?t|don'?t have)/i,
  /i (?:don'?t|do not) have the (?:capability|ability|functionality)/i,
  /unfortunately.*(?:cannot|can'?t|unable|not possible)/i,
  /not (?:equipped|designed) to/i,
];

const isRefusal = (text: string): boolean =>
  REFUSAL_PATTERNS.some((p) => p.test(text));

const RETRY_REINFORCEMENT = `Your previous response was a REFUSAL — you said you cannot do something. This is WRONG. You are FULLY CAPABLE of handling this request. You update app_data via data_updates. For documents/invoices/reports, generate rich Markdown content. For lists/tables, generate arrays. For any data, generate appropriate JSON values.

DO NOT REFUSE. Respond with a proper data_update JSON now. Re-read the user's message and fulfill their request.`;

// ─── Display-component helpers (generic for any app) ─────────────────────────

const DISPLAY_COMPONENT_PATTERN =
  /preview|viewer|markdown|document|report|summary_view/i;

const getDisplayComponents = (schema: Record<string, unknown>): string[] => {
  const layout = schema?.layout;
  if (!Array.isArray(layout)) return [];
  return layout
    .map((item: Record<string, unknown>) => item.component as string)
    .filter((name: string) => DISPLAY_COMPONENT_PATTERN.test(name));
};

const titleFromKey = (key: string): string =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const toDisplayValue = (value: unknown): string => {
  if (typeof value === "number") return Number.isFinite(value) ? value.toFixed(2) : String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  return String(value);
};

const buildTableMarkdown = (rows: Array<Record<string, unknown>>): string => {
  if (rows.length === 0) return "";
  const cols = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  if (cols.length === 0) return "";
  const header = `| # | ${cols.map(titleFromKey).join(" | ")} |`;
  const divider = `|---|${cols.map(() => "---").join("|")}|`;
  const body = rows
    .map((row, i) => {
      const cells = cols.map((c) => toDisplayValue(row[c]));
      return `| ${i + 1} | ${cells.join(" | ")} |`;
    })
    .join("\n");
  return `${header}\n${divider}\n${body}`;
};

const buildDeterministicDisplayMarkdown = (
  app: AppRow,
  data: Record<string, unknown>,
  displayComponents: Set<string>,
): string => {
  const parts: string[] = [];
  parts.push(`# ${app.name}`);
  parts.push("");
  parts.push(`**Date:** ${new Date().toISOString().slice(0, 10)}`);

  for (const [key, value] of Object.entries(data)) {
    if (displayComponents.has(key)) continue;
    if (/member/i.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    ) {
      continue;
    }

    parts.push("");
    parts.push(`## ${titleFromKey(key)}`);
    parts.push("");

    if (Array.isArray(value)) {
      if (typeof value[0] === "object" && value[0] !== null) {
        parts.push(buildTableMarkdown(value as Array<Record<string, unknown>>));
      } else {
        for (const item of value) parts.push(`- ${toDisplayValue(item)}`);
      }
      continue;
    }

    if (typeof value === "object" && value !== null) {
      for (const [objKey, objValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        parts.push(`**${titleFromKey(objKey)}:** ${toDisplayValue(objValue)}`);
      }
      continue;
    }

    parts.push(toDisplayValue(value));
  }

  return parts.join("\n").trim();
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

  await saveAppChatMessage(appId, userId, "user", userMessage);

  const systemPrompt = buildAppSystemPrompt(app, appData);
  const historyMessages = buildChatMessages(recentChats);

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...historyMessages,
    new HumanMessage(userMessage),
  ];

  const llm = buildModel();
  const response = await llm.invoke(messages);
  let rawContent = cleanReply(response.content);

  log({
    event: "app_chat_llm_response",
    appId,
    userId,
    rawContent,
  });

  let parsed = parseAppResponse(rawContent);

  if (parsed.type === "final" && isRefusal(parsed.message)) {
    log({
      event: "app_chat_refusal_detected",
      appId,
      userId,
      refusedMessage: parsed.message,
    });

    messages.push(new AIMessage(rawContent));
    messages.push(new HumanMessage(RETRY_REINFORCEMENT));

    const retryResponse = await llm.invoke(messages);
    rawContent = cleanReply(retryResponse.content);

    log({
      event: "app_chat_retry_response",
      appId,
      userId,
      rawContent,
    });

    parsed = parseAppResponse(rawContent);
  }

  if (parsed.type === "data_update" && parsed.dataUpdates?.length) {
    for (const update of parsed.dataUpdates) {
      await upsertAppData(appId, update.key, update.value);
      log({
        event: "app_data_updated",
        appId,
        key: update.key,
      });
    }

    // ── Keep display components synchronized deterministically ──
    const displayComponents = getDisplayComponents(app.schema);
    if (displayComponents.length > 0) {
      const updatedKeys = new Set(parsed.dataUpdates.map((u) => u.key));
      const missedDisplays = displayComponents.filter(
        (c) => !updatedKeys.has(c),
      );

      if (missedDisplays.length > 0) {
        const freshData = await getAppData(appId);
        const currentDataMap: Record<string, unknown> = {};
        for (const row of freshData) {
          currentDataMap[row.key] = row.value;
        }
        const displaySet = new Set(displayComponents);
        const markdown = buildDeterministicDisplayMarkdown(
          app,
          currentDataMap,
          displaySet,
        );

        if (markdown) {
          for (const displayKey of missedDisplays) {
            await upsertAppData(appId, displayKey, markdown);
            parsed.dataUpdates.push({ key: displayKey, value: markdown });
            log({
              event: "display_component_synced",
              appId,
              componentKey: displayKey,
            });
          }
        }
      }
    }
  }

  const replyText = parsed.message || "I processed your request.";

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
