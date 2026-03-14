import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";
import { sessionManager } from "../session";

export class JoinAppFlow implements IFlow {
  id = "join_app";
  version = 1;
  priority = 140;

  /**
   * Stage 1 & 2 matching: Intent to join app/workspace or direct code match
   */
  match(message: string): boolean {
    const patterns = [
      /join.*app/i,
      /join.*workspace/i,
      /join.*code/i,
      /enter.*invite.*code/i,
      /APP-[A-Z0-9]{4,6}/i // Matches codes like APP-1A2B
    ];
    return patterns.some((regex) => regex.test(message));
  }

  /**
   * Execution logic for joining a shared workspace
   */
  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = (context.parameters.originalMessage || "").trim();

    // 1. Resume flow if session exists
    if (session && session.step === "await_code") {
      return this.handleJoin(context, message);
    }

    // 2. Initial Run - Try to extract code from input message
    const codeMatch = message.match(/([A-Z0-9]+-[A-Z0-9]{4,6})/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : null;

    if (code) {
      return this.handleJoin(context, code);
    }

    // 3. No code provided - Start multi-turn flow
    const prompt = "Please provide the invite code for the workspace you'd like to join.";
    
    await sessionManager.setSession(userId, {
      flowId: this.id,
      flowVersion: this.version,
      step: "await_code",
      context: {}
    });

    context.sse.sendFinal(prompt);

    return {
      type: "success",
      reply: prompt
    };
  }

  /**
   * Helper to perform the join via service
   */
  private async handleJoin(context: FlowContext, code: string): Promise<FlowResult> {
    context.logger.event("thinking", `Attempting to join workspace with code: ${code}...`, "pending");

    try {
      context.logger.event("tool_start" as any, "Executing joinSharedApp via Service", "pending");
      
      // As requested: context.services.entries.joinSharedApp
      await context.services.entries.joinSharedApp({
        userId: context.userId,
        code: code.toUpperCase()
      });

      const reply = "You have successfully joined the shared workspace.";
      context.sse.sendFinal(reply);

      // Clear session if it exists
      await sessionManager.clearSession(context.userId);

      return {
        type: "success",
        reply
      };
    } catch (error: any) {
      context.logger.error("Failed to join app", error);
      
      const errorMsg = error.message === "Invalid share code." 
        ? "The invite code is invalid or expired." 
        : error.message;

      const retryPrompt = `${errorMsg} Please provide a valid code or type "cancel" to exit.`;
      
      context.sse.sendFinal(retryPrompt);

      // Keep session open for retry
      return {
        type: "success",
        reply: retryPrompt
      };
    }
  }
}

export const joinAppFlow = new JoinAppFlow();
