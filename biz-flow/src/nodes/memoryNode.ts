import { GraphState } from "../graphs/state";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";
import { searchMemoryTool, getMemoriesTool } from "../tools/memory";
import { AI_CONFIG } from "../config/ai.config";
import { buildModel } from "../config/model";

export const memoryNode = async (state: GraphState, config?: any) => {
  debugGraphState("memoryNode_start", state);
  
  const onEvent = config?.configurable?.onEvent;
  const user = config?.configurable?.user || state.user;
  const accessCode = user.access_code;

  const emit = (type: any, msg: string, status: any = 'info', data?: any) => {
    onEvent?.(type, msg, status, data);
  };

  const lastUserMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    debugGraphState("memoryNode", state, { memoriesFound: 0 });
    return {};
  }

  const query = lastUserMessage.content as string;

  // 1️⃣ Semantic Search
  emit('memory_search_started', `Searching for memories about: "${query}"`, 'pending');
  
  const searchResult: any = await searchMemoryTool.invoke({
    accessCode,
    query,
    limit: AI_CONFIG.memory.MAX_MEMORY_CANDIDATES
  });

  let candidates: any[] = searchResult.memories || [];
  
  // 2️⃣ Evaluate & 3️⃣ Fallback Retrieval
  if (candidates.length < AI_CONFIG.memory.MIN_MEMORY_RESULTS) {
    emit('memory_search_fallback_triggered', 'Low semantic match, performing full recall...', 'warning');
    
    const allMemoriesResult: any = await getMemoriesTool.invoke({ accessCode });
    const allMemories = allMemoriesResult.memories || [];
    
    // 4️⃣ Merge Results
    const existingIds = new Set(candidates.map(m => m.id));
    for (const m of allMemories) {
      if (!existingIds.has(m.id)) {
        candidates.push(m);
        if (candidates.length >= AI_CONFIG.memory.MAX_MEMORY_CANDIDATES) break;
      }
    }
  }

  emit('memory_candidates_retrieved', `Retrieved ${candidates.length} candidates for filtering`, 'info', { count: candidates.length });

  if (candidates.length === 0) {
    emit('memory_filtered', 'No memories found after recall', 'info');
    debugGraphState("memoryNode", state, { memoriesFound: 0 });
    return {};
  }

  // 5️⃣ LLM Filtering
  const llm = buildModel([]);
  const candidatesText = candidates.map((m, i) => `[${i}] Title: ${m.title || 'N/A'}\nContent: ${m.content}`).join('\n\n');
  
  const filterPrompt = `
User Question: "${query}"

Below is a list of memories retrieved from the user's personal database.
Some may be relevant, others may be irrelevant "noise" from a broad search.

Select ONLY the memories that are GENUINELY RELEVANT to answering the user's question.

Memories:
${candidatesText}

Instruction:
Return a JSON array of the indices (e.g. [0, 2]) for the relevant memories.
If none are relevant, return an empty array [].
Return ONLY the JSON array.
`;

  const filterResponse = await llm.invoke([new HumanMessage(filterPrompt)]);
  let relevantIndices: number[] = [];
  try {
    const content = (filterResponse.content as string).trim().replace(/```json|```/g, '');
    relevantIndices = JSON.parse(content);
  } catch (e) {
    log({ event: 'memory_filter_parse_failed', error: String(e), raw: filterResponse.content });
    // Fallback: if parse fails, just use first 3 candidates as a safe best-guess
    relevantIndices = candidates.slice(0, 3).map((_, i) => i);
  }

  const finalMemories = relevantIndices.map(idx => candidates[idx]).filter(Boolean);
  
  emit('memory_filtered', `Filtered down to ${finalMemories.length} relevant memories`, 'success', { count: finalMemories.length });

  if (finalMemories.length === 0) {
    debugGraphState("memoryNode", state, { memoriesFound: 0 });
    return { retrievedMemories: [] };
  }

  // 6️⃣ Response Generation (Injection)
  const memoryContext = finalMemories
    .map((m: any) => `Memory: ${m.content}`)
    .join("\n");

  const injectedMessage = new SystemMessage(`
### CONTEXT INJECTION
The following relevant information was retrieved from the user's past data:

${memoryContext}

Instructions for Context:
* Use this information to answer the user's request directly.
* Do NOT call search tools again if the answer is already here.
* Maintain privacy: do not mention retrieval sources unless asked.
`);

  log({
    event: "memory_node_completed",
    userId: state.userId,
    memoriesFound: finalMemories.length,
  });

  debugGraphState("memoryNode", state, {
    memoriesFound: finalMemories.length,
  });

  return {
    messages: [injectedMessage],
    retrievedMemories: finalMemories,
  };
};
