import axios from "axios";
import { supabase } from "../config/supabase";
import { GraphState } from "../graphs/state";
import { tools as staticTools, toolByName } from "../tools";
import { toolMetadataByName } from "../tools/toolMetadata";
import { recordToolDiscoveryEvent } from "../services/toolObservability.service";
import { log } from "../utils/logger";

import { generateEmbedding } from "../services/embedding.service";

/**
 * toolDiscoveryNode: Dynamically retrieves relevant tools from Supabase
 * using Hybrid Search (Vector + Keyword) based on the user's query.
 */
export const toolDiscoveryNode = async (state: GraphState) => {
  const lastHumanMessage = [...state.messages]
    .reverse()
    .find((m) => m._getType() === "human");
  const query =
    typeof lastHumanMessage?.content === "string" ? lastHumanMessage.content : "";

  if (!query) {
    return { retrievedTools: [] };
  }

  const metadataList = Object.values(toolMetadataByName);
  const intent = state.intent || "general_chat";
  const allowedMetadata = metadataList.filter((m) =>
    m.intents.includes(intent as any),
  );
  const allowedToolNames = new Set(allowedMetadata.map((m) => m.name));
  const allowedCategories = Array.from(
    new Set(allowedMetadata.map((m) => m.category)),
  );
  const allowedTags = Array.from(
    new Set(allowedMetadata.flatMap((m) => m.tags)),
  );

  log({
    event: "tool_discovery_started",
    userId: state.userId,
    query,
    intent,
    allowedCategories,
    allowedTags,
    allowedToolCount: allowedToolNames.size,
  });

  // 1. Fetch embedding via centralized Mistral service
  let queryEmbedding: number[] = [];
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (err) {
    console.error("Embedding generation failed:", err);
    // Continue; RPC will handle null embedding by relying on keyword search
  }

  // 2. Call match_tools RPC via Supabase client
  // Prefer scoped retrieval (tool/category prefilter) and fallback to legacy signature.
  let matchedTools: any[] | null = null;
  let error: any = null;
  const modernPayload = {
    query_embedding: queryEmbedding.length > 0 ? queryEmbedding : null,
    query_text: query,
    match_threshold: 0.2,
    match_count: 10,
    allowed_tools:
      allowedToolNames.size > 0 ? Array.from(allowedToolNames) : null,
    allowed_categories: allowedCategories.length > 0 ? allowedCategories : null,
    allowed_tags: allowedTags.length > 0 ? allowedTags : null,
  };
  const modernRes = await supabase.rpc("match_tools", modernPayload);
  matchedTools = modernRes.data;
  error = modernRes.error;

  if (error) {
    const legacyRes = await supabase.rpc("match_tools", {
      query_embedding: queryEmbedding.length > 0 ? queryEmbedding : null,
      query_text: query,
      match_threshold: 0.2,
      match_count: 10,
    });
    matchedTools = legacyRes.data;
    error = legacyRes.error;
  }

  if (error) {
    console.error("Supabase tool discovery error:", error);
    return { retrievedTools: [] };
  }

  // 3. Keep only runtime-implemented tools and apply allowlist locally for safety.
  const matchedNames = (matchedTools || []).map((t: any) => t.name);
  const blockedTools: string[] = [];
  const runtimeMissing: string[] = [];
  const selectedNames: string[] = [];
  const retrievedTools = (matchedTools || [])
    .filter((matched: any) => {
      if (allowedToolNames.size > 0 && !allowedToolNames.has(matched.name)) {
        blockedTools.push(matched.name);
        return false;
      }
      const implemented = !!toolByName[matched.name];
      if (!implemented) {
        runtimeMissing.push(matched.name);
      }
      return implemented;
    })
    .map((matched: any) => {
      selectedNames.push(matched.name);
      return (
        toolByName[matched.name] ||
        staticTools.find((t: any) => t.name === matched.name)
      );
    })
    .filter(Boolean) as any[];

  if (runtimeMissing.length > 0) {
    log({
      event: "tool_registry_runtime_mismatch",
      userId: state.userId,
      intent,
      runtimeMissing,
    });
  }

  void recordToolDiscoveryEvent({
    userId: state.userId,
    intent,
    query,
    matchedTools: matchedNames,
    selectedTools: selectedNames,
    allowedTools: Array.from(allowedToolNames),
    blockedTools,
  });

  log({
    event: "tool_discovery_completed",
    userId: state.userId,
    count: retrievedTools.length,
    found: retrievedTools.map((t: any) => t.name),
    blockedTools,
    runtimeMissing,
  });

  return { retrievedTools };
};
