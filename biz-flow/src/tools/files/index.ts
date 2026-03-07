import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { supabase } from "../../config/supabase";
import { log } from "../../utils/logger";
import { findUserByAccessCode } from "../../services/user.service";
import {
  getUserFiles,
  deleteFile,
  getFileById,
} from "../../services/file.service";

const validateUser = async (accessCode: string) => {
  const user = await findUserByAccessCode(accessCode);
  if (!user) throw new Error("Invalid access code.");
  return user;
};

// ── LIST FILES ──
export const listFilesTool = tool(
  async ({ accessCode }: { accessCode: string }) => {
    log({ event: "tool_execution_started", toolName: "list_files" });
    try {
      const user = await validateUser(accessCode);
      const files = await getUserFiles(user.id);
      if (files.length === 0) return "You have no files uploaded.";

      return JSON.stringify(
        files.map((f) => ({
          id: f.id,
          name: f.file_name,
          uploaded_at: f.created_at,
        })),
        null,
        2,
      );
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "list_files",
        error: error.message,
      });
      return `Error listing files: ${error.message}`;
    }
  },
  {
    name: "list_files",
    description:
      "List all documents and files you have uploaded. Use this to find file IDs for reading or deleting.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
    }),
  },
);

// ── DELETE FILE ──
export const deleteFileTool = tool(
  async ({ accessCode, id }: { accessCode: string; id: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "delete_file",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      await deleteFile(user.id, id);
      return `File ${id} deleted successfully.`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "delete_file",
        error: error.message,
      });
      return `Error deleting file: ${error.message}`;
    }
  },
  {
    name: "delete_file",
    description:
      "Delete a specific file by its ID. IMPORTANT: NEVER call this tool immediately after list_files. After fetching the file list, you MUST first respond with a clarification asking the user which file to delete, then call this tool only after the user confirms. The 'id' parameter must be an exact UUID copied from the list_files result.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the file to delete."),
    }),
  },
);

// ── READ AND SUMMARIZE FILE ──
export const summarizeFileTool = tool(
  async ({ accessCode, id }: { accessCode: string; id: string }) => {
    log({
      event: "tool_execution_started",
      toolName: "read_file",
      args: { id },
    });
    try {
      const user = await validateUser(accessCode);
      const file = await getFileById(user.id, id);
      const fileName = file.file_name.toLowerCase();

      // Extract storage path from public URL
      // Format: https://.../storage/v1/object/public/files/userId/timestamp-name
      const storagePath =
        file.file_url.split("/public/files/")[1] ||
        file.file_url.split("files/")[1];

      if (!storagePath) {
        throw new Error(
          "Invalid file URL format. Could not determine storage path.",
        );
      }

      const { data, error } = await supabase.storage
        .from("files")
        .download(storagePath);

      if (error || !data) {
        throw new Error(
          `Failed to download file from storage: ${error?.message || "Unknown error"}`,
        );
      }

      const buffer = Buffer.from(await data.arrayBuffer());

      const text = buffer.toString("utf-8");

      if (!text.trim())
        return `The file "${file.file_name}" appears to be empty.`;

      // Limit to ~10k chars for practical AI context
      const content =
        text.length > 10000
          ? text.substring(0, 10000) + "... [Truncated]"
          : text;
      return `File Content ("${file.file_name}"):\n\n${content}`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "read_file",
        error: error.message,
      });
      return `Error reading file: ${error.message}`;
    }
  },
  {
    name: "read_and_summarize_file",
    description:
      "Read the content of an uploaded file (PDF, DOCX, TXT, MD, CSV) so you can summarize or analyze it. Use list_files first to get the ID.",
    schema: z.object({
      accessCode: z.string().describe("The user's access code."),
      id: z.string().describe("The ID of the file to read."),
    }),
  },
);
