import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  addTask,
  updateTask,
  deleteTask,
  getUserTasks,
  findTaskByTitle,
} from "../../services/task.service";
import { findUserByAccessCode } from "../../services/user.service";

export const addTaskTool = tool(
  async ({ accessCode, title, priority, dueDate }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      // Smart Upsert: Check if a task with the same title already exists
      const existing = await findTaskByTitle(user.id, title);
      if (existing) {
        await updateTask(existing.id, user.id, {
          priority: priority || "high",
          due_date: dueDate,
        });
        return `Task "${title}" updated successfully (Existing ID: ${existing.id})`;
      }

      const task = await addTask({
        user_id: user.id,
        title,
        status: "pending",
        priority: priority || "high",
        due_date: dueDate,
      });

      return `Successfully added task: ${task.title} (ID: ${task.id})`;
    } catch (err: unknown) {
      if (err instanceof Error) return `Failed to add task: ${err.message}`;
      return "Failed to add task.";
    }
  },
  {
    name: "add_task",
    description:
      "Adds a new task or to-do item for the user. Call this when you need to remember an actionable item.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      title: z.string().describe("The title or description of the task"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe(
          "Priority of the task. Default to high unless otherwise specified.",
        ),
      dueDate: z
        .string()
        .optional()
        .describe("Optional ISO date string for when the task is due"),
    }),
  },
);

export const updateTaskTool = tool(
  async ({ accessCode, taskId, status, priority, title, dueDate }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      const updates: any = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (title) updates.title = title;
      if (dueDate !== undefined) updates.due_date = dueDate;

      const task = await updateTask(taskId, user.id, updates);
      return `Successfully updated task: ${task.title}`;
    } catch (err: unknown) {
      if (err instanceof Error) return `Failed to update task: ${err.message}`;
      return "Failed to update task.";
    }
  },
  {
    name: "update_task",
    description:
      "Updates an existing task. Useful for marking tasks as completed or modifying them. Use get_tasks to find task IDs first if needed.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      taskId: z.string().describe("The UUID of the task to update"),
      status: z
        .enum(["pending", "completed"])
        .optional()
        .describe("New status for the task"),
      priority: z
        .enum(["low", "medium", "high"])
        .optional()
        .describe("New priority for the task"),
      title: z.string().optional().describe("New title for the task"),
      dueDate: z
        .string()
        .optional()
        .describe("New due date for the task, pass an empty string to remove"),
    }),
  },
);

export const getTasksTool = tool(
  async ({ accessCode, status }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      let tasks = await getUserTasks(user.id);

      if (status) {
        tasks = tasks.filter((t) => t.status === status);
      }

      if (tasks.length === 0) return "No tasks found.";

      return tasks
        .map(
          (t) =>
            `ID: ${t.id}\nTitle: ${t.title}\nStatus: ${t.status}\nDue: ${t.due_date || "None"}`,
        )
        .join("\n\n");
    } catch (err: unknown) {
      if (err instanceof Error) return `Failed to get tasks: ${err.message}`;
      return "Failed to get tasks.";
    }
  },
  {
    name: "get_tasks",
    description:
      "Retrieves the list of tasks for the user. Call this first if you need to find a task ID to update or delete.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      status: z
        .enum(["pending", "completed"])
        .optional()
        .describe("Filter by task status"),
    }),
  },
);

export const deleteTaskTool = tool(
  async ({ accessCode, taskId }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      await deleteTask(taskId, user.id);
      return `Successfully deleted task ID: ${taskId}`;
    } catch (err: unknown) {
      if (err instanceof Error) return `Failed to delete task: ${err.message}`;
      return "Failed to delete task.";
    }
  },
  {
    name: "delete_task",
    description:
      "Deletes a task by ID. IMPORTANT: NEVER call this tool immediately after get_tasks. After fetching tasks, you MUST first respond with a clarification asking the user which one to delete, then call this tool only after the user confirms. The 'id' parameter must be an exact UUID copied from the get_tasks result.",
    schema: z.object({
      accessCode: z
        .string()
        .describe("The user access code injected by the system."),
      taskId: z.string().describe("The UUID of the task to delete"),
    }),
  },
);
