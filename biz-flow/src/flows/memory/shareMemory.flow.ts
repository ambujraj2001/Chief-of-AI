import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";
import { sessionManager } from "../session";

export class ShareMemoryFlow implements IFlow {
  id = "share_memory";
  version = 1;
  priority = 130;

  /**
   * Stage 1 & 2 matching: Intent to share memory/generate code
   */
  match(message: string): boolean {
    const patterns = [
      /share.*memory/i,
      /generate.*share.*code/i,
      /create.*share.*code/i,
      /memory.*share.*code/i
    ];
    return patterns.some((regex) => regex.test(message));
  }

  /**
   * Execution logic for creating a memory share code (Stateful)
   */
  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = context.parameters.originalMessage || "";

    // 1. Resume if session exists
    if (session && session.step === "await_selection") {
      return this.handleSelection(context, session, message);
    }

    // 2. Initial Execution - Fetch memories and check if selection is needed
    context.logger.event("thinking", "Checking your memories...", "pending");

    try {
      const memories = await context.services.entries.getUserMemories(userId);

      if (!memories || memories.length === 0) {
        const reply = "You don't have any memories to share.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      // If only one memory exists, share it immediately
      if (memories.length === 1) {
        return this.generateCode(context, memories[0]);
      }

      // If multiple, ask for selection
      const listString = memories
        .map((m: any, i: number) => `${i + 1}. ${m.title || m.content.substring(0, 40) + "..."}`)
        .join("\n");

      const prompt = `Which memory would you like to share?\n\n${listString}\n\nReply with the **number** or a part of the **title**.`;
      
      await sessionManager.setSession(userId, {
        flowId: this.id,
        flowVersion: this.version,
        step: "await_selection",
        context: { memories }
      });

      context.sse.sendFinal(prompt);

      return {
        type: "success",
        reply: prompt
      };
    } catch (error: any) {
      context.logger.error("Failed to start share_memory flow", error);
      return { type: "fallback" };
    }
  }

  /**
   * Handles user response to the memory selection prompt
   */
  private async handleSelection(context: FlowContext, session: FlowSession, message: string): Promise<FlowResult> {
    const memories = session.context.memories as any[];
    const input = message.trim().toLowerCase();
    
    // 1. Try numeric match
    const index = parseInt(input) - 1;
    let selected = (!isNaN(index) && index >= 0 && index < memories.length) ? memories[index] : null;

    // 2. Try title/content match if numeric failed
    if (!selected) {
      selected = memories.find(m => 
        (m.title && m.title.toLowerCase().includes(input)) || 
        m.content.toLowerCase().includes(input)
      ) || null;
    }

    if (!selected) {
      const retryPrompt = "I couldn't identify which memory you want to share. Please reply with the **number** or the **title**.";
      context.sse.sendFinal(retryPrompt);
      return { type: "success", reply: retryPrompt };
    }

    return this.generateCode(context, selected);
  }

  /**
   * Helper to call service and finish flow
   */
  private async generateCode(context: FlowContext, memory: any): Promise<FlowResult> {
    try {
      context.logger.event("tool_start" as any, `Generating share code for: "${memory.title || "Memory"}"`, "pending");
      
      const shareCode = await context.services.entries.createMemoryShareCode(context.userId, memory.id);

      const reply = `Memory shared successfully! Use this code to join: **${shareCode}**`;
      context.sse.sendFinal(reply);

      // Clear session if it exists
      await sessionManager.clearSession(context.userId);

      return {
        type: "success",
        reply
      };
    } catch (error: any) {
      context.logger.error("Failed to generate share code in flow", error);
      await sessionManager.clearSession(context.userId);
      return { type: "fallback" };
    }
  }
}

export const shareMemoryFlow = new ShareMemoryFlow();
