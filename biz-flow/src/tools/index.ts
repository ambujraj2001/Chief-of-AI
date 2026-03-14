// ─── Central Tool Registry ───────────────────────────────────────────────────
// To add a new tool:
//   1. Create a new file in src/tools/
//   2. Export a LangChain tool from it
//   3. Import it here and add it to the `tools` array
// No other code changes are needed.

import { addNumbersTool } from "./addNumbersTool";
import { subtractNumbersTool } from "./subtractNumbersTool";
import { randomJokeTool } from "./randomJokeTool";
import { prettifyResponseTool } from "./prettifyTool";
import { getChatHistoryTool } from "./getChatHistoryTool";
import { webSearchTool } from "./webSearchTool";

import {
  addMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  searchMemoryTool,
  getMemoriesTool,
} from "./memory";
import {
  addJournalTool,
  updateJournalTool,
  deleteJournalTool,
  searchJournalTool,
  getJournalsTool,
} from "./journal";
import {
  addKnowledgeTool,
  updateKnowledgeTool,
  deleteKnowledgeTool,
  searchKnowledgeTool,
  getKnowledgesTool,
} from "./knowledge";
import {
  addTaskTool,
  updateTaskTool,
  getTasksTool,
  deleteTaskTool,
} from "./tasks";
import {
  addReminderTool,
  updateReminderTool,
  getRemindersTool,
  deleteReminderTool,
} from "./reminders";
import { listFilesTool, deleteFileTool, summarizeFileTool } from "./files";
import { createAppTool, listAppsTool } from "./apps";
import { safetyTool } from "./safetyTool";
import { helpTool } from "./helpTool";

import { sendEmailTool } from "./sendEmailTool";
import {
  createRoutineTool,
  listRoutinesTool,
  deleteRoutineTool,
  updateRoutineTool,
} from "./routines";
import { makeCallTool } from "./makeCallTool";


export const tools = [
  // Math Tools
  addNumbersTool,
  subtractNumbersTool,

  // Conversation Tools
  prettifyResponseTool,
  getChatHistoryTool,

  // Memory Tools
  addMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  searchMemoryTool,
  getMemoriesTool,

  // Journal Tools
  addJournalTool,
  updateJournalTool,
  deleteJournalTool,
  searchJournalTool,
  getJournalsTool,

  // Knowledge Tools
  addKnowledgeTool,
  updateKnowledgeTool,
  deleteKnowledgeTool,
  searchKnowledgeTool,
  getKnowledgesTool,

  // Task Tools
  addTaskTool,
  updateTaskTool,
  deleteTaskTool,
  getTasksTool,

  // Reminder Tools
  addReminderTool,
  updateReminderTool,
  deleteReminderTool,
  getRemindersTool,

  // File Tools
  listFilesTool,
  deleteFileTool,
  summarizeFileTool,

  // App Tools
  createAppTool,
  listAppsTool,

  // Routine Tools
  createRoutineTool,
  listRoutinesTool,
  updateRoutineTool,
  deleteRoutineTool,

  // External Tools
  webSearchTool,
  sendEmailTool,

  makeCallTool,
  randomJokeTool,

  // Safety Tools
  safetyTool,
  helpTool,
];

export type AppTool = (typeof tools)[number];

export const toolByName = Object.fromEntries(
  tools.map((t) => [t.name, t]),
) as Record<string, AppTool>;
