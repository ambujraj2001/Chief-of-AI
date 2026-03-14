import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class ListTasksFlow implements IFlow {
  id = "list_tasks";
  version = 1;
  priority = 100;

  match(message: string): boolean {
    const patterns = [
      /show.*task/i,
      /list.*task/i,
      /what.*task/i,
      /^tasks$/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    context.logger.event("thinking", "Fetching your tasks...", "pending");

    try {
      context.logger.event("tool_start" as any, "Retrieving tasks from database", "pending");
      const tasks = await context.services.tasks.getUserTasks(context.userId);

      let reply: string;
      if (!tasks || tasks.length === 0) {
        reply = "You don't have any tasks yet.";
      } else {
        const taskList = tasks
          .map((t: any, i: number) => `${i + 1}. ${t.title}${t.status ? ` [${t.status}]` : ""}`)
          .join("\n");
        reply = `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""}:\n${taskList}`;
      }

      context.sse.sendFinal(reply);
      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to list tasks", error);
      return { type: "fallback" };
    }
  }
}

export const listTasksFlow = new ListTasksFlow();
