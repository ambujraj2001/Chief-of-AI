import { buildModel } from "../config/model";
import { GraphState } from "../graphs/state";
import { tools } from "../tools";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
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
   * Build model with tools
   */
  const agentTools = tools.filter((t) => t.name !== "prettify_response");

  // @ts-ignore
  const llm = buildModel(agentTools);

  /**
   * Planner system instructions
   */
  const plannerPrompt = new SystemMessage(
    `
You are the planning engine for an AI agent.

CRITICAL OUTPUT RULE:
You MUST return ONLY valid JSON.
Never return plain text.
Never include explanations.

If asking a question, use the clarification format.
If you have a plain text question like "When should I remind you?", you MUST convert it into this exact JSON format:
{
  "type": "clarification",
  "question": "Are you sure you want to delete the reminder?",
  "options": ["Yes, delete it", "No, cancel"]
}

Do NOT include:
- text before JSON
- text after JSON
- markdown
- explanations

TOOL PARAMETER RULES:
If a tool requires parameters that are missing from the user request, you MUST ask a clarification question INSTEAD of calling the tool.
Never invent dates or times for reminders. If the user did not specify a time, ask a clarification question.
Do NOT guess required tool parameters like "title".

Allowed formats:

Format 1 — Clarification
{
  "type": "clarification",
  "question": "Which option did you mean?",
  "options": ["Option A", "Option B"]
}

Format 2 — Final Response
{
  "type": "final",
  "message": "Response to the user"
}

TOOL RESULT PARSING RULES:
When tool results are returned formatted like:
"[ID: abc123] This is the title"
You must extract the text after the ID bracket (e.g. "This is the title") to use as the option text.

If a tool result says "Successfully deleted...", you MUST produce:
{
  "type": "final",
  "message": "The item has been deleted."
}

DELETION WORKFLOW RULES (CRITICAL):
Step 1: Call the get/list tool.
Step 2: Ask which item to delete (Clarification). Never repeat this if the user already selected an option. If the user replied with an option, move to Step 3.
Step 3: Ask for confirmation (Clarification).
Step 4: Call the delete tool.
Step 5: Return a final success message.
`.trim(),
  );

  /**
   * Run planner
   */
  let response: any = await llm.invoke([plannerPrompt, ...state.messages]);

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
Your previous response was invalid because it was not JSON. Respond ONLY with valid JSON.
Your previous response contained plain text or was NOT valid JSON.

You must ALWAYS return valid JSON.
Never return plain text.
Never include explanations.

If you are asking a question, you MUST use the clarification format.

Allowed formats:

{
 "type": "clarification",
 "question": "text",
 "options": ["option1","option2"]
}

or

{
 "type": "final",
 "message": "text"
}
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
