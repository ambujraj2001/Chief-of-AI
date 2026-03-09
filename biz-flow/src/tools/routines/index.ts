import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  createRoutine,
  getUserRoutines,
  deleteRoutine,
  updateRoutine,
} from "../../services/routine.service";
import { findUserByAccessCode } from "../../services/user.service";

export const createRoutineTool = tool(
  async ({ accessCode, name, instruction, cronExpression }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      const routine = await createRoutine({
        user_id: user.id,
        name,
        instruction,
        cron_expression: cronExpression,
        is_active: true,
      });

      return `Successfully created AI routine: "${routine.name}" with schedule "${routine.cron_expression}". (ID: ${routine.id})`;
    } catch (err: any) {
      return `Failed to create routine: ${err.message}`;
    }
  },
  {
    name: "create_routine",
    description:
      "Creates a new automated AI routine. Requires a 5-part cron expression for the schedule (e.g. '0 9 * * *' for 9am daily). Use valid cron format.",
    schema: z.object({
      accessCode: z.string().describe("System-injected access code"),
      name: z.string().describe("Descriptive name for the routine"),
      instruction: z
        .string()
        .describe("What the AI should do during this routine"),
      cronExpression: z.string().describe("Standard 5-part cron expression"),
    }),
  },
);

export const listRoutinesTool = tool(
  async ({ accessCode }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      const routines = await getUserRoutines(user.id);
      if (routines.length === 0) return "You have no AI routines scheduled.";

      return routines
        .map(
          (r) =>
            `- Name: ${r.name}\n  Status: ${r.is_active ? "Active" : "Paused"}\n  Schedule: ${r.cron_expression}\n  ID: ${r.id}`,
        )
        .join("\n\n");
    } catch (err: any) {
      return `Failed to list routines: ${err.message}`;
    }
  },
  {
    name: "get_routines",
    description: "Lists all AI routines created by the user.",
    schema: z.object({
      accessCode: z.string().describe("System-injected access code"),
    }),
  },
);

export const deleteRoutineTool = tool(
  async ({ accessCode, id }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      await deleteRoutine(id);
      return `Successfully deleted routine ID: ${id}`;
    } catch (err: any) {
      return `Failed to delete routine: ${err.message}`;
    }
  },
  {
    name: "delete_routine",
    description:
      "Deletes an AI routine by its ID. Use get_routines to find IDs first.",
    schema: z.object({
      accessCode: z.string().describe("System-injected access code"),
      id: z.string().describe("The UUID of the routine to delete"),
    }),
  },
);

export const updateRoutineTool = tool(
  async ({ accessCode, id, name, instruction, cronExpression, isActive }) => {
    try {
      const user = await findUserByAccessCode(accessCode);
      if (!user) return `Error: Invalid access code.`;

      const updates: any = {};
      if (name) updates.name = name;
      if (instruction) updates.instruction = instruction;
      if (cronExpression) updates.cron_expression = cronExpression;
      if (isActive !== undefined) updates.is_active = isActive;

      const routine = await updateRoutine(id, updates);
      return `Successfully updated routine: "${routine.name}".`;
    } catch (err: any) {
      return `Failed to update routine: ${err.message}`;
    }
  },
  {
    name: "update_routine",
    description:
      "Updates an existing AI routine. Provide the id and any fields you want to change.",
    schema: z.object({
      accessCode: z.string().describe("System-injected access code"),
      id: z.string().describe("The UUID of the routine to update"),
      name: z.string().optional().describe("New name for the routine"),
      instruction: z.string().optional().describe("New AI instruction"),
      cronExpression: z.string().optional().describe("New cron schedule"),
      isActive: z
        .boolean()
        .optional()
        .describe("Enable or disable the routine"),
    }),
  },
);
