import { buildModel } from "../config/model";
import { GraphState } from "../graphs/state";
import { tools } from "../tools";
import { AIMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";

export const plannerNode = async (state: GraphState) => {
  log({
    event: "planner_node_started",
    userId: state.userId,
    messageCount: state.messages.length,
  });

  const agentTools = tools.filter((t) => t.name !== "prettify_response");
  // @ts-ignore - typing buildModel to pass tools array
  const llm = buildModel(agentTools);

  const response = await llm.invoke(state.messages);

  log({
    event: "planner_node_completed",
    userId: state.userId,
    toolCalls: (response as AIMessage).tool_calls?.length || 0,
  });

  return {
    messages: [response],
    iterations: state.iterations + 1,
  };
};
