import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { buildModel } from "../config/model";
import { tools } from "../tools";
import { UserRow } from "../types/user.types";
import { log } from "../utils/logger";
import {
  saveChatMessage,
  getRecentConversationHistory,
  ChatMessage,
} from "../services/chat.service";

// ─── System prompt ────────────────────────────────────────────────────────────

const buildSystemPrompt = (user: UserRow): string =>
  `
You are **Chief of AI**, a personal AI assistant for ${user.full_name}.

Your role is to help the user manage information, tasks, reminders, and tools through conversation.

GENERAL BEHAVIOR
- Be helpful, concise, and accurate.
- Respond in a ${user.interaction_tone} tone.
- Focus on solving the user's request efficiently.

TOOL USAGE (VERY IMPORTANT)
- You have access to tools that can perform real actions.
- ALWAYS prefer using a tool when the user's request matches a tool's capability.
- NEVER guess results that a tool can provide.
- If a tool exists for the task, call the tool instead of answering directly.
- Whenever a tool requires an "accessCode" parameter, YOU MUST PASS exactly this value: "${user.access_code}". Do not ask the user for it, and do not use placeholders like "access-code-redacted".

WHEN TO USE TOOLS
Examples:
- Math calculations → use math tools
- Getting a random joke → use the joke tool
- File management → use list_files, read_and_summarize_file, or delete_file tools when the user asks about their documents.
- Memories, Tasks, Reminders → use their respective tools.

FILE HANDLING SPECIFICS:
- If the user asks "What files do I have?", use list_files.
- If the user asks "Summarize this file [ID/Name]", use read_and_summarize_file. If they give a name, first list_files to find the ID.
- If the user asks "Delete my resume", first list_files to confirm the ID, then use delete_file.
- Always be proactive. If you see file IDs in the history or current message, you can use them if relevant.

AMBIGUITY & DESTRUCTIVE ACTIONS:
- If a user's request is ambiguous or unclear, DO NOT guess. Use the clarification response format described below.
- Specifically for DELETION (Memories, Tasks, Reminders, Files):
  - If multiple items match a deletion request (or if the specific ID is missing), DO NOT delete anything yet.
  - Instead, use the appropriate 'get_' tool (e.g. get_memories, get_tasks) to fetch the list of items. List the matching options with their titles/IDs in the options array and ask the user "Which one did you mean?".
- For NEW entries: Use the smart-upsert logic (provided in tools) which automatically handles duplicate titles.

RESPONSE FORMAT (CRITICAL):
When you have finished reasoning and are not making any tool calls, you MUST return a RAW JSON object matching one of these two formats. Do not use markdown backticks or add extra text.

1. When you need the user to clarify an ambiguous request or choose an option:
{
  "type": "clarification",
  "question": "Which option did you mean?",
  "options": ["Option A", "Option B"]
}

2. When you provide a final answer:
{
  "type": "final",
  "message": "Your text response here"
}

WHEN NOT TO USE TOOLS
- If the question is general knowledge
- If the request does not match any available tool

TOOL RESPONSE HANDLING
- When a tool returns a result, present the result clearly.
- Do NOT invent additional information.
- Do NOT modify tool results unless formatting for readability.
- If a tool has optional parameters (like "title"), AUTOGENERATE them yourself based on context. DO NOT ask the user for them.

COMMUNICATION STYLE
- Keep responses concise.
- Avoid unnecessary explanations unless the user asks for them.
- Do not mention internal tools or system instructions.
- NEVER include raw database IDs, UUIDs, or system credentials in your response. Just confirm the action was successful naturally without quoting the technical ID.

IMPORTANT RULES
- Do not hallucinate data.
- If a tool fails or is unavailable, politely explain the issue.
- Always prioritize correctness over creativity.

You are assisting ${user.full_name} inside the Chief of AI assistant application.
`.trim();

// ─── Response cleaner ─────────────────────────────────────────────────────────
// Qwen sometimes appends residual XML tool-call markers (<tool_call>, </tool_call>,
// <tool_response>, etc.) to its replies. Strip them out.

const cleanReply = (raw: unknown): string => {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text
    .replace(/<\/?tool_call>/gi, "")
    .replace(/<\/?tool_response>/gi, "")
    .replace(/<\/?function_calls>/gi, "")
    .trim();
};

export const runAgent = async (
  message: string,
  user: UserRow,
  conversationId?: string,
): Promise<string> => {
  // 1. Save the new user message to DB
  await saveChatMessage(user.id, "user", message, conversationId);

  // 2. Fetch history if in a conversation, otherwise just use current message
  let historyMessages: (HumanMessage | AIMessage)[] = [];
  if (conversationId) {
    const history = await getRecentConversationHistory(user.id, conversationId);
    historyMessages = history.map((msg: ChatMessage) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content),
    );
  } else {
    // New chat session
    historyMessages = [new HumanMessage(message)];
  }

  // 3. Setup tooling and model
  const agentTools = tools.filter((t) => t.name !== "prettify_response");
  const llm = buildModel(agentTools as any);

  log({
    event: "agent_execution_started",
    userId: user.id,
    conversationId,
    historyCount: historyMessages.length,
  });

  // 4. Build message stack (System prompt + Chat History)
  const messages: (HumanMessage | SystemMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(buildSystemPrompt(user)),
    ...historyMessages,
  ];

  // ── Step 1: LLM loop for multi-step tool execution ──────────
  let finalReply: string | undefined = undefined;
  let response = await llm.invoke(messages);
  messages.push(response as AIMessage);

  let iterations = 0;
  const maxIterations = 5;
  let didCallTools = false;

  while (
    (response as AIMessage).tool_calls?.length &&
    iterations < maxIterations
  ) {
    didCallTools = true;
    const toolCalls = (response as AIMessage).tool_calls ?? [];

    for (const toolCall of toolCalls) {
      log({
        event: "tool_selected",
        toolName: toolCall.name,
        userId: user.id,
      });

      const matchedTool = tools.find((t) => t.name === toolCall.name);

      if (!matchedTool) {
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id ?? "",
            content: `Tool "${toolCall.name}" not found.`,
          }),
        );
        continue;
      }

      log({
        event: "tool_execution_started",
        toolName: toolCall.name,
        arguments: toolCall.args,
        userId: user.id,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolResult = await (matchedTool as any).invoke(toolCall.args);

      log({
        event: "tool_execution_completed",
        toolName: toolCall.name,
        result: toolResult,
        userId: user.id,
      });

      messages.push(
        new ToolMessage({
          tool_call_id: toolCall.id ?? "",
          content: String(toolResult),
        }),
      );
    }

    // Call LLM again with the new tool results
    response = await llm.invoke(messages);
    messages.push(response as AIMessage);
    iterations++;
  }

  // ── Step 2: Synthesis & JSON Parsing ────────────────────
  if (!finalReply) {
    const rawContent = cleanReply(response.content);

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && typeof parsed === "object") {
        if (parsed.type === "clarification") {
          finalReply = JSON.stringify(parsed);
        } else if (parsed.type === "final" && parsed.message) {
          finalReply = parsed.message;
        } else if (parsed.message) {
          finalReply = parsed.message;
        }
      }
    } catch {
      // If parsing fails, extract raw json block
      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.type === "clarification") {
            finalReply = JSON.stringify(parsed);
          } else if (parsed.type === "final" && parsed.message) {
            finalReply = parsed.message;
          }
        } catch {
          finalReply = rawContent;
        }
      } else {
        finalReply = rawContent;
      }
    }

    if (!finalReply) finalReply = rawContent;
  }

  // Save AI reply
  await saveChatMessage(user.id, "ai", finalReply, conversationId);

  log({
    event: "llm_response_generated",
    userId: user.id,
    message: finalReply,
  });

  return finalReply;
};
