import { GraphState } from "../graphs/state";
import { searchEntries } from "../services/entry.service";
import { SystemMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";

export const memoryNode = async (state: GraphState) => {
  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    return {};
  }

  const query = lastUserMessage.content as string;

  const memories = await searchEntries(state.userId, "memory", query, 5);

  if (!memories?.length) return {};

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

  return {
    messages: [injectedMessage],
  };
};
