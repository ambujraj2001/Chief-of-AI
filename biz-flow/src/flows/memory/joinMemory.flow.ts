import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class JoinMemoryFlow implements IFlow {
  id = "join_memory";
  version = 1;
  priority = 140;

  /**
   * Stage 1 & 2 matching: Intent to join memory or enter share code
   */
  match(message: string): boolean {
    const patterns = [
      /join.*memory/i,
      /enter.*share.*code/i,
      /^MEM-[A-Z0-9]{6}$/i // Pre-emptively match the code format itself
    ];
    return patterns.some((regex) => regex.test(message));
  }

  /**
   * Execution logic for joining a shared memory
   */
  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = context.parameters.originalMessage || "";

    // 1. Extract share code from message
    const codeMatch = message.match(/MEM-[A-Z0-9]{6}/i);
    const code = codeMatch ? codeMatch[0].toUpperCase() : null;

    // 2. If no code found, ask user to provide one (Stateful)
    if (!code) {
      if (session && session.step === "await_code") {
        // We already asked, but still no code in the new message
        const retry = "I couldn't find a valid share code in your message. It should look like **MEM-XXXXXX**. Please try again.";
        context.sse.sendFinal(retry);
        return { type: "success", reply: retry };
      }

      const prompt = "Please provide the **Share Code** for the memory you'd like to join (e.g., MEM-ABC123).";
      
      const { sessionManager } = await import("../session");
      await sessionManager.setSession(userId, {
        flowId: this.id,
        flowVersion: this.version,
        step: "await_code",
        context: {}
      });

      context.sse.sendFinal(prompt);
      return { type: "success", reply: prompt };
    }

    // 3. Code found, attempt to join
    context.logger.event("thinking", `Joining memory with code: ${code}...`, "pending");

    try {
      context.logger.event("tool_start" as any, "Executing joinSharedMemory via EntryService", "pending");
      
      await context.services.entries.joinSharedMemory(userId, code);

      const reply = `Successfully joined the shared memory! You can now access it in your memories list.`;
      context.sse.sendFinal(reply);

      const { sessionManager } = await import("../session");
      await sessionManager.clearSession(userId);

      return {
        type: "success",
        reply
      };
    } catch (error: any) {
      context.logger.error("Failed to join shared memory", error);
      
      const errorReply = `Failed to join: **${error.message}**. Would you like to try a different code?`;
      context.sse.sendFinal(errorReply);
      
      // We keep the session open so they can retry
      return { type: "success", reply: errorReply };
    }
  }
}

export const joinMemoryFlow = new JoinMemoryFlow();
