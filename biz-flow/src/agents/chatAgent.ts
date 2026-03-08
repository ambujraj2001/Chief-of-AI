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
- App creation → use create_app when the user asks to create, build, or make an app.
- Listing apps → use list_apps when the user asks about their apps.

APP CREATION (VERY IMPORTANT):
- When the user asks to create/build/make an app (e.g. "create an expense splitter", "build a task board"), use the create_app tool.
- You MUST generate a proper JSON schema yourself with a "layout" array containing component objects. Do NOT ask the user to define the schema.
- CRITICAL: Component names describe WHAT DATA IS DISPLAYED, not UI element types. The components are read-only display cards — there are no interactive forms, buttons, or input fields. All user interaction happens through the chat inside the app.
- Do NOT use component names like "form", "button", "submit", "input", "add_expense_form", "generate_button". Instead use names that describe the data being shown: "client_details", "invoice_items", "invoice_preview", "task_list", "expense_history".
- Apps that generate documents (invoices, articles, reports, letters) MUST include a component named with "preview", "document", "markdown", or "viewer" (e.g. "invoice_preview", "document_viewer") so the generated Markdown renders in the UI.
- Optionally provide initialData as a JSON string with reasonable starting data (e.g. empty arrays for lists).
- After creation, tell the user their app is ready and they can find it in the Apps section of the sidebar. Tell them to open the app and describe what they want in the chat.
- NEVER say you cannot create an app. You have the create_app tool — USE IT.

APP SCHEMA EXAMPLES (use these as reference when designing layouts):
- Expense Splitter: members_list, expense_history, balance_summary
- Invoice Maker: client_details, invoice_items, invoice_preview
- Todo / Task Board: task_list, completed_tasks, task_summary
- Recipe Manager: recipe_collection, favorites, shopping_list
- Budget Tracker: income_entries, expense_entries, budget_summary
- Note Taking: notes_list, note_viewer
- Quiz App: questions, scores, quiz_viewer
- Poll App: poll_options, poll_results

FILE HANDLING SPECIFICS:
- If the user asks "What files do I have?", use list_files.
- If the user asks "Summarize this file [ID/Name]", use read_and_summarize_file. If they give a name, first list_files to find the ID.
- If the user asks to delete a file, follow the 3-step deletion flow described below (list → confirm selection → confirm deletion → delete).
- Always be proactive. If you see file IDs in the history or current message, you can use them if relevant.

AMBIGUITY & DESTRUCTIVE ACTIONS:
- If a user's request is ambiguous or unclear, DO NOT guess. Use the clarification response format described below.
- Specifically for DELETION (Memories, Tasks, Reminders, Files), follow this EXACT 3-step flow:

  STEP 1 — User asks to delete something (e.g. "delete memory"):
    - Call the appropriate 'get_' tool (e.g. get_memories) to fetch all items.
    - After receiving the list, DO NOT call the delete tool. Instead, respond with a "clarification" JSON listing each item's title/description as options so the user can choose.
    - NEVER call a delete tool in the same turn as a get_ tool.

  STEP 2 — User selects a specific item (e.g. "Travel to London and Paris"):
    - The user has already chosen which item to delete. DO NOT call get_ tools again. DO NOT re-list the options.
    - Instead, respond with a confirmation clarification like:
      {"type": "clarification", "question": "Are you sure you want to delete 'Travel to London and Paris'?", "options": ["Yes, delete it", "No, cancel"]}
    - Look up the item's ID from the conversation history (the previous get_ tool result).

  STEP 3 — User confirms (e.g. "Yes, delete it" / "yes"):
    - NOW call the delete tool with the exact ID from the earlier get_ tool result.
    - Respond with a success message.

  If the user says "No, cancel" at step 2, simply acknowledge and do not delete.

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
    historyMessages = history.map((msg: ChatMessage) => {
      if (msg.role === "user") return new HumanMessage(msg.content);

      // Convert stored clarification JSON into readable text so the LLM
      // understands its own previous question in context.
      let aiContent = msg.content;
      try {
        const parsed = JSON.parse(msg.content);
        if (parsed?.type === "clarification" && parsed.question) {
          const opts = Array.isArray(parsed.options)
            ? `\nOptions I gave: ${parsed.options.join(", ")}`
            : "";
          aiContent = `${parsed.question}${opts}`;
        }
      } catch {
        // Not JSON, use as-is
      }
      return new AIMessage(aiContent);
    });
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
  let lastToolCallKey = "";

  while (
    (response as AIMessage).tool_calls?.length &&
    iterations < maxIterations
  ) {
    didCallTools = true;
    const toolCalls = (response as AIMessage).tool_calls ?? [];

    // Detect repeated identical tool calls (LLM stuck in a loop)
    const currentCallKey = toolCalls
      .map((tc) => `${tc.name}:${JSON.stringify(tc.args)}`)
      .join("|");
    if (currentCallKey === lastToolCallKey) {
      log({
        event: "repeated_tool_call_detected",
        toolNames: toolCalls.map((tc) => tc.name),
        userId: user.id,
      });
      break;
    }
    lastToolCallKey = currentCallKey;

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

      try {
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
      } catch (toolError: unknown) {
        const errMsg =
          toolError instanceof Error ? toolError.message : String(toolError);
        log({
          event: "tool_execution_failed",
          toolName: toolCall.name,
          error: errMsg,
          userId: user.id,
        });
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id ?? "",
            content: `Error executing ${toolCall.name}: ${errMsg}`,
          }),
        );
      }
    }

    // Call LLM again with the new tool results
    response = await llm.invoke(messages);
    messages.push(response as AIMessage);
    iterations++;
  }

  // If the last response was a tool call (no text), force one final text-only LLM call
  if (
    !finalReply &&
    (response as AIMessage).tool_calls?.length &&
    !cleanReply(response.content)
  ) {
    log({ event: "forcing_text_response", userId: user.id });
    const textOnlyLlm = buildModel();
    messages.push(
      new HumanMessage(
        "Based on the tool results above, provide your response to the user. " +
          "Return a raw JSON object in the required response format (clarification or final). Do not call any more tools.",
      ),
    );
    response = await textOnlyLlm.invoke(messages);
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
      // LLM sometimes returns a JSON object followed by trailing text.
      // Try to extract the leading JSON object by finding successive closing braces.
      if (rawContent.trimStart().startsWith("{")) {
        let braceIdx = rawContent.indexOf("}");
        while (braceIdx !== -1) {
          try {
            const candidate = rawContent.substring(0, braceIdx + 1);
            const parsed = JSON.parse(candidate);
            const trailing = rawContent.substring(braceIdx + 1).trim();

            if (parsed.type === "clarification") {
              if (trailing) {
                parsed.question = parsed.question
                  ? `${parsed.question}\n\n${trailing}`
                  : trailing;
              }
              finalReply = JSON.stringify(parsed);
            } else if (parsed.message) {
              finalReply = trailing
                ? `${parsed.message}\n\n${trailing}`
                : parsed.message;
            }
            break;
          } catch {
            braceIdx = rawContent.indexOf("}", braceIdx + 1);
          }
        }
      }

      // Fallback: extract JSON from fenced code block
      if (!finalReply) {
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
    }

    if (!finalReply) finalReply = rawContent;
  }

  if (!finalReply || !finalReply.trim()) {
    finalReply =
      "I'm sorry, I wasn't able to process that request. Could you try again?";
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
