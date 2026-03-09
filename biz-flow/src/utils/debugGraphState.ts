import { log } from "./logger";

export const debugGraphState = (
  nodeName: string,
  state: any,
  extra: Record<string, any> = {},
) => {
  log({
    event: "graph_node_debug",
    node: nodeName,
    messageCount: state.messages?.length || 0,
    toolResultsCount: state.toolResults?.length || 0,
    iterations: state.iterations || 0,
    intent: state.intent,
    ...extra,
  });
};
