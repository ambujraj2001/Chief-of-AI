import { GraphState } from "../graphs/state";
import { searchEntries } from "../services/entry.service";
import { SystemMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";

export const memoryNode = async (state: GraphState) => {
  debugGraphState("memoryNode_start", state);
  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    debugGraphState("memoryNode", state, { memoriesFound: 0 });
    return {};
  }

  const query = lastUserMessage.content as string;

  const memories = await searchEntries(state.userId, "memory", query, 5);

  if (!memories?.length) {
    debugGraphState("memoryNode", state, { memoriesFound: 0 });
    return {};
  }

  const memoryContext = memories
    .map((m: any) => `Memory: ${m.content}`)
    .join("\n");

  const injectedMessage = new SystemMessage(`
Relevant information from the user's past data:

${memoryContext}

Use this information only if it helps answer the user's request.
Do not explicitly mention that the information came from memory unless the user asks about their memory.
`);

  log({
    event: "memory_node_completed",
    userId: state.userId,
    memoriesFound: memories.length,
  });

  debugGraphState("memoryNode", state, {
    memoriesFound: memories.length,
  });

  return {
    messages: [injectedMessage],
  };
};
