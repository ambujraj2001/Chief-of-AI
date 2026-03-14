import { IFlow, FlowContext, FlowResult, FlowSession } from "../types";

export class CreateReminderFlow implements IFlow {
  id = "create_reminder";
  version = 1;
  priority = 110;

  /**
   * Stage 1 & 2 matching: Regex for reminder creation intent
   */
  match(message: string): boolean {
    const patterns = [
      /remind me/i,
      /set reminder/i,
      /create reminder/i,
      /add reminder/i
    ];
    return patterns.some(regex => regex.test(message));
  }

  /**
   * Main execution logic
   */
  async execute(context: FlowContext, session?: FlowSession): Promise<FlowResult> {
    const message = context.parameters.originalMessage || "";
    
    // 1. Emit thinking event
    context.logger.event("thinking", "Creating your reminder...", "pending");

    // 2. Extract Parameters (Title & Time)
    const extracted = this.parseInput(message);
    if (!extracted || !extracted.title || !extracted.time) {
      context.logger.info("Failed to extract parameters, falling back to agent", { extracted });
      return { type: "fallback" };
    }

    // 3. Parse Time to Timestamp
    const scheduledAt = this.parseTime(extracted.time);
    if (!scheduledAt) {
      context.logger.info("Failed to parse time string, falling back to agent", { timeStr: extracted.time });
      return { type: "fallback" };
    }

    try {
      // 4. Call Reminder Service
      context.logger.event("tool_start" as any, `Saving reminder: "${extracted.title}"`, "pending");
      
      const newReminder = await context.services.reminders.addReminder({
        user_id: context.userId,
        title: extracted.title,
        remind_at: scheduledAt.toISOString(),
        status: "active"
      });

      // 5. Success Response
      const formattedTime = scheduledAt.toLocaleString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const reply = `Reminder created: **${extracted.title}** at **${formattedTime}**.`;
      context.sse.sendFinal(reply);

      return {
        type: "success",
        reply
      };
    } catch (error: any) {
      context.logger.error("Failed to create reminder", error);
      return { type: "fallback" };
    }
  }

  /**
   * Simple deterministic extractor
   * Pattern: "...(to|for) [TITLE] (at|on) [TIME]"
   */
  private parseInput(message: string): { title: string; time: string } | null {
    const lower = message.toLowerCase();
    
    // Find markers
    const toIndex = lower.indexOf(" to ");
    const forIndex = lower.indexOf(" for ");
    const atIndex = lower.indexOf(" at ");
    const onIndex = lower.indexOf(" on ");

    const actionIndex = toIndex !== -1 ? toIndex + 4 : (forIndex !== -1 ? forIndex + 5 : -1);
    const timeMarkerIndex = atIndex !== -1 ? atIndex : (onIndex !== -1 ? onIndex : -1);

    if (actionIndex === -1 || timeMarkerIndex === -1 || timeMarkerIndex < actionIndex) {
      return null;
    }

    const title = message.substring(actionIndex, timeMarkerIndex).trim();
    const time = message.substring(timeMarkerIndex + 4).trim(); // Skip "at " or "on "

    return title && time ? { title, time } : null;
  }

  /**
   * Deterministic time parser for common formats
   */
  private parseTime(timeStr: string): Date | null {
    const now = new Date();
    let target = new Date(now);
    const lower = timeStr.toLowerCase();

    // 1. Handle Day
    if (lower.includes("tomorrow")) {
      target.setDate(now.getDate() + 1);
    } else if (lower.includes("today")) {
      // already current date
    }

    // 2. Handle Time (e.g., 5pm, 7:30 pm)
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3];

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    target.setHours(hours, minutes, 0, 0);

    // If time has passed today and no specific day was mentioned, assume tomorrow
    if (target < now && !lower.includes("tomorrow") && !lower.includes("today")) {
      target.setDate(now.getDate() + 1);
    }

    return target;
  }
}

export const createReminderFlow = new CreateReminderFlow();
