import { Request, Response, NextFunction } from "express";
import { findUserByAccessCode } from "../services/user.service";
import {
  getAppById,
  getAppData,
  getAppChatHistory,
  verifyAppMembership,
  getUserApps,
  getAppByJoinCode,
  isAppMember,
  addAppMember,
  upsertAppData,
} from "../services/app.service";
import { runAppChatAgent } from "../agents/appChatAgent";
import { log } from "../utils/logger";

// ─── GET /apps ───────────────────────────────────────────────────────────────

export const listApps = async (
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

    const apps = await getUserApps(user.id);

    res.status(200).json({ apps });
  } catch (err) {
    next(err);
  }
};

// ─── POST /apps/join ─────────────────────────────────────────────────────────

export const joinApp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { accessCode, joinCode } = req.body;

    if (!accessCode?.trim()) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    if (!joinCode?.trim()) {
      res.status(400).json({ error: "joinCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode.trim());
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const app = await getAppByJoinCode(joinCode.trim());
    if (!app) {
      res.status(404).json({ error: "Invalid join code. No app found." });
      return;
    }

    const alreadyMember = await isAppMember(app.id, user.id);
    if (alreadyMember) {
      res.status(200).json({
        status: "already_member",
        appId: app.id,
        message: "You are already a member of this app.",
      });
      return;
    }

    await addAppMember(app.id, user.id, "member");

    // Add the new member's name to any members-like app_data key
    try {
      const appData = await getAppData(app.id);
      const membersEntry = appData.find((d) => /member/i.test(d.key));
      if (membersEntry && Array.isArray(membersEntry.value)) {
        const members = membersEntry.value as string[];
        if (!members.includes(user.full_name)) {
          members.push(user.full_name);
          await upsertAppData(app.id, membersEntry.key, members);
        }
      }
    } catch {
      // Non-critical — membership row was already added
    }

    log({
      event: "app_joined",
      appId: app.id,
      userId: user.id,
      joinCode: joinCode.trim(),
    });

    res.status(200).json({
      status: "success",
      appId: app.id,
      appName: app.name,
      message: `You have joined "${app.name}".`,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /apps/:appId/chat ──────────────────────────────────────────────────

export const appChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { appId } = req.params;
    const { message, accessCode } = req.body;

    if (!accessCode?.trim()) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }
    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    if (!appId) {
      res.status(400).json({ error: "appId is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode.trim());
    if (!user) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    const hasAccess = await verifyAppMembership(appId, user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "You do not have access to this app" });
      return;
    }

    log({
      event: "app_chat_request",
      appId,
      userId: user.id,
    });

    const result = await runAppChatAgent(appId, user.id, message.trim());

    res.status(200).json({
      reply: result.reply,
      dataUpdates: result.dataUpdates,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /apps/:appId ────────────────────────────────────────────────────────

export const getApp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { appId } = req.params;
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

    const hasAccess = await verifyAppMembership(appId, user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "You do not have access to this app" });
      return;
    }

    const app = await getAppById(appId);
    if (!app) {
      res.status(404).json({ error: "App not found" });
      return;
    }

    res.status(200).json({ app });
  } catch (err) {
    next(err);
  }
};

// ─── GET /apps/:appId/data ───────────────────────────────────────────────────

export const getAppDataEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { appId } = req.params;
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

    const hasAccess = await verifyAppMembership(appId, user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "You do not have access to this app" });
      return;
    }

    const data = await getAppData(appId);

    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
};

// ─── GET /apps/:appId/chats ─────────────────────────────────────────────────

export const getAppChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { appId } = req.params;
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

    const hasAccess = await verifyAppMembership(appId, user.id);
    if (!hasAccess) {
      res.status(403).json({ error: "You do not have access to this app" });
      return;
    }

    const chats = await getAppChatHistory(appId, user.id);

    res.status(200).json({ chats });
  } catch (err) {
    next(err);
  }
};
