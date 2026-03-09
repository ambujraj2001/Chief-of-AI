import axios from "axios";
import { supabase } from "../config/supabase";
import { GraphState } from "../graphs/state";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { tools as staticTools } from "../tools";
import { log } from "../utils/logger";

/**
 * Direct Mistral Embedding fetcher
 */
async function getMistralEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  const url = "https://api.mistral.ai/v1/embeddings";

  const response = await axios.post(
    url,
    {
      model: "mistral-embed",
      input: [text],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.data[0].embedding;
}

/**
 * toolDiscoveryNode: Dynamically retrieves relevant tools from Supabase
 * using Hybrid Search (Vector + Keyword) based on the user's query.
 */
export const toolDiscoveryNode = async (state: GraphState) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const query =
    typeof lastMessage.content === "string" ? lastMessage.content : "";

  if (!query) {
    return { retrievedTools: [] };
  }

  log({
    event: "tool_discovery_started",
    userId: state.userId,
    query,
  });

  // 1. Fetch embedding via direct Mistral API
  let queryEmbedding: number[] = [];
  try {
    queryEmbedding = await getMistralEmbedding(query);
  } catch (err) {
    console.error("Embedding generation failed:", err);
    // Continue; RPC will handle null embedding by relying on keyword search
  }

  // 2. Call match_tools RPC via Supabase client
  const { data: matchedTools, error } = await supabase.rpc("match_tools", {
    query_embedding: queryEmbedding.length > 0 ? queryEmbedding : null,
    query_text: query,
    match_threshold: 0.2,
    match_count: 10,
  });

  if (error) {
    console.error("Supabase tool discovery error:", error);
    return { retrievedTools: [] };
  }

  // 3. Map retrieved JSON results into LangChain tool objects
  const retrievedTools = (matchedTools || []).map((matched: any) => {
    const staticTool = staticTools.find((t: any) => t.name === matched.name);
    if (staticTool) return staticTool;

    return new DynamicStructuredTool({
      name: matched.name,
      description: matched.description,
      schema: matched.schema?.properties
        ? z.object(matched.schema.properties)
        : z.object({}),
      func: async (args: any) => {
        log({
          event: "dynamic_tool_called_without_impl",
          toolName: matched.name,
          args,
        });
        return `Tool "${matched.name}" was found in the registry but has no local implementation code yet. Arguments passed: ${JSON.stringify(args)}`;
      },
    });
  });

  log({
    event: "tool_discovery_completed",
    userId: state.userId,
    count: retrievedTools.length,
    found: retrievedTools.map((t: any) => t.name),
  });

  return { retrievedTools };
};
