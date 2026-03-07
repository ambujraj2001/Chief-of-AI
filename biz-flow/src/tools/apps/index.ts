import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../../utils/logger";
import { findUserByAccessCode } from "../../services/user.service";
import { supabase } from "../../config/supabase";
import { createAppWithJoinCode } from "../../services/app.service";

const validateUser = async (accessCode: string) => {
  const user = await findUserByAccessCode(accessCode);
  if (!user) throw new Error("Invalid access code.");
  return user;
};

export const createAppTool = tool(
  async ({
    accessCode,
    name,
    description,
    schema,
    initialData,
  }: {
    accessCode: string;
    name: string;
    description?: string;
    schema: string;
    initialData?: string;
  }) => {
    log({
      event: "tool_execution_started",
      toolName: "create_app",
      args: { name },
    });
    try {
      const user = await validateUser(accessCode);

      let parsedSchema: Record<string, unknown>;
      try {
        parsedSchema = JSON.parse(schema);
      } catch {
        return "Error: schema must be valid JSON. Please provide a valid JSON schema with a layout array.";
      }

      if (!parsedSchema.layout || !Array.isArray(parsedSchema.layout)) {
        return 'Error: schema must contain a "layout" array with component definitions.';
      }

      const app = await createAppWithJoinCode(
        name,
        description || null,
        parsedSchema,
        user.id,
      );

      await supabase.from("app_members").insert({
        app_id: app.id,
        user_id: user.id,
        role: "owner",
      });

      // Seed initial data
      const seedData: Record<string, unknown> = {};

      if (initialData) {
        try {
          const parsed = JSON.parse(initialData);
          if (typeof parsed === "object" && parsed !== null) {
            Object.assign(seedData, parsed);
          }
        } catch {
          log({
            event: "initial_data_parse_failed",
            toolName: "create_app",
            appId: app.id,
          });
        }
      }

      // Auto-add creator to any members-like data key
      const layout = parsedSchema.layout as Array<{ component: string }>;
      const memberComponent = layout.find((c) =>
        /member/i.test(c.component),
      );
      if (memberComponent) {
        const key = memberComponent.component;
        const existing = seedData[key];
        if (!existing || (Array.isArray(existing) && existing.length === 0)) {
          seedData[key] = [user.full_name];
        } else if (
          Array.isArray(existing) &&
          !existing.includes(user.full_name)
        ) {
          (existing as string[]).push(user.full_name);
        }
      }

      // Initialize empty arrays for remaining components that have no data
      for (const comp of layout) {
        if (!(comp.component in seedData)) {
          seedData[comp.component] = [];
        }
      }

      const inserts = Object.entries(seedData).map(([key, value]) => ({
        app_id: app.id,
        key,
        value,
      }));
      if (inserts.length > 0) {
        await supabase.from("app_data").insert(inserts);
      }

      log({
        event: "tool_execution_completed",
        toolName: "create_app",
        appId: app.id,
      });

      return `App "${name}" created successfully! App ID: ${app.id}. Join code: ${app.join_code}. The user can access it at /dashboard/app/${app.id}. Others can join using the code ${app.join_code}.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "create_app",
        error: error.message,
      });
      return `Error creating app: ${error.message}`;
    }
  },
  {
    name: "create_app",
    description:
      'Create a new mini-app for the user. Use this when the user asks to create, build, or make an app (e.g. "create an expense splitter", "build a task board", "make a poll app"). You MUST generate a suitable JSON schema with a layout array defining the UI components, and optionally provide initial data.',
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      name: z.string().describe("The name of the app to create."),
      description: z
        .string()
        .optional()
        .describe("A short description of what the app does."),
      schema: z
        .string()
        .describe(
          'A JSON string defining the app UI schema. Must contain a "layout" array with objects like { "component": "component_name" }. Example: \'{"layout":[{"component":"members_list"},{"component":"expenses_table"},{"component":"balance_summary"},{"component":"add_expense_form"}]}\'',
        ),
      initialData: z
        .string()
        .optional()
        .describe(
          'Optional JSON string with initial app data as key-value pairs. Example: \'{"members":["Alice","Bob"],"expenses":[]}\'',
        ),
    }),
  },
);

export const listAppsTool = tool(
  async ({ accessCode }: { accessCode: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "list_apps",
    });
    try {
      const user = await validateUser(accessCode);

      const { data: ownedApps, error: ownedErr } = await supabase
        .from("apps")
        .select("id, name, description, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (ownedErr) throw new Error(ownedErr.message);

      const { data: memberships } = await supabase
        .from("app_members")
        .select("app_id")
        .eq("user_id", user.id);

      const memberAppIds = (memberships ?? [])
        .map((m) => m.app_id)
        .filter((id) => !(ownedApps ?? []).some((a) => a.id === id));

      let memberApps: any[] = [];
      if (memberAppIds.length > 0) {
        const { data } = await supabase
          .from("apps")
          .select("id, name, description, created_at")
          .in("id", memberAppIds);
        memberApps = data ?? [];
      }

      const allApps = [...(ownedApps ?? []), ...memberApps];

      if (allApps.length === 0) return "No apps found. The user hasn't created any apps yet.";

      return allApps
        .map(
          (a) =>
            `[ID: ${a.id}] ${a.name}${a.description ? ` — ${a.description}` : ""} (created ${a.created_at})`,
        )
        .join("\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "list_apps",
        error: error.message,
      });
      return `Error listing apps: ${error.message}`;
    }
  },
  {
    name: "list_apps",
    description:
      "List all apps the user has created or is a member of. Use this when the user asks about their apps or wants to see their apps.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
    }),
  },
);
