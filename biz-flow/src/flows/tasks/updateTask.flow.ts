import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";
import { sessionManager } from "../session";

export class UpdateTaskFlow implements IFlow {
  id = "update_task";
  version = 1;
  priority = 115;

  match(message: string): boolean {
    const patterns = [
      /update.*task/i,
      /edit.*task/i,
      /rename.*task/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const userId = context.userId;
    const message = (context.parameters.originalMessage || "").trim();

    // Resume flow
    if (session) {
      if (session.step === "await_selection") {
        return this.handleSelection(context, session, message);
      }
      if (session.step === "await_new_title") {
        return this.handleUpdate(context, session, message);
      }
    }

    // Initial flow
    context.logger.event("thinking", "Fetching tasks to update...", "pending");

    try {
      const tasks = await context.services.tasks.getUserTasks(userId);

      if (!tasks || tasks.length === 0) {
        const reply = "You don't have any tasks to update.";
        context.sse.sendFinal(reply);
        return { type: "success", reply };
      }

      const listString = tasks
        .map((t: any, i: number) => `${i + 1}. ${t.title}`)
        .join("\n");

      const prompt = `Which task would you like to update?\n\n${listString}\n\nReply with the **number** or the **title**.`;
      
      await sessionManager.setSession(userId, {
        flowId: this.id,
        flowVersion: this.version,
        step: "await_selection",
        context: { tasks }
      });

      context.sse.sendFinal(prompt);

      return { type: "success", reply: prompt };
    } catch (error: any) {
      context.logger.error("Failed to start update_task flow", error);
      return { type: "fallback" };
    }
  }

  private async handleSelection(context: FlowContext, session: FlowSession, message: string): Promise<FlowResult> {
    const tasks = session.context.tasks as any[];
    const input = message.toLowerCase();
    
    // Numeric match
    const index = parseInt(input) - 1;
    let selected = (!isNaN(index) && index >= 0 && index < tasks.length) ? tasks[index] : null;

    // Title match
    if (!selected) {
      selected = tasks.find(t => t.title.toLowerCase().includes(input)) || null;
    }

    if (!selected) {
      const retry = "I couldn't identify that task. Please reply with the **number** or the **title**.";
      context.sse.sendFinal(retry);
      return { type: "success", reply: retry };
    }

    const nextPrompt = `What should be the new title for: **${selected.title}**?`;
    
    await sessionManager.setSession(context.userId, {
      ...session,
      step: "await_new_title",
      context: { ...session.context, taskId: selected.id, oldTitle: selected.title }
    });

    context.sse.sendFinal(nextPrompt);
    return { type: "success", reply: nextPrompt };
  }

  private async handleUpdate(context: FlowContext, session: FlowSession, message: string): Promise<FlowResult> {
    const { taskId, oldTitle } = session.context;
    
    if (!message || message.length < 2) {
      const retry = "The title seems too short. What should be the new title?";
      context.sse.sendFinal(retry);
      return { type: "success", reply: retry };
    }

    try {
      context.logger.event("tool_start" as any, `Updating task to: "${message}"`, "pending");
      
      await context.services.tasks.updateTask(taskId, context.userId, {
        title: message
      });

      const reply = `Task updated successfully!\nOld: ~~${oldTitle}~~\nNew: **${message}**`;
      context.sse.sendFinal(reply);

      await sessionManager.clearSession(context.userId);

      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to update task in flow", error);
      await sessionManager.clearSession(context.userId);
      return { type: "fallback" };
    }
  }
}

export const updateTaskFlow = new UpdateTaskFlow();
