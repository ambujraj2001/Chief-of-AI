import { supabase } from "../config/supabase";
import { redis } from "../config/redis";
import { log } from "../utils/logger";
import { FlowContext, FlowResult, FlowSession, IFlow } from "./types";
import { registry } from "./registry";
import { sessionManager } from "./session";
import { UserRow } from "../types/user.types";
import { AIEvent } from "../types/aiEvent.types";

// Import Service Layers
import * as reminderService from "../services/reminder.service";
import * as taskService from "../services/task.service";
import * as entryService from "../services/entry.service";
import * as userService from "../services/user.service";
import * as fileService from "../services/file.service";
import * as mailService from "../services/mail.service";
import * as appService from "../services/app.service";

export class FlowEngine {
  /**
   * Orchestrates the execution of a flow
   */
  async executeFlow(
    flowId: string,
    user: UserRow,
    parameters: Record<string, any>,
    options: {
      onEvent: (event: AIEvent) => void;
      conversationId?: string;
    }
  ): Promise<FlowResult> {
    const startTime = Date.now();
    const flow = registry.getFlowById(flowId);

    if (!flow) {
      log({
        event: "flow_fallback",
        userId: user.id,
        reason: "flow_not_found",
        flowId,
      });
      return { type: "fallback" };
    }

    log({
      event: "flow_lifecycle",
      action: "flow_selected",
      flowId,
      userId: user.id,
      parameters,
    });

    const context = this.createContext(user, parameters, options);
    const session = await sessionManager.getSession(user.id);

    try {
      const result = await flow.execute(context, session || undefined);

      log({
        event: "flow_lifecycle",
        action: "flow_success",
        flowId,
        userId: user.id,
        latency: Date.now() - startTime,
      });

      return result;
    } catch (error: any) {
      log({
        event: "flow_lifecycle",
        action: "flow_error",
        flowId,
        userId: user.id,
        error: error.message,
      });

      // On error, we fallback to the agent to ensure the user gets a response
      return { type: "fallback" };
    }
  }

  /**
   * Helper function for the integration point
   */
  async tryRunDeterministicFlow(
    message: string,
    user: UserRow,
    options: {
      onEvent: (event: AIEvent) => void;
      conversationId?: string;
    },
    routerMatch?: any // Optional pre-matched router result
  ): Promise<FlowResult | null> {
    // 1. Check for Active Session
    const session = await sessionManager.getSession(user.id);
    if (session) {
      return this.executeFlow(session.flowId, user, {}, options);
    }

    // 2. Attempt Routing
    const { router } = await import("./router");
    const match = routerMatch || (await router.match(message));

    if (match && match.confidence > 0.9) {
      return this.executeFlow(match.flowId, user, match.parameters, options);
    }

    return null;
  }

  /**
   * Factory for creating FlowContext
   */
  private createContext(
    user: UserRow,
    parameters: Record<string, any>,
    options: { onEvent: (event: AIEvent) => void; conversationId?: string }
  ): FlowContext {
    return {
      userId: user.id,
      user,
      parameters,
      conversationId: options.conversationId,
      db: supabase,
      redis,
      services: {
        reminders: reminderService,
        tasks: taskService,
        entries: entryService,
        users: userService,
        files: fileService,
        mail: mailService,
        apps: appService,
      },
      logger: {
        info: (msg, data) => log({ event: "flow_info", userId: user.id, message: msg, ...data }),
        error: (msg, err, data) => log({ event: "flow_error", userId: user.id, message: msg, error: err.message, ...data }),
        event: (type, message, status = "info", data) => 
          options.onEvent({ id: Math.random().toString(36).substr(7), type, message, status, timestamp: Date.now(), data }),
      },
      sse: {
        emit: options.onEvent,
        sendFinal: (reply) => options.onEvent({ 
          id: Math.random().toString(36).substr(7), 
          type: "final_reply" as any, 
          message: reply, 
          status: "success", 
          timestamp: Date.now() 
        }),
      },
    };
  }
}

export const engine = new FlowEngine();
