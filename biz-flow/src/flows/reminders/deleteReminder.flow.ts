import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";
import { sessionManager } from "../session";

export class DeleteReminderFlow implements IFlow {
  id = "delete_reminder";
  version = 1;
  priority = 120;

  /**
   * Stage 1 & 2 matching: Intent to delete/remove/cancel reminders
   */
  match(message: string): boolean {
    const patterns = [
      /delete.*reminder/i,
      /remove.*reminder/i,
      /cancel.*reminder/i,
      /^delete$/i
    ];
    return patterns.some((regex) => regex.test(message));
  }

  /**
   * Execution logic (Stateful)
   */
  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = context.parameters.originalMessage || "";

    // Step A: Resume if session exists
    if (session && session.step === "await_selection") {
      return this.handleSelection(context, session, message);
    }

    // Step B: Initial Execution - Fetch reminders and prompt user
    context.logger.event("thinking", "Fetching your reminders...", "pending");
    
    try {
      const reminders = await context.services.reminders.getUserReminders(userId);

      if (!reminders || reminders.length === 0) {
        const reply = "You don't have any reminders to delete.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      // Format list for user
      const listString = reminders
        .map((r: any, i: number) => `${i + 1}. ${r.title}${r.remind_at ? ` (${new Date(r.remind_at).toLocaleDateString()})` : ""}`)
        .join("\n");

      const prompt = `Which reminder would you like to delete?\n\n${listString}\n\nReply with the **number** or the **title**.`;
      
      // Save session to Redis
      await sessionManager.setSession(userId, {
        flowId: this.id,
        flowVersion: this.version,
        step: "await_selection",
        context: { reminders }
      });

      context.sse.sendFinal(prompt);

      return {
        type: "success",
        reply: prompt
      };
    } catch (error: any) {
      context.logger.error("Failed to start delete_reminder flow", error);
      return { type: "fallback" };
    }
  }

  /**
   * Handles user response to the reminder selection prompt
   */
  private async handleSelection(context: FlowContext, session: FlowSession, message: string): Promise<FlowResult> {
    const reminders = session.context.reminders as any[];
    const input = message.trim().toLowerCase();
    
    // 1. Try numeric match
    const index = parseInt(input) - 1;
    let selectedReminder = (!isNaN(index) && index >= 0 && index < reminders.length) ? reminders[index] : null;

    // 2. Try title match if numeric failed
    if (!selectedReminder) {
      selectedReminder = reminders.find(r => r.title.toLowerCase().includes(input)) || null;
    }

    if (!selectedReminder) {
      const retryPrompt = "I couldn't identify which reminder you want to delete. Please reply with the **number** or the exact **title**.";
      context.sse.sendFinal(retryPrompt);
      return { type: "success", reply: retryPrompt };
    }

    try {
      context.logger.event("tool_start" as any, `Deleting reminder: "${selectedReminder.title}"`, "pending");
      
      await context.services.reminders.deleteReminder(selectedReminder.id, context.userId);
      
      const confirmation = `Reminder deleted: **${selectedReminder.title}**.`;
      context.sse.sendFinal(confirmation);

      // Clear session
      await sessionManager.clearSession(context.userId);

      return {
        type: "success",
        reply: confirmation
      };
    } catch (error: any) {
      context.logger.error("Failed to execute deletion in flow", error);
      await sessionManager.clearSession(context.userId);
      return { type: "fallback" };
    }
  }
}

export const deleteReminderFlow = new DeleteReminderFlow();
