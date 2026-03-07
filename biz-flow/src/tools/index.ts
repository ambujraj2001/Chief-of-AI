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

export const tools = [
  addNumbersTool,
  subtractNumbersTool,
  randomJokeTool,
  prettifyResponseTool,
  getChatHistoryTool,
  addMemoryTool,
  updateMemoryTool,
  deleteMemoryTool,
  searchMemoryTool,
  getMemoriesTool,
  addJournalTool,
  updateJournalTool,
  deleteJournalTool,
  searchJournalTool,
  getJournalsTool,
  addKnowledgeTool,
  updateKnowledgeTool,
  deleteKnowledgeTool,
  searchKnowledgeTool,
  getKnowledgesTool,
  addTaskTool,
  updateTaskTool,
  getTasksTool,
  deleteTaskTool,
  addReminderTool,
  updateReminderTool,
  getRemindersTool,
  deleteReminderTool,
  listFilesTool,
  deleteFileTool,
  summarizeFileTool,
  createAppTool,
  listAppsTool,
  safetyTool,
  helpTool,
];

export type AppTool = (typeof tools)[number];
