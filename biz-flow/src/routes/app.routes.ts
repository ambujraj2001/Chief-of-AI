import { Router } from "express";
import {
  listApps,
  joinApp,
  appChat,
  getApp,
  getAppDataEndpoint,
  getAppChats,
  analyzeApp,
  deleteAppEndpoint,
} from "../controllers/app.controller";

const router = Router();

// GET /apps — list all apps the user has access to
router.get("/", listApps);

// POST /apps/join — join an app using a join code (must be before /:appId)
router.post("/join", joinApp);

// GET /apps/:appId/analyze — analyze app data and generate HTML report
router.get("/:appId/analyze", analyzeApp);

// GET /apps/:appId — fetch app metadata + schema
router.get("/:appId", getApp);

// GET /apps/:appId/data — fetch current app data
router.get("/:appId/data", getAppDataEndpoint);

// GET /apps/:appId/chats — fetch user's private chat history in app
router.get("/:appId/chats", getAppChats);

// POST /apps/:appId/chat — send message to app AI agent
router.post("/:appId/chat", appChat);

// DELETE /apps/:appId — delete app and related records
router.delete("/:appId", deleteAppEndpoint);

export default router;
