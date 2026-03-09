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

  // @ts-ignore - buildModel might only expect StructuredToolInterface[]
  const llm = buildModel(allTools).bindTools(allTools, {
    parallel_tool_calls: false,
  });

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
The \`accessCode\` parameter is ALWAYS required and must be a string.

\`\`\`typescript
// Memory Tools
interface AddMemoryArgs { accessCode: string; content: string; title?: string; }
interface UpdateMemoryArgs { accessCode: string; id: string; content: string; title?: string; }
interface DeleteMemoryArgs { accessCode: string; id: string; }
interface GetMemoriesArgs { accessCode: string; }
interface SearchMemoryArgs { accessCode: string; query: string; limit?: number; }

// Task Tools
// Task Tools
interface AddTaskArgs { accessCode: string; title: string; metadata?: string; }
interface UpdateTaskArgs { accessCode: string; id: string; title?: string; metadata?: string; }
interface DeleteTaskArgs { accessCode: string; id: string; }
interface GetTasksArgs { accessCode: string; }

// Journal Tools
interface AddJournalArgs { accessCode: string; content: string; title?: string; }
interface UpdateJournalArgs { accessCode: string; id: string; content: string; title?: string; }
interface DeleteJournalArgs { accessCode: string; id: string; }
interface GetJournalArgs { accessCode: string; }

// Reminder Tools
interface AddReminderArgs { accessCode: string; title: string; due_date: string; }
interface UpdateReminderArgs { accessCode: string; id: string; title?: string; due_date?: string; }
interface DeleteReminderArgs { accessCode: string; id: string; }
interface GetRemindersArgs { accessCode: string; }
\`\`\`

TOOL PARAMETER RULES:
If a tool requires parameters that are missing from the user request, you MUST output a \`ClarificationResponse\` INSTEAD of calling the tool.
Never invent dates or times for reminders. If the user did not specify a time, ask a clarification question.
Do NOT guess required tool parameters.

ID RETRIEVAL & MANAGEMENT WORKFLOW (CRITICAL):
Step 1: If the user refers to an item but you don't have its ID, ALWAYS call the corresponding get/list/search tool first.
Step 2: Once the user provides or clarifies which item (giving you the ID), proceed with the EXACT requested action (update or delete).

- For UPDATES: Call the update tool natively with the ID and the new content/values.
- For DELETIONS: Call the delete tool natively with the ID. The system handles confirmation automatically.
- NEVER mix these up. If the user asks to "change", "edit", or "update", use the update tool.
`.trim(),
  );

  /**
   * Run planner
   * Mistral AI API strict schema check: Only exactly one SystemMessage is allowed at the start.
   * We merge the planner prompt with any existing system prompts from the state.
   */
  const systemMessages = [plannerPrompt, ...state.messages].filter(
    (m) => m instanceof SystemMessage || m._getType() === "system",
  );
  const otherMessages = state.messages.filter(
    (m) => !(m instanceof SystemMessage || m._getType() === "system"),
  );

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

    response = await llm.invoke([
      plannerPrompt,
      retryPrompt,
      ...state.messages,
    ]);

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
