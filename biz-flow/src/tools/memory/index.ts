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
  getUserMemories,
} from "../../services/entry.service";

const validateUser = async (accessCode: string) => {
  const user = await findUserByAccessCode(accessCode);
  if (!user) throw new Error("Invalid access code.");
  return user;
};

// ── ADD MEMORY ──
export const addMemoryTool = tool(
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
      toolName: "add_memory",
      args: { title },
    });
    try {
      const user = await validateUser(accessCode);

      // Smart Upsert: Check if a memory with the same title already exists
      if (title) {
        const existing = await findEntryByTitleAndType(
          user.id,
          "memory",
          title,
        );
        if (existing) {
          await updateEntry(existing.id, user.id, title, content);
          return `Memory "${title}" updated successfully (Existing ID: ${existing.id})`;
        }
      }

      const data = await addEntry(user.id, "memory", title, content);
      return `Memory added successfully. ID: ${data.id}`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "add_memory",
        error: error.message,
      });
      return `Error adding memory: ${error.message}`;
    }
  },
  {
    name: "add_memory",
    description:
      "Save a new memory about the user. Use this when the user asks you to remember something personal or important about them.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      content: z.string().describe("The content of the memory to save."),
      title: z
        .string()
        .optional()
        .describe(
          "An optional short title for this memory. Autogenerate a brief title yourself without asking the user.",
        ),
    }),
  },
);

// ── UPDATE MEMORY ──
export const updateMemoryTool = tool(
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
      toolName: "update_memory",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await updateEntry(id, user.id, title, content);
      return `Memory ${id} updated successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "update_memory",
        error: error.message,
      });
      return `Error updating memory: ${error.message}`;
    }
  },
  {
    name: "update_memory",
    description: "Update an existing memory by its ID.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the memory to update."),
      content: z.string().describe("The new full content of the memory."),
      title: z
        .string()
        .optional()
        .describe(
          "The new title. Autogenerate it if not specified by the user.",
        ),
    }),
  },
);

// ── DELETE MEMORY ──
export const deleteMemoryTool = tool(
  async ({ accessCode, id }: { accessCode: string; id: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "delete_memory",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await deleteEntry(id, user.id);
      return `Memory ${id} deleted successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "delete_memory",
        error: error.message,
      });
      return `Error deleting memory: ${error.message}`;
    }
  },
  {
    name: "delete_memory",
    description:
      "Delete a specific memory by its ID. If the exact ID is unknown, ALWAYS run get_memories first to list available memories. DO NOT guess the ID. Ask the user to confirm the specific ID if unclear.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the memory to delete."),
    }),
  },
);

// ── GET MEMORIES ──
export const getMemoriesTool = tool(
  async ({ accessCode }: { accessCode: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "get_memories",
    });
    try {
      const user = await validateUser(accessCode);
      const results = await getUserMemories(user.id);

      if (!results || results.length === 0) return "No memories found.";
      return results
        .map(
          (m: any) =>
            `[ID: ${m.id}] ${m.title ? `(${m.title}) ` : ""}${m.content}`,
        )
        .join("\n\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "get_memories",
        error: error.message,
      });
      return `Error getting memories: ${error.message}`;
    }
  },
  {
    name: "get_memories",
    description:
      "List all memories for the user. Always use this to list memories before deleting if the user does not provide a specific ID, or to see what memories exist.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
    }),
  },
);

// ── SEARCH MEMORY ──

export const searchMemoryTool = tool(
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
      toolName: "search_memory",
      args: { query },
    });
    try {
      const user = await validateUser(accessCode);
      const results = await searchEntries(user.id, "memory", query, limit);

      if (!results || results.length === 0)
        return "No relevant memories found.";
      return results
        .map(
          (m: any) =>
            `[ID: ${m.id}] ${m.title ? `(${m.title}) ` : ""}${m.content}`,
        )
        .join("\n\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "search_memory",
        error: error.message,
      });
      return `Error searching memory: ${error.message}`;
    }
  },
  {
    name: "search_memory",
    description:
      "Semantically search through past memories via vector embeddings based on user intent. Use this to find a memory ID to edit/delete or to retrieve specific facts.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      query: z.string().describe("The search query or semantic topic to find."),
      limit: z
        .number()
        .optional()
        .describe("Max number of results to return (default 5)."),
    }),
  },
);
