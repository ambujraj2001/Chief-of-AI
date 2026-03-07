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
  getUserKnowledge,
} from "../../services/entry.service";

const validateUser = async (accessCode: string) => {
  const user = await findUserByAccessCode(accessCode);
  if (!user) throw new Error("Invalid access code.");
  return user;
};

// ── ADD KNOWLEDGE ──
export const addKnowledgeTool = tool(
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
      toolName: "add_knowledge",
      args: { title },
    });
    try {
      const user = await validateUser(accessCode);

      // Smart Upsert: Check if a knowledge entry with the same title already exists
      if (title) {
        const existing = await findEntryByTitleAndType(
          user.id,
          "knowledge",
          title,
        );
        if (existing) {
          await updateEntry(existing.id, user.id, title, content);
          return `Knowledge entry "${title}" updated successfully (Existing ID: ${existing.id})`;
        }
      }

      const data = await addEntry(user.id, "knowledge", title, content);
      return `Knowledge article added successfully. ID: ${data.id}`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "add_knowledge",
        error: error.message,
      });
      return `Error adding knowledge: ${error.message}`;
    }
  },
  {
    name: "add_knowledge",
    description:
      "Save a new piece of knowledge, fact, or documentation. Use when user wants you to store objective information, links, or facts.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      content: z.string().describe("The knowledge content to store."),
      title: z
        .string()
        .optional()
        .describe(
          "An optional title for this knowledge base article. Autogenerate a brief title yourself without asking the user.",
        ),
    }),
  },
);

// ── UPDATE KNOWLEDGE ──
export const updateKnowledgeTool = tool(
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
      toolName: "update_knowledge",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await updateEntry(id, user.id, title, content);
      return `Knowledge ${id} updated successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "update_knowledge",
        error: error.message,
      });
      return `Error updating knowledge: ${error.message}`;
    }
  },
  {
    name: "update_knowledge",
    description: "Update an existing knowledge entry by its ID.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the knowledge entry to update."),
      content: z
        .string()
        .describe("The new full content of the knowledge article."),
      title: z
        .string()
        .optional()
        .describe(
          "The new title. Autogenerate it if not specified by the user.",
        ),
    }),
  },
);

// ── DELETE KNOWLEDGE ──
export const deleteKnowledgeTool = tool(
  async ({ accessCode, id }: { accessCode: string; id: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "delete_knowledge",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await deleteEntry(id, user.id);
      return `Knowledge ${id} deleted successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "delete_knowledge",
        error: error.message,
      });
      return `Error deleting knowledge: ${error.message}`;
    }
  },
  {
    name: "delete_knowledge",
    description:
      "Delete a specific knowledge entry by its ID. IMPORTANT: NEVER call this tool immediately after get_knowledges. After fetching entries, you MUST first respond with a clarification asking the user which one to delete, then call this tool only after the user confirms. The 'id' parameter must be an exact UUID copied from the get_knowledges result.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the knowledge entry to delete."),
    }),
  },
);

// ── GET KNOWLEDGE ──
export const getKnowledgesTool = tool(
  async ({ accessCode }: { accessCode: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "get_knowledges",
    });
    try {
      const user = await validateUser(accessCode);
      const results = await getUserKnowledge(user.id);

      if (!results || results.length === 0)
        return "No knowledge entries found.";
      return results
        .map(
          (m: any) =>
            `[ID: ${m.id}] ${m.title ? `(${m.title}) ` : ""}${m.content}`,
        )
        .join("\n\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "get_knowledges",
        error: error.message,
      });
      return `Error getting knowledge entries: ${error.message}`;
    }
  },
  {
    name: "get_knowledges",
    description:
      "List all knowledge entries for the user. Always use this to list knowledge base articles before deleting if the user does not provide a specific ID.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
    }),
  },
);

// ── SEARCH KNOWLEDGE ──
export const searchKnowledgeTool = tool(
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
      toolName: "search_knowledge",
      args: { query },
    });
    try {
      const user = await validateUser(accessCode);
      const results = await searchEntries(user.id, "knowledge", query, limit);
      if (!results || results.length === 0)
        return "No relevant knowledge found.";
      return results
        .map(
          (m: any) =>
            `[ID: ${m.id}] ${m.title ? `(${m.title}) ` : ""}${m.content}`,
        )
        .join("\n\n");
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "search_knowledge",
        error: error.message,
      });
      return `Error searching knowledge: ${error.message}`;
    }
  },
  {
    name: "search_knowledge",
    description:
      "Semantically search through stored knowledge/facts via vector embeddings. Crucial for retrieving stored answers to questions.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      query: z
        .string()
        .describe(
          "The search query or semantic topic to find in knowledge entries.",
        ),
      limit: z
        .number()
        .optional()
        .describe("Max number of results to return (default 5)."),
    }),
  },
);
