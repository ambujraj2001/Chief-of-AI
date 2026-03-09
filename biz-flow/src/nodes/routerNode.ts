import { GraphState } from "../graphs/state";
import { buildModel } from "../config/model";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";

export const routerNode = async (state: GraphState) => {
  debugGraphState("routerNode_start", state);
  log({
    event: "router_node_started",
    userId: state.userId,
    messageCount: state.messages.length,
  });

  const lastUserMessage = state.messages
    .slice()
    .reverse()
    .find((m) => m._getType() === "human");
  const userInput = (lastUserMessage?.content as string) || "";

  if (userInput && state.boundActions) {
    const boundKey = Object.keys(state.boundActions).find(
      (k) => k.toLowerCase() === userInput.trim().toLowerCase(),
    );

    if (boundKey) {
      const binding = state.boundActions[boundKey];
      log({
        event: "router_node_bound_action",
        userId: state.userId,
        action: binding.action,
        boundId: binding.id,
      });

      const aiMessage = new AIMessage({
        content: "",
        tool_calls: [
          {
            id: `call_${Math.random().toString(36).substring(2, 11)}`,
            name: binding.action,
            args: { id: binding.id, accessCode: state.user.access_code },
          },
        ],
      });

      return {
        intent: "bound_action",
        messages: [aiMessage],
        boundActions: null, // clear it after execution
      };
    }
  }

  const llm = buildModel([]);

  // Take the last 5 messages for context
  const contextMessages = state.messages.slice(-5);

  const response = await llm.invoke([
    ...contextMessages,
    new HumanMessage(`
You are an intent classifier for an AI agent.

Classify the user's request into ONE of the following intents:

general_chat
tool_task
app_creation
memory_query
memory_write
memory_delete
file_operation

Definitions:

memory_write
User wants to store new information.
Examples:
"remember that my favorite city is Kyoto"
"remember this"
"store this information"

memory_query
User asks what the system remembers.
Examples:
"what do you remember about me"
"what is my favorite city"

memory_delete
User wants to remove stored information.
Examples:
"delete memory"
"forget memory"
"clear memory"

tool_task
User asks for something requiring tools.
Example:
"tell me a joke"

app_creation
User asks to build or generate an application.

file_operation
User wants to read/write/delete files.

general_chat
Normal conversation that does not require tools.

Return ONLY valid JSON.

Format:
{
  "intent": "intent_name"
}
`),
  ]);

  const content = response.content as string;
  let intent = "general_chat";

  try {
    const rawContent = content
      .trim()
      .replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1");
    // Extra safety, attempt to pick out JSON if there is extra text
    let parsedContent = rawContent;
    if (parsedContent.startsWith("{")) {
      const endIndex = parsedContent.lastIndexOf("}");
      if (endIndex !== -1) {
        parsedContent = parsedContent.substring(0, endIndex + 1);
      }
    }
    const parsed = JSON.parse(parsedContent);
    if (parsed.intent) {
      intent = parsed.intent;
    }
  } catch (error) {
    log({
      event: "router_node_parsing_failed",
      error: String(error),
      content,
      userId: state.userId,
    });
  }

  log({
    event: "router_node_completed",
    userId: state.userId,
    intent,
  });

  debugGraphState("routerNode_end", state, { intent });

  return { intent };
};
