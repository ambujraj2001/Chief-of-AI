import { GraphState } from "../graphs/state";
import { buildModel } from "../config/model";
import { HumanMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";

export const routerNode = async (state: GraphState) => {
  log({
    event: "router_node_started",
    userId: state.userId,
    messageCount: state.messages.length,
  });

  const llm = buildModel([]);

  const response = await llm.invoke([
    ...state.messages,
    new HumanMessage(
      "Classify the user's request into: general_chat, tool_task, app_creation, memory_query, file_operation. Return JSON with field intent.",
    ),
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

  return { intent };
};
