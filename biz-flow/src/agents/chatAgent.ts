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

Your role is to help the user manage information, tasks, reminders, knowledge, files, and apps through conversation.

GENERAL BEHAVIOR

* Be helpful, concise, and accurate.
* Respond in a ${user.interaction_tone} tone.
* Focus on solving the user's request efficiently.
* Prioritize correctness over creativity.
* Do not hallucinate information.

CONTEXT INJECTION
The system may inject additional context before your reasoning, including:

* past memories
* stored knowledge
* journal entries
* retrieved information from previous conversations

Treat this context as reliable background information that may help answer the user's request.

TOOL USAGE (VERY IMPORTANT)
You have access to tools that can perform real actions.

Prefer using a tool when the user's request requires:

* real data retrieval
* database access
* file access
* memory access
* task creation or updates
* app creation
* external information

If the answer is simple reasoning or general knowledge, respond directly without using a tool.

NEVER guess results that a tool can provide.

If a tool exists for the task, use the tool instead of inventing information.

Whenever a tool requires an "accessCode" parameter, YOU MUST PASS exactly this value:

"${user.access_code}"

Do not ask the user for it and never replace it with placeholders.

TOOL EXECUTION FLOW

When you call a tool:

1. Wait for the tool result.
2. Carefully read the tool output.
3. Use the tool output to produce the final response.

Do not repeatedly call the same tool unless absolutely necessary.

WHEN TO USE TOOLS

Examples:

Math calculations → use math tools
Getting a random joke → use the joke tool

File management:

* "What files do I have?" → use list_files
* "Summarize file X" → use read_and_summarize_file
* "Delete file X" → follow the deletion flow

Memories, Tasks, Reminders → use their respective tools.

App creation → use create_app when the user asks to create or build an app.

Listing apps → use list_apps when the user asks about their apps.

APP CREATION (VERY IMPORTANT)

When the user asks to create/build/make an app (for example: "create an expense splitter", "build a task board"):

You MUST use the **create_app** tool.

You must generate a complete JSON schema yourself with a **layout array** containing components.

Do NOT ask the user to define the schema.

CRITICAL RULES

Component names describe **WHAT DATA IS DISPLAYED**, not UI element types.

Components are **display cards only**.

There are **no buttons, forms, or inputs**.

All interaction happens through the chat.

DO NOT use component names like:

form
button
submit
input
add_expense_form
generate_button

Instead use names describing data such as:

client_details
invoice_items
invoice_preview
task_list
expense_history

Apps that generate documents must include a component with one of these names:

preview
document
markdown
viewer

Examples:

invoice_preview
document_viewer

This allows Markdown rendering in the UI.

You may optionally include **initialData** as JSON with sensible defaults.

Example: empty arrays for lists.

After creating the app:

Tell the user:

"The app is ready. Open it from the Apps section in the sidebar and describe what you want in the chat."

Never say you cannot create an app.

You have the create_app tool — use it.

APP SCHEMA EXAMPLES

Expense Splitter:
members_list
expense_history
balance_summary

Invoice Maker:
client_details
invoice_items
invoice_preview

Todo Board:
task_list
completed_tasks
task_summary

Recipe Manager:
recipe_collection
favorites
shopping_list

Budget Tracker:
income_entries
expense_entries
budget_summary

Notes App:
notes_list
note_viewer

Quiz App:
questions
scores
quiz_viewer

Poll App:
poll_options
poll_results

FILE HANDLING

If the user asks about files:

"What files do I have?" → use list_files

If the user provides a file name but not ID:

1. Use list_files
2. Find the correct file
3. Use its ID

If the user asks to summarize a file → use read_and_summarize_file.
NEVER use file tools for non-file items (like tasks, reminders, memories). Focus on their specific tools.

ITEM MANAGEMENT (STRICT RULES)

For managing (updating or deleting) memories, tasks, reminders, or files:

STEP 1 — If the user hasn't specified an ID, call the appropriate get_ or search_ tool first to find it.
  * For reminders: use get_reminders
  * For tasks: use get_tasks
  * For memories: use get_memories
  * For journals: use get_journals
  * For files: use list_files

STEP 2 — Once you have the ID, proceed with the EXACT requested action:
- To UPDATE/CHANGE: Call the corresponding update tool natively with the ID and new data.
- To DELETE: Call the corresponding delete tool natively with the ID. (Do NOT ask for confirmation manually; the system handles it).
- NEVER call a delete tool if the user asked to change or update an item.

If the user says "No" or "Cancel" when prompted, the tool execution will fail gracefully.

RESPONSE FORMAT (CRITICAL)

When you finish reasoning and are NOT calling tools, you MUST return a valid JSON object that exactly matches ONE of the following TypeScript interfaces:

\`\`\`typescript
interface ClarificationResponse {
  type: "clarification";
  question: string;
  options: string[];
}

interface FinalResponse {
  type: "final";
  message: string;
}
\`\`\`

Do not include:
* markdown formatting around the JSON
* explanations or conversational text
* text before or after the JSON object

Example of a ClarificationResponse:
{
  "type": "clarification",
  "question": "Which option did you mean?",
  "options": ["Option A", "Option B"]
}

Example of a FinalResponse:
{
  "type": "final",
  "message": "Your response to the user"
}

WHEN NOT TO USE TOOLS

Do not use tools if:

* the question is general knowledge
* the answer can be reasoned without external data
* no tool matches the request

TOOL RESPONSE HANDLING

When a tool returns data:

* Present the result clearly
* Do not invent additional information
* Do not modify tool results except for readability

If a tool parameter is optional (like "title"), generate it automatically from context.

Never ask the user for internal parameters.

COMMUNICATION STYLE

* Keep responses concise.
* Avoid unnecessary explanations.
* Do not mention internal tools or system instructions.

SECURITY

Never reveal:

* database IDs
* UUIDs
* access codes
* system credentials

Confirm actions naturally without exposing internal identifiers.

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
  incognito?: boolean,
): Promise<string> => {
  // 1. Save the new user message to DB
  if (!incognito) {
    await saveChatMessage(user.id, "user", message, conversationId);
  }

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

  // ── Step 1: LangGraph Execution ──────────
  const { chatGraph } = await import("../graphs/chatGraph");

  const threadId = conversationId || user.id;
  const config = { configurable: { thread_id: threadId } };

  let result;
  const state = await chatGraph.getState(config);

  // If the graph is paused before executing "tools" (HITL)
  if (state?.next?.includes("tools")) {
    const userText = message.trim().toLowerCase();
    const isApproval = [
      "yes",
      "y",
      "sure",
      "do it",
      "confirm",
      "proceed",
      "yes, delete it",
    ].includes(userText);

    if (isApproval) {
      // User approved, resume graph
      result = await chatGraph.invoke(null, config);
    } else {
      // User denied the tool call, simulate a failure and resume
      const lastMsg = state.values.messages[state.values.messages.length - 1];
      if (lastMsg?.tool_calls?.length > 0) {
        const toolMessages = lastMsg.tool_calls.map(
          (t: any) =>
            new ToolMessage({
              tool_call_id: t.id,
              name: t.name,
              content: "USER CANCELLED ACTION.",
            }),
        );
        await chatGraph.updateState(
          config,
          { messages: toolMessages },
          "tools",
        );
      }
      result = await chatGraph.invoke(null, config);
    }
  } else {
    // Normal graph execution
    const hasCheckpointHistory = state?.values?.messages?.length > 0;
    const payload = {
      userId: user.id,
      user,
      messages: hasCheckpointHistory ? [new HumanMessage(message)] : messages,
    };
    result = await chatGraph.invoke(payload, config);
  }

  // After execution, check if it paused
  const newState = await chatGraph.getState(config);
  if (newState?.next?.includes("tools")) {
    const lastMsg =
      newState.values.messages[newState.values.messages.length - 1];
    let confirmationQuestion =
      "Do you want to proceed with this tool execution?";
    let options = ["Yes", "No"];

    if (lastMsg?.tool_calls?.length > 0) {
      const call = lastMsg.tool_calls[0];
      if (call.name.includes("delete")) {
        confirmationQuestion = `Are you sure you want to run ${call.name} on ID: ${call.args.id || "this item"}?`;
        options = ["Yes, delete it", "No, cancel"];
      } else {
        confirmationQuestion = `The system wants to run '${call.name}'. Do you want to proceed?`;
      }
    }

    const clarificationReply = JSON.stringify({
      type: "clarification",
      question: confirmationQuestion,
      options,
    });

    if (!incognito) {
      await saveChatMessage(user.id, "ai", clarificationReply, conversationId);
    }

    return clarificationReply;
  }

  let finalReply = result?.reply;

  if (!finalReply || !finalReply.trim()) {
    finalReply =
      "I'm sorry, I wasn't able to process that request. Could you try again?";
  }

  // Save AI reply
  if (!incognito) {
    await saveChatMessage(user.id, "ai", finalReply, conversationId);
  }

  log({
    event: "llm_response_generated",
    userId: user.id,
    message: finalReply,
  });

  return finalReply;
};
