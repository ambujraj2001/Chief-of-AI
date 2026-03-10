import { buildModel } from "../config/model";
import { GraphState } from "../graphs/state";
import { tools } from "../tools";
import {
  AIMessage,
  SystemMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";

/**
 * Safely extract JSON from a string
 */
const extractJSON = (text: string): string | null => {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  return text.slice(first, last + 1);
};

const isSystemMessage = (m: any) =>
  m instanceof SystemMessage || m?._getType?.() === "system";

const coerceClarificationToolCall = (response: AIMessage): AIMessage => {
  const calls = response.tool_calls || [];
  if (calls.length !== 1 || calls[0].name !== "clarification") {
    return response;
  }

  const args = calls[0].args || {};
  const question =
    typeof args.question === "string"
      ? args.question
      : "Could you clarify what you want me to do?";
  const options = Array.isArray(args.options)
    ? args.options.filter((v) => typeof v === "string")
    : [];

  return new AIMessage({
    content: JSON.stringify({
      type: "clarification",
      question,
      options,
    }),
  });
};

export const plannerNode = async (state: GraphState) => {
  debugGraphState("plannerNode_start", state);

  log({
    event: "planner_node_started",
    userId: state.userId,
    messageCount: state.messages.length,
  });

  if (!state.messages || state.messages.length === 0) {
    throw new Error("Messages array empty before LLM call");
  }

  /**
   * Log LLM input
   */
  log({
    event: "LLM_INPUT",
    messages: state.messages,
    toolResults: state.toolResults?.length || 0,
  });

  /**
   * Build model with dynamic and static tools
   */
  const agentTools = tools.filter((t) => t.name !== "prettify_response");
  const retrievedTools = state.retrievedTools || [];

  // Combine static tools with dynamically retrieved tools
  const allTools = [...agentTools, ...retrievedTools];

  const llm = buildModel(allTools);

  /**
   * Planner system instructions
   */
  const plannerPrompt = new SystemMessage(
    `
You are the planning engine for an AI agent.

CRITICAL OUTPUT RULE:
If you are NOT calling a tool, your response MUST be a JSON object satisfying exactly ONE of the following TypeScript interfaces.
Do NOT include markdown, explanations, or conversational text.

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

TOOL EXECUTION RULE:
If you need to call a tool, USE THE NATIVE TOOL CALLING API. DO NOT output JSON text.
Your tool arguments must strictly match the following TypeScript interfaces.
The \`accessCode\` parameter is required for all tools operating on user data.

\`\`\`typescript
// Core Data Tools (Memory, Knowledge, etc.)
interface AddMemoryArgs { accessCode: string; content: string; title?: string; }
interface UpdateMemoryArgs { accessCode: string; id: string; content: string; title?: string; }
interface DeleteMemoryArgs { accessCode: string; id: string; }
interface GetMemoriesArgs { accessCode: string; }
interface SearchMemoryArgs { accessCode: string; query: string; limit?: number; }

interface AddKnowledgeArgs { accessCode: string; content: string; title?: string; }
interface UpdateKnowledgeArgs { accessCode: string; id: string; content: string; title?: string; }
interface DeleteKnowledgeArgs { accessCode: string; id: string; }
interface GetKnowledgesArgs { accessCode: string; }
interface SearchKnowledgeArgs { accessCode: string; query: string; limit?: number; }

interface AddJournalArgs { accessCode: string; content: string; title?: string; }
interface UpdateJournalArgs { accessCode: string; id: string; content: string; title?: string; }
interface DeleteJournalArgs { accessCode: string; id: string; }
interface GetJournalsArgs { accessCode: string; }
interface SearchJournalArgs { accessCode: string; query: string; limit?: number; }

// Utility Data Tools (Tasks, Reminders)
interface AddTaskArgs { accessCode: string; title: string; priority?: "low" | "medium" | "high"; dueDate?: string; }
interface UpdateTaskArgs { accessCode: string; id: string; status?: "pending" | "completed"; priority?: "low" | "medium" | "high"; title?: string; dueDate?: string; }
interface DeleteTaskArgs { accessCode: string; id: string; }
interface GetTasksArgs { accessCode: string; status?: "pending" | "completed"; }

interface AddReminderArgs { accessCode: string; title: string; remindAt: string; }
interface UpdateReminderArgs { accessCode: string; id: string; title?: string; remindAt?: string; }
interface DeleteReminderArgs { accessCode: string; id: string; }
interface GetRemindersArgs { accessCode: string; }

// Application Building & Operations Tools
interface CreateAppArgs { accessCode: string; name: string; description?: string; schema: string; initialData?: string; }
interface ListAppsArgs { accessCode: string; }

// Routine Automation Tools
interface CreateRoutineArgs { accessCode: string; name: string; instruction: string; cronExpression: string; }
interface GetRoutinesArgs { accessCode: string; }
interface UpdateRoutineArgs { accessCode: string; id: string; name?: string; instruction?: string; cronExpression?: string; isActive?: boolean; }
interface DeleteRoutineArgs { accessCode: string; id: string; }

// File System Tools
interface ListFilesArgs { accessCode: string; }
interface ReadAndSummarizeFileArgs { accessCode: string; id: string; }
interface DeleteFileArgs { accessCode: string; id: string; }

// External & Utility Tools
interface WebSearchArgs { query: string; }
interface SendEmailArgs { to: string; subject: string; message: string; }
interface RandomJokeArgs {}
interface AddNumbersArgs { a: number; b: number; }
interface SubtractNumbersArgs { a: number; b: number; }
interface GetChatHistoryArgs { accessCode: string; }
interface SafetyArgs {}
interface HelpArgs {}
\`\`\`

TOOL PARAMETER RULES:
If a tool requires parameters that are missing from the user request, you MUST output a \`ClarificationResponse\` INSTEAD of calling the tool.
Never invent dates or times for reminders. If the user did not specify a time, ask a clarification question.
Do NOT guess required tool parameters.

ID RETRIEVAL & MANAGEMENT WORKFLOW (CRITICAL):
Step 1: If the user refers to an item but you don't have its ID, ALWAYS call its specific get tool first:
  * Reminders: get_reminders
  * Tasks: get_tasks
  * Memories: get_memories
  * Journals: get_journals
  * Files: list_files

Step 2: Once the user provides or clarifies which item (giving you the ID), proceed with the EXACT requested action (update or delete).

- For UPDATES: Call the update tool natively with the ID and the new content/values.
- For DELETIONS: Call the delete tool natively with the ID. The system handles confirmation automatically.
- NEVER mix these up. If the user asks to "change", "edit", or "update", use the update tool.
- NEVER call a delete tool if the user asked to change or update an item.

STRICT TOOL CALLING RULE:
NEVER output tool arguments (like accessCode, content, title) as a JSON string or plain text in your response content.
If you want to use a tool, you MUST use the native tool calling mechanism.
If you simply print the JSON parameters, the system will fail.
`.trim(),
  );

  /**
   * Run planner
   * Mistral AI API strict schema check: Only exactly one SystemMessage is allowed at the start.
   * We merge the planner prompt with any existing system prompts from the state.
   */
  const systemMessages = [plannerPrompt, ...state.messages].filter(
    isSystemMessage,
  );
  const otherMessages = state.messages.filter((m) => !isSystemMessage(m));

  const mergedSystemContent = systemMessages
    .map((m) => m.content)
    .join("\n\n---\n\n");
  const finalSystemPrompt = new SystemMessage(mergedSystemContent);

  // Mistral requires tool execution chains to be strictly alternating or perfectly mapped.
  // Instead of risking Mistral rejecting standard Langchain ToolMessages, we format the history
  // as standard human/AI conversational context.
  const safeOtherMessages = otherMessages.map((m) => {
    if (m._getType() === "tool") {
      return new HumanMessage(
        `[Tool execution result for ${m.name || "tool"}]:\n${m.content}`,
      );
    }
    if (m._getType() === "ai" && (m as AIMessage).tool_calls?.length) {
      const calls = (m as AIMessage)
        .tool_calls!.map((c) => `${c.name}(${JSON.stringify(c.args)})`)
        .join(", ");
      return new AIMessage(`[I decided to call tools: ${calls}]`);
    }
    return m;
  });

  let response: any = await llm.invoke([
    finalSystemPrompt,
    ...safeOtherMessages,
  ]);

  // Some models may hallucinate a "clarification" tool. Treat it as structured output.
  response = coerceClarificationToolCall(response as AIMessage);

  /**
   * If the response contains tool calls, return immediately
   */
  if ((response as AIMessage).tool_calls?.length) {
    log({
      event: "planner_node_completed",
      userId: state.userId,
      toolCalls: (response as AIMessage).tool_calls?.length || 0,
    });

    return {
      messages: [response],
      iterations: state.iterations + 1,
    };
  }

  /**
   * Validate JSON response
   */
  const rawContent =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  const jsonString = extractJSON(rawContent);

  let parsed;

  try {
    if (jsonString) parsed = JSON.parse(jsonString);
  } catch (e) {
    parsed = null;
  }

  /**
   * Retry if JSON invalid
   */
  if (
    !parsed ||
    !(parsed.type === "clarification" || parsed.type === "final")
  ) {
    log({
      event: "planner_node_invalid_json_retry",
      content: response.content,
      userId: state.userId,
    });

    const retryPrompt = new SystemMessage(
      `
CRITICAL ERROR:
Your previous response contained plain text or was NOT valid JSON parsing safely into the required TypeScript interfaces.

You MUST return a JSON object satisfying exactly ONE of these TypeScript interfaces:

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

If you meant to execute a tool, USE THE NATIVE TOOL API instead of returning JSON text.
`.trim(),
    );

    const retrySystemPrompt = new SystemMessage(
      `${mergedSystemContent}\n\n---\n\n${retryPrompt.content}`,
    );

    response = await llm.invoke([retrySystemPrompt, ...safeOtherMessages]);
    response = coerceClarificationToolCall(response as AIMessage);

    if ((response as AIMessage).tool_calls?.length) {
      log({
        event: "planner_node_completed",
        userId: state.userId,
        toolCalls: (response as AIMessage).tool_calls?.length || 0,
      });

      return {
        messages: [response],
        iterations: state.iterations + 1,
      };
    }

    const retryContent =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const retryJSON = extractJSON(retryContent);

    try {
      const retryParsed = retryJSON ? JSON.parse(retryJSON) : null;

      if (retryParsed) {
        response = new AIMessage({
          content: JSON.stringify(retryParsed),
        });
      } else {
        throw new Error("Retry JSON parse failed");
      }
    } catch {
      response = new AIMessage({
        content: JSON.stringify({
          type: "final",
          message:
            "I encountered an internal formatting error. Please try again.",
        }),
      });
    }
  } else {
    response = new AIMessage({
      content: JSON.stringify(parsed),
    });
  }

  /**
   * Planner completed
   */
  log({
    event: "planner_node_completed",
    userId: state.userId,
    toolCalls: (response as AIMessage).tool_calls?.length || 0,
  });

  debugGraphState("plannerNode_end", state, {
    toolCalls: (response as AIMessage).tool_calls?.length || 0,
  });

  return {
    messages: [response],
    iterations: state.iterations + 1,
  };
};
