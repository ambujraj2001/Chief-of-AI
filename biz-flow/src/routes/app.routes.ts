import { Router } from "express";
import {
  listApps,
  joinApp,
  appChat,
  getApp,
  getAppDataEndpoint,
  getAppChats,
} from "../controllers/app.controller";

const router = Router();

// GET /apps — list all apps the user has access to
router.get("/", listApps);

// POST /apps/join — join an app using a join code (must be before /:appId)
router.post("/join", joinApp);

// GET /apps/:appId — fetch app metadata + schema
router.get("/:appId", getApp);

// GET /apps/:appId/data — fetch current app data
router.get("/:appId/data", getAppDataEndpoint);

// GET /apps/:appId/chats — fetch user's private chat history in app
router.get("/:appId/chats", getAppChats);

// POST /apps/:appId/chat — send message to app AI agent
router.post("/:appId/chat", appChat);

export default router;
