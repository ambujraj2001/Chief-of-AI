import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class CreateTaskFlow implements IFlow {
  id = "create_task";
  version = 1;
  priority = 110;

  match(message: string): boolean {
    const patterns = [
      /create.*task/i,
      /add.*task/i,
      /new.*task/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const message = context.parameters.originalMessage || "";
    context.logger.event("thinking", "Creating your task...", "pending");

    const title = this.extractTitle(message);
    if (!title) {
      context.logger.info("Could not extract task title, falling back to agent");
      return { type: "fallback" };
    }

    try {
      context.logger.event("tool_start" as any, `Saving task: "${title}"`, "pending");
      
      const newTask = await context.services.tasks.addTask({
        user_id: context.userId,
        title,
        status: "pending"
      });

      const reply = `Task created: **${newTask.title}**.`;
      context.sse.sendFinal(reply);

      return { type: "success", reply };
    } catch (error: any) {
      context.logger.error("Failed to create task", error);
      return { type: "fallback" };
    }
  }

  private extractTitle(message: string): string | null {
    const lower = message.toLowerCase();
    const markers = ["task", "add", "create", "new", "to"];
    
    let title = message;
    
    // Attempt to slice out the common verbs/nouns at the start
    const words = message.split(" ");
    let startIndex = 0;
    
    // Skip words until we find something that looks like the start of the title
    for (let i = 0; i < words.length; i++) {
        if (markers.includes(words[i].toLowerCase())) {
            startIndex = i + 1;
        } else {
            break;
        }
    }
    
    if (startIndex >= words.length) {
        // Try a more aggressive split if we couldn't find a clear break
        // Example: "add task finish YC application"
        // Most common pattern is "add task [Title]" or "to [Title]"
        const toIndex = lower.indexOf(" to ");
        if (toIndex !== -1) {
            return message.substring(toIndex + 4).trim();
        }
        
        const taskIndex = lower.indexOf("task ");
        if (taskIndex !== -1) {
            return message.substring(taskIndex + 5).trim();
        }
        
        return null;
    }

    return words.slice(startIndex).join(" ").trim() || null;
  }
}

export const createTaskFlow = new CreateTaskFlow();
