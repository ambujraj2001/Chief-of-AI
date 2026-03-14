import { SupabaseClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { UserRow } from "../types/user.types";
import { AIEvent } from "../types/aiEvent.types";

/**
 * The Services layer accessible to flows
 */
export interface FlowServices {
  reminders: any;
  tasks: any;
  entries: any;
  users: any;
  files: any;
  mail: any;
  apps: any;
}

/**
 * Logger interface for flows, wrapping the system's log utility
 */
export interface FlowLogger {
  info: (message: string, data?: any) => void;
  error: (message: string, err: Error, data?: any) => void;
  event: (type: AIEvent["type"], message: string, status?: AIEvent["status"], data?: any) => void;
}

/**
 * Context provided to every flow execution
 */
export interface FlowContext {
  userId: string;
  user: UserRow;
  parameters: Record<string, any>;
  conversationId?: string;

  services: FlowServices;
  db: SupabaseClient;
  redis: Redis;
  logger: FlowLogger;

  sse: {
    emit: (event: AIEvent) => void;
    sendFinal: (reply: string) => void;
  };
}

/**
 * Result returned by a flow execution
 */
export interface FlowResult {
  type: "success" | "fallback";
  reply?: string;
}

/**
 * Redis-stored session for multi-turn flows
 */
export interface FlowSession {
  flowId: string;
  flowVersion: number;
  step: string;
  context: Record<string, any>;
  expiresAt: number;
}

/**
 * Core Interface all deterministic flows must implement
 */
export interface IFlow {
  id: string;
  version: number;
  priority: number;

  /**
   * Quick check if the flow should handle this message (Stage 1/2)
   */
  match(message: string): boolean;

  /**
   * Main execution logic
   */
  execute(
    context: FlowContext,
    session?: FlowSession
  ): Promise<FlowResult>;
}

/**
 * Result of the intent routing process
 */
export interface FlowMatch {
  flowId: string;
  parameters: Record<string, any>;
  confidence: number;
}
