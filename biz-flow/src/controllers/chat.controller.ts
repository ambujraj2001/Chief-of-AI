import { Request, Response, NextFunction } from "express";
import { findUserByAccessCode } from "../services/user.service";
import { getUserTasks } from "../services/task.service";
import {
  getUserChatHistory,
  deleteUserChatHistory,
} from "../services/chat.service";
import { runAgent } from "../agents/chatAgent";
import {
  ChatRequestBody,
  ChatResponse,
  ChatHistoryResponse,
} from "../types/chat.types";
import { log, tracingStorage } from "../utils/logger";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ─── POST /chat ───────────────────────────────────────────────────────────────

// ─── Local Testing Logger (Appends if same conversationId) ──────────────────
const writeLocalDebugLog = (conversationId: string | undefined, user: string, request: string, reply: string, events?: any[]) => {
  try {
    const logPath = path.join(process.cwd(), "..", "chat_debug.json");
    let logData: any = { conversationId: "", entries: [] };
    
    if (fs.existsSync(logPath)) {
      try {
        const content = fs.readFileSync(logPath, "utf-8");
        const parsed = JSON.parse(content);
        // Only keep previous entries if they belong to the same conversation
        if (parsed.conversationId === conversationId) {
          logData = parsed;
        }
      } catch (e) {
        // Corrupted file, just start over
      }
    }
    
    // If it's a new or different conversation, reset the log data
    if (logData.conversationId !== conversationId) {
      logData = { conversationId: conversationId || "session-unknown", entries: [] };
    }
    
    logData.entries.push({
      timestamp: new Date().toISOString(),
      user,
      request,
      events,
      finalReply: reply,
    });
    
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local chat log:", err);
  }
};

export const chat = async (
  req: Request<object, object, ChatRequestBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { message, accessCode, conversationId, incognito } = req.body;

    log({
      event: "chat_request_received",
      message: message?.trim(),
    });

    // ── Validation ────────────────────────────────────────────────────────────
    if (!accessCode?.trim()) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // ── Authenticate via existing user service ────────────────────────────────
    log({ event: "user_validation_started" });
    const user = await findUserByAccessCode(accessCode.trim());

    if (!user) {
      log({ event: "user_validation_failed" });
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    log({
      event: "user_validated",
      userId: user.id,
      userName: user.full_name,
    });

    // ── Run the AI agent ──────────────────────────────────────────────────────
    const isStream = req.headers.accept === "text/event-stream";
    const events: any[] = [];

    const currentStore = tracingStorage.getStore();
    await tracingStorage.run(
      {
        traceId: currentStore?.traceId || crypto.randomUUID(),
        collector: (d) => events.push(d),
      },
      async () => {
        if (isStream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          const reply = await runAgent(
            message.trim(),
            user,
            conversationId,
            incognito as boolean | undefined,
            (event) => {
              events.push(event);
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            },
          );

          res.write(
            `data: ${JSON.stringify({ type: "final_reply", reply })}\n\n`,
          );
          res.end();

          // Log the full interaction
          writeLocalDebugLog(
            conversationId,
            user.full_name,
            message.trim(),
            reply,
            events,
          );
          return;
        }

        // Non-streaming case - still collect events for debug logging
        const reply = await runAgent(
          message.trim(),
          user,
          conversationId,
          incognito as boolean | undefined,
          (event) => {
            events.push(event);
          },
        );

        const response: ChatResponse = { reply };
        res.status(200).json(response);

        // Log the full interaction including collected events
        writeLocalDebugLog(
          conversationId,
          user.full_name,
          message.trim(),
          reply,
          events,
        );
      },
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/history ────────────────────────────────────────────────────────

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const messages = await getUserChatHistory(user.id);
    const response: ChatHistoryResponse = { messages };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /chat/history ─────────────────────────────────────────────────────

export const deleteHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    await deleteUserChatHistory(user.id);

    log({
      event: "chat_history_deleted",
      userId: user.id,
    });

    res.status(200).json({ message: "Chat history cleared successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/memories ───────────────────────────────────────────────────────

import {
  getUserMemories,
  getUserKnowledge,
  getUserJournal,
  deleteEntry,
  createMemoryShareCode,
  joinSharedMemory,
} from "../services/entry.service";
import { getUserReminders, deleteReminder } from "../services/reminder.service";
import { generateInsights } from "../services/insights.service";
import { deleteTask } from "../services/task.service";

export const getMemories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const memories = await getUserMemories(user.id);

    res.status(200).json({ memories });
  } catch (err) {
    next(err);
  }
};

export const deleteMemory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;
    const { id } = req.params;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    await deleteEntry(id, user.id);
    res.status(200).json({ message: "Memory deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const shareMemory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;
    const { id } = req.params;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const shareCode = await createMemoryShareCode(user.id, id);
    res.status(200).json({ shareCode });
  } catch (err) {
    next(err);
  }
};

export const joinMemory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { accessCode, code } = req.body;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    await joinSharedMemory(user.id, code);
    res.status(200).json({ message: "Successfully joined memory" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/journal ────────────────────────────────────────────────────────

export const getJournal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const journal = await getUserJournal(user.id);

    res.status(200).json({ journal });
  } catch (err) {
    next(err);
  }
};

export const deleteJournal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;
    const { id } = req.params;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    await deleteEntry(id, user.id);
    res.status(200).json({ message: "Journal deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/knowledge ──────────────────────────────────────────────────────

export const getKnowledge = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const knowledge = await getUserKnowledge(user.id);

    res.status(200).json({ knowledge });
  } catch (err) {
    next(err);
  }
};

export const deleteKnowledge = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;
    const { id } = req.params;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    await deleteEntry(id, user.id);
    res.status(200).json({ message: "Knowledge deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/tasks ──────────────────────────────────────────────────────────

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const tasks = await getUserTasks(user.id);

    res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
};

export const deleteTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;
    const { id } = req.params;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    await deleteTask(id, user.id);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/reminders ──────────────────────────────────────────────────────

export const getReminders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const reminders = await getUserReminders(user.id);

    res.status(200).json({ reminders });
  } catch (err) {
    next(err);
  }
};

export const deleteReminderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;
    const { id } = req.params;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    const user = await findUserByAccessCode(accessCode);
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    await deleteReminder(id, user.id);
    res.status(200).json({ message: "Reminder deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ─── GET /chat/insights ───────────────────────────────────────────────────────

export const getInsights = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessCode = req.query.accessCode as string;

    if (!accessCode) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode);

    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const { startDate, endDate } = req.query;

    const insights = await generateInsights(
      user.id,
      startDate as string,
      endDate as string,
    );

    res.status(200).json({ insights });
  } catch (err) {
    next(err);
  }
};
