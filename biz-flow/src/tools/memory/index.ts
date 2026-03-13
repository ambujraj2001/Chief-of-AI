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
      "Save a new memory about the user. ALWAYS call this tool when the user asks to explicitly save, remember, or add a personal memory. Do NOT store memories inside the conversation or respond manually.",
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
      "Delete a specific memory by its ID.\n\nWhen the user asks to delete an item, follow this process:\n\nStep 1 — Call the corresponding list/get tool to retrieve available items.\n\nStep 2 — Ask the user which item they want to delete.\n\nStep 3 — Ask the user to confirm deletion.\n\nStep 4 — Only after confirmation call the delete tool using the exact ID.",
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

      if (!results || results.length === 0)
        return { content: "No memories found.", memories: [] };
      const content = results
        .map(
          (m: any) =>
            `ID: ${m.id}\nTitle: ${m.title || "None"}\nContent: ${m.content}`,
        )
        .join("\n\n---\n\n");
      return { content, memories: results };
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "get_memories",
        error: error.message,
      });
      return { content: `Error getting memories: ${error.message}`, memories: [] };
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
        return { content: "No relevant memories found.", memories: [] };
      const content = results
        .map(
          (m: any) =>
            `ID: ${m.id}\nTitle: ${m.title || "None"}\nContent: ${m.content}`,
        )
        .join("\n\n---\n\n");
      return { content, memories: results };
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "search_memory",
        error: error.message,
      });
      return { content: `Error searching memory: ${error.message}`, memories: [] };
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
