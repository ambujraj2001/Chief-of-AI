import { Router } from "express";
import {
  chat,
  getHistory,
  getMemories,
  getKnowledge,
  getJournal,
  getTasks,
  getReminders,
  getInsights,
  deleteHistory,
  deleteMemory,
  deleteJournal,
  deleteKnowledge,
  deleteTaskById,
  deleteReminderById,
} from "../controllers/chat.controller";

const router = Router();

// POST /chat
router.post("/", chat);

// GET /chat/history
router.get("/history", getHistory);

// DELETE /chat/history
router.delete("/history", deleteHistory);

// GET /chat/memories
router.get("/memories", getMemories);

// DELETE /chat/memories/:id
router.delete("/memories/:id", deleteMemory);

// GET /chat/journal
router.get("/journal", getJournal);

// DELETE /chat/journal/:id
router.delete("/journal/:id", deleteJournal);

// GET /chat/knowledge
router.get("/knowledge", getKnowledge);

// DELETE /chat/knowledge/:id
router.delete("/knowledge/:id", deleteKnowledge);

// GET /chat/tasks
router.get("/tasks", getTasks);

// DELETE /chat/tasks/:id
router.delete("/tasks/:id", deleteTaskById);

// GET /chat/reminders
router.get("/reminders", getReminders);

// DELETE /chat/reminders/:id
router.delete("/reminders/:id", deleteReminderById);

// GET /chat/insights
router.get("/insights", getInsights);

export default router;
