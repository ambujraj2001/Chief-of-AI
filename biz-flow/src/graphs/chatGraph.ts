import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphStateAnnotation, GraphState } from "./state";
import { routerNode } from "../nodes/routerNode";
import { memoryNode } from "../nodes/memoryNode";
import { plannerNode } from "../nodes/plannerNode";
import { toolNode } from "../nodes/toolNode";
import { responseNode } from "../nodes/responseNode";
import { AIMessage } from "@langchain/core/messages";

import { toolDiscoveryNode } from "../nodes/toolDiscoveryNode";

const shouldContinue = (state: GraphState) => {
  if (state.iterations > 5) {
    return "respond";
  }

  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "respond";
};

const graphBuilder = new StateGraph(GraphStateAnnotation)
  .addNode("router", routerNode)
  .addNode("memory", memoryNode)
  .addNode("discovery", toolDiscoveryNode)
  .addNode("planner", plannerNode)
  .addNode("tools", toolNode)
  .addNode("respond", responseNode)

  .addEdge(START, "router")

  .addConditionalEdges(
    "router",
    (state: GraphState) => {
      if (state.intent === "bound_action") return "tools";

      if (state.intent === "general_chat") return "respond";

      if (state.intent === "memory_write") return "discovery";

      if (state.intent === "memory_delete") return "discovery";

      if (state.intent === "memory_query") return "memory";

      return "discovery";
    },
    {
      respond: "respond",
      memory: "memory",
      discovery: "discovery",
      tools: "tools",
    },
  )

  .addEdge("memory", "discovery")
  .addEdge("discovery", "planner")

  .addConditionalEdges("planner", shouldContinue, {
    tools: "tools",
    respond: "respond",
  })

  .addEdge("tools", "discovery") // If tools called, go back to discovery for next step tools?
  // Actually, go to discovery to find tools for next thought?
  // User said "BEFORE the LLM node". If tool finishes, it goes back to LLM.
  // So it should be tools -> discovery -> planner.
  .addEdge("respond", END);
import { MemorySaver } from "@langchain/langgraph";

export const checkpointer = new MemorySaver();

const isLocal = process.env.NODE_ENV !== "production";

export const chatGraph = graphBuilder.compile({
  checkpointer,
  interruptBefore: isLocal ? ["tools"] : undefined,
});
