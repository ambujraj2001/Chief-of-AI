import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphStateAnnotation, GraphState } from "./state";
import { routerNode } from "../nodes/routerNode";
import { memoryNode } from "../nodes/memoryNode";
import { plannerNode } from "../nodes/plannerNode";
import { toolNode } from "../nodes/toolNode";
import { responseNode } from "../nodes/responseNode";
import { AIMessage } from "@langchain/core/messages";

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
  .addNode("planner", plannerNode)
  .addNode("tools", toolNode)
  .addNode("respond", responseNode)

  .addEdge(START, "router")

  .addConditionalEdges(
    "router",
    (state: GraphState) => {
      if (state.intent === "bound_action") return "tools";

      if (state.intent === "general_chat") return "respond";

      if (state.intent === "memory_write") return "planner";

      if (state.intent === "memory_delete") return "planner";

      if (state.intent === "memory_query") return "memory";

      return "planner";
    },
    {
      respond: "respond",
      memory: "memory",
      planner: "planner",
      tools: "tools",
    },
  )

  .addEdge("memory", "planner")

  .addConditionalEdges("planner", shouldContinue, {
    tools: "tools",
    respond: "respond",
  })

  .addEdge("tools", "planner")
  .addEdge("respond", END);

export const chatGraph = graphBuilder.compile();
