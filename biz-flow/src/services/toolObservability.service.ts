import { supabase } from "../config/supabase";
import { log } from "../utils/logger";

interface DiscoveryEventInput {
  userId: string;
  intent: string;
  query: string;
  matchedTools: string[];
  selectedTools: string[];
  allowedTools: string[];
  blockedTools: string[];
}

interface ExecutionEventInput {
  userId: string;
  toolName: string;
  intent: string;
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
}

export const recordToolDiscoveryEvent = async (
  input: DiscoveryEventInput,
): Promise<void> => {
  try {
    const payload = {
      user_id: input.userId,
      intent: input.intent,
      query: input.query.slice(0, 1000),
      matched_tools: input.matchedTools,
      selected_tools: input.selectedTools,
      allowed_tools: input.allowedTools,
      blocked_tools: input.blockedTools,
      matched_count: input.matchedTools.length,
      selected_count: input.selectedTools.length,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("tool_discovery_events").insert(payload);
    if (error) {
      log({
        event: "tool_discovery_event_insert_failed",
        userId: input.userId,
        error: error.message,
      });
    }
  } catch (error) {
    log({
      event: "tool_discovery_event_insert_failed",
      userId: input.userId,
      error: String(error),
    });
  }
};

export const recordToolExecutionEvent = async (
  input: ExecutionEventInput,
): Promise<void> => {
  try {
    const payload = {
      user_id: input.userId,
      tool_name: input.toolName,
      intent: input.intent,
      success: input.success,
      latency_ms: input.latencyMs,
      error_message: input.errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("tool_execution_events").insert(payload);
    if (error) {
      log({
        event: "tool_execution_event_insert_failed",
        userId: input.userId,
        toolName: input.toolName,
        error: error.message,
      });
    }
  } catch (error) {
    log({
      event: "tool_execution_event_insert_failed",
      userId: input.userId,
      toolName: input.toolName,
      error: String(error),
    });
  }
};
