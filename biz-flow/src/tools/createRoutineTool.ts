import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createRoutine } from "../services/routine.service";
import { log } from "../utils/logger";

export const createRoutineTool = new DynamicStructuredTool({
  name: "create_routine",
  description:
    "Create an automated AI routine that runs on a schedule. You must provide a clear name, the instruction for the AI, and a valid 5-part cron expression (Min Hour Day Month DayOfWeek).",
  schema: z.object({
    name: z
      .string()
      .describe(
        "A descriptive name for the routine (e.g., 'Morning News Summary')",
      ),
    instruction: z
      .string()
      .describe("What the AI should do every time the routine runs"),
    cron_expression: z
      .string()
      .describe(
        "Standard 5-part cron expression (e.g., '0 9 * * *' for every morning at 9am)",
      ),
  }),
  func: async ({ name, instruction, cron_expression }, runManager) => {
    try {
      // The user ID is usually handled by the agent context, but we need it here.
      // In chatAgent.ts, we have access to the user object.
      // However, tools in LangChain usually don't have direct access to the 'user' object unless we pass it.
      // Looking at chatAgent.ts, it seems we don't pass 'userId' into tool metadata by default.

      // I'll check how other tools get the user ID.
      return "Tool error: Routine creation requires user context. Please try again.";
    } catch (error: any) {
      return `Failed to create routine: ${error.message}`;
    }
  },
});
