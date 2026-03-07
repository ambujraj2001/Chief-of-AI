import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../../utils/logger";
import { findUserByAccessCode } from "../../services/user.service";
import {
  addEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
  findEntryByTitleAndType,
  getUserJournal,
} from "../../services/entry.service";

const validateUser = async (accessCode: string) => {
  const user = await findUserByAccessCode(accessCode);
  if (!user) throw new Error("Invalid access code.");
  return user;
};

// ── ADD JOURNAL ──
export const addJournalTool = tool(
  async ({
    accessCode,
    content,
    title,
  }: {
    accessCode: string;
    content: string;
    title?: string;
  }) => {
    log({
      event: "tool_execution_started",
      toolName: "add_journal",
      args: { title },
    });
    try {
      const user = await validateUser(accessCode);

      // Smart Upsert: Check if a journal entry with the same title already exists
      if (title) {
        const existing = await findEntryByTitleAndType(
          user.id,
          "journal",
          title,
        );
        if (existing) {
          await updateEntry(existing.id, user.id, title, content);
          return `Journal entry "${title}" updated successfully (Existing ID: ${existing.id})`;
        }
      }

      const data = await addEntry(user.id, "journal", title, content);
      return `Journal entry added successfully. ID: ${data.id}`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "add_journal",
        error: error.message,
      });
      return `Error adding journal entry: ${error.message}`;
    }
  },
  {
    name: "add_journal",
    description:
      "Write a new journal or diary entry for the user. Use when user expresses feelings, daily events, thoughts, or reflections.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      content: z.string().describe("The content of the journal entry."),
      title: z
        .string()
        .optional()
        .describe(
          "An optional title for this journal entry. Autogenerate a brief title yourself without asking the user.",
        ),
    }),
  },
);

// ── UPDATE JOURNAL ──
export const updateJournalTool = tool(
  async ({
    accessCode,
    id,
    content,
    title,
  }: {
    accessCode: string;
    id: string;
    content: string;
    title?: string;
  }) => {
    log({
      event: "tool_execution_started",
      toolName: "update_journal",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await updateEntry(id, user.id, title, content);
      return `Journal entry ${id} updated successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "update_journal",
        error: error.message,
      });
      return `Error updating journal entry: ${error.message}`;
    }
  },
  {
    name: "update_journal",
    description: "Update an existing journal entry by its ID.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the journal entry to update."),
      content: z
        .string()
        .describe("The new full content of the journal entry."),
      title: z
        .string()
        .optional()
        .describe(
          "The new title. Autogenerate it if not specified by the user.",
        ),
    }),
  },
);

// ── DELETE JOURNAL ──
export const deleteJournalTool = tool(
  async ({ accessCode, id }: { accessCode: string; id: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "delete_journal",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await deleteEntry(id, user.id);
      return `Journal entry ${id} deleted successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "delete_journal",
        error: error.message,
      });
      return `Error deleting journal entry: ${error.message}`;
    }
  },
  {
    name: "delete_journal",
    description:
      "Delete a specific journal entry by its ID. If the exact ID is unknown, ALWAYS run get_journals first to list available journals. DO NOT guess the ID. Ask the user to confirm the specific ID if unclear.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the journal entry to delete."),
    }),
  },
);

// ── GET JOURNALS ──
export const getJournalsTool = tool(
  async ({ accessCode }: { accessCode: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "get_journals",
    });
    try {
      const user = await validateUser(accessCode);
      const results = await getUserJournal(user.id);

      if (!results || results.length === 0) return "No journal entries found.";
      return results
        .map(
          (m: any) =>
            `[ID: ${m.id}] ${m.title ? `(${m.title}) ` : ""}${m.content}`,
        )
        .join("\n\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "get_journals",
        error: error.message,
      });
      return `Error getting journal entries: ${error.message}`;
    }
  },
  {
    name: "get_journals",
    description:
      "List all journal entries for the user. Always use this to list journals before deleting if the user does not provide a specific ID.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
    }),
  },
);

// ── SEARCH JOURNAL ──
export const searchJournalTool = tool(
  async ({
    accessCode,
    query,
    limit = 5,
  }: {
    accessCode: string;
    query: string;
    limit?: number;
  }) => {
    log({
      event: "tool_execution_started",
      toolName: "search_journal",
      args: { query },
    });
    try {
      const user = await validateUser(accessCode);
      const results = await searchEntries(user.id, "journal", query, limit);
      if (!results || results.length === 0)
        return "No relevant journal entries found.";
      return results
        .map(
          (m: any) =>
            `[ID: ${m.id}] ${m.title ? `(${m.title}) ` : ""}${m.content}`,
        )
        .join("\n\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "search_journal",
        error: error.message,
      });
      return `Error searching journal entries: ${error.message}`;
    }
  },
  {
    name: "search_journal",
    description:
      "Semantically search through past journal entries via vector embeddings. Useful for reflecting on the past.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      query: z
        .string()
        .describe(
          "The search query or semantic topic to find in journal entries.",
        ),
      limit: z
        .number()
        .optional()
        .describe("Max number of results to return (default 5)."),
    }),
  },
);
