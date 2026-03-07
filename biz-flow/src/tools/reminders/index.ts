import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  addReminder,
  updateReminder,
  deleteReminder,
  getUserReminders,
  findReminderByTitle,
} from "../../services/reminder.service";
import { findUserByAccessCode } from "../../services/user.service";

export const addReminderTool = tool(
  async ({ accessCode, title, remindAt }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      // Smart Upsert: Check if a reminder with the same title already exists
      const existing = await findReminderByTitle(user.id, title);
      if (existing) {
        await updateReminder(existing.id, user.id, {
          remind_at: remindAt,
        });
        return `Reminder "${title}" updated successfully (Existing ID: ${existing.id})`;
      }

      const reminder = await addReminder({
        user_id: user.id,
        title,
        status: "active",
        remind_at: remindAt,
      });

      return `Successfully added reminder: ${reminder.title} at ${reminder.remind_at} (ID: ${reminder.id})`;
    } catch (err: unknown) {
      if (err instanceof Error) return `Failed to add reminder: ${err.message}`;
      return "Failed to add reminder.";
    }
  },
  {
    name: "add_reminder",
    description: "Adds a new reminder for the user at a specific time.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      title: z.string().describe("The title or description of the reminder"),
      remindAt: z
        .string()
        .describe("ISO date string for when the reminder should trigger"),
    }),
  },
);

export const updateReminderTool = tool(
  async ({ accessCode, reminderId, status, title, remindAt }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      const updates: any = {};
      if (status) updates.status = status;
      if (title) updates.title = title;
      if (remindAt) updates.remind_at = remindAt;

      const reminder = await updateReminder(reminderId, user.id, updates);
      return `Successfully updated reminder: ${reminder.title}`;
    } catch (err: unknown) {
      if (err instanceof Error)
        return `Failed to update reminder: ${err.message}`;
      return "Failed to update reminder.";
    }
  },
  {
    name: "update_reminder",
    description:
      "Updates an existing reminder. Use get_reminders to find reminder IDs first if needed.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      reminderId: z.string().describe("The UUID of the reminder to update"),
      status: z
        .enum(["active", "completed", "dismissed"])
        .optional()
        .describe("New status for the reminder"),
      title: z.string().optional().describe("New title for the reminder"),
      remindAt: z
        .string()
        .optional()
        .describe("New remind time for the reminder"),
    }),
  },
);

export const getRemindersTool = tool(
  async ({ accessCode, status }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      let reminders = await getUserReminders(user.id);

      if (status) {
        reminders = reminders.filter((r) => r.status === status);
      }

      if (reminders.length === 0) return "No reminders found.";

      return reminders
        .map(
          (r) =>
            `ID: ${r.id}\nTitle: ${r.title}\nStatus: ${r.status}\nRemind At: ${r.remind_at}`,
        )
        .join("\n\n");
    } catch (err: unknown) {
      if (err instanceof Error)
        return `Failed to get reminders: ${err.message}`;
      return "Failed to get reminders.";
    }
  },
  {
    name: "get_reminders",
    description:
      "Retrieves the list of reminders for the user. Call this first if you need to find a reminder ID to update or delete.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      status: z
        .enum(["active", "completed", "dismissed"])
        .optional()
        .describe("Filter by reminder status"),
    }),
  },
);

export const deleteReminderTool = tool(
  async ({ accessCode, reminderId }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      await deleteReminder(reminderId, user.id);
      return `Successfully deleted reminder ID: ${reminderId}`;
    } catch (err: unknown) {
      if (err instanceof Error)
        return `Failed to delete reminder: ${err.message}`;
      return "Failed to delete reminder.";
    }
  },
  {
    name: "delete_reminder",
    description:
      "Deletes a reminder by ID. IMPORTANT: NEVER call this tool immediately after get_reminders. After fetching reminders, you MUST first respond with a clarification asking the user which one to delete, then call this tool only after the user confirms. The 'id' parameter must be an exact UUID copied from the get_reminders result.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      reminderId: z.string().describe("The UUID of the reminder to delete"),
    }),
  },
);
