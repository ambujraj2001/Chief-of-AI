import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";
import { sessionManager } from "../session";

export class DeleteTaskFlow implements IFlow {
  id = "delete_task";
  version = 1;
  priority = 115;

  match(message: string): boolean {
    const patterns = [
      /delete.*task/i,
      /remove.*task/i,
      /cancel.*task/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = context.parameters.originalMessage || "";

    // Resume from session
    if (session && session.step === "await_selection") {
      return this.handleSelection(context, session, message);
    }

    // Initial run
    context.logger.event("thinking", "Fetching tasks to delete...", "pending");

    try {
      const tasks = await context.services.tasks.getUserTasks(userId);

      if (!tasks || tasks.length === 0) {
        const reply = "You don't have any tasks to delete.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const listString = tasks
        .map((t: any, i: number) => `${i + 1}. ${t.title}`)
        .join("\n");

      const prompt = `Which task would you like to delete?\n\n${listString}\n\nReply with the **number** or the **title**.`;
      
      await sessionManager.setSession(userId, {
        flowId: this.id,
        flowVersion: this.version,
        step: "await_selection",
        context: { tasks }
      });

      context.sse.sendFinal(prompt);

      return {
        type: "success",
        reply: prompt
      };
    } catch (error: any) {
      context.logger.error("Failed to start delete_task flow", error);
      return { type: "fallback" };
    }
  }

  private async handleSelection(context: FlowContext, session: FlowSession, message: string): Promise<FlowResult> {
    const tasks = session.context.tasks as any[];
    const input = message.trim().toLowerCase();
    
    // index-based match
    const index = parseInt(input) - 1;
    let selected = (!isNaN(index) && index >= 0 && index < tasks.length) ? tasks[index] : null;

    // title-based match
    if (!selected) {
      selected = tasks.find(t => t.title.toLowerCase().includes(input)) || null;
    }

    if (!selected) {
      const retry = "I couldn't identify that task. Please reply with the **number** or the **title** of the task you want to delete.";
      context.sse.sendFinal(retry);
      return { type: "success", reply: retry };
    }

    try {
      context.logger.event("tool_start" as any, `Deleting task: "${selected.title}"`, "pending");
      await context.services.tasks.deleteTask(selected.id, context.userId);

      const reply = `Task deleted: **${selected.title}**.`;
      context.sse.sendFinal(reply);

      await sessionManager.clearSession(context.userId);

      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to delete task in flow", error);
      await sessionManager.clearSession(context.userId);
      return { type: "fallback" };
    }
  }
}

export const deleteTaskFlow = new DeleteTaskFlow();
