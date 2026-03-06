import { Request, Response, NextFunction } from "express";
import {
  createUser,
  findUserByAccessCode,
  updateUserByAccessCode,
  findUserByEmail,
} from "../services/user.service";
import {
  SignupBody,
  BootConfigBody,
  UpdateProfileBody,
} from "../types/user.types";
import { log } from "../utils/logger";
import { generateOTP } from "../utils/otp";
import { redis } from "../config/redis";
import { sendOTP } from "../services/mail.service";

// ─── POST /auth/signup ──────────────────────────────────────────────────────

export const signup = async (
  req: Request<object, object, SignupBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      fullName,
      email,
      role,
      interactionTone,
      responseComplexity,
      voiceModel,
      notifyResponseAlerts,
      notifyDailyBriefing,
    } = req.body;

    // ── Basic validation ─────────────────────────────────────────────────────
    if (!fullName?.trim()) {
      res.status(400).json({ error: "fullName is required" });
      return;
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }
    const validTones = ["professional", "casual", "technical", "concise"];
    if (!validTones.includes(interactionTone)) {
      res.status(400).json({
        error: `interactionTone must be one of: ${validTones.join(", ")}`,
      });
      return;
    }
    if (
      typeof responseComplexity !== "number" ||
      responseComplexity < 1 ||
      responseComplexity > 5
    ) {
      res
        .status(400)
        .json({ error: "responseComplexity must be a number between 1 and 5" });
      return;
    }
    const validVoices = ["atlas", "standard"];
    if (!validVoices.includes(voiceModel)) {
      res.status(400).json({
        error: `voiceModel must be one of: ${validVoices.join(", ")}`,
      });
      return;
    }

    const user = await createUser(req.body);

    res.status(201).json({
      accessCode: user.access_code,
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/bootconfig ──────────────────────────────────────────────────

export const bootconfig = async (
  req: Request<object, object, BootConfigBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { accessCode } = req.body;

    if (!accessCode?.trim()) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await findUserByAccessCode(accessCode.trim());

    if (!user) {
      log({ event: "bootconfig_failed", message: "Invalid access code" });
      res.status(401).json({ error: "Invalid access code" });
      return;
    }

    log({
      event: "bootconfig_successful",
      userId: user.id,
      userName: user.full_name,
    });

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role || "User",
      },
      preferences: {
        interactionTone: user.interaction_tone,
        responseComplexity: user.response_complexity,
        voiceModel: user.voice_model,
        notifyResponseAlerts: user.notify_response_alerts,
        notifyDailyBriefing: user.notify_daily_briefing,
        showDemo: user.show_demo,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/update-profile ──────────────────────────────────────────────

export const updateProfile = async (
  req: Request<object, object, UpdateProfileBody>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { accessCode, ...updates } = req.body;

    if (!accessCode?.trim()) {
      res.status(400).json({ error: "accessCode is required" });
      return;
    }

    const user = await updateUserByAccessCode(accessCode.trim(), updates);

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role || "User",
      },
      preferences: {
        interactionTone: user.interaction_tone,
        responseComplexity: user.response_complexity,
        voiceModel: user.voice_model,
        notifyResponseAlerts: user.notify_response_alerts,
        notifyDailyBriefing: user.notify_daily_briefing,
        showDemo: user.show_demo,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/forgot-access-code ──────────────────────────────────────────

export const forgotAccessCode = async (
  req: Request<object, object, { email: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }

    const user = await findUserByEmail(email.trim());

    if (!user) {
      res.status(404).json({ error: "User not found with this email" });
      return;
    }

    const otp = generateOTP();
    const redisKey = `accesscode:${email.toLowerCase().trim()}`;

    // Store OTP in Redis with 12-hour TTL (43200 seconds)
    await redis.set(redisKey, otp, { ex: 600 });

    // Send OTP via email
    await sendOTP(email.trim(), otp);

    log({
      event: "forgot_access_code_requested",
      email: email.trim(),
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/verify-otp ──────────────────────────────────────────────────

export const verifyOTP = async (
  req: Request<object, object, { email: string; otp: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      res.status(400).json({ error: "Email and OTP are required" });
      return;
    }

    const redisKey = `accesscode:${email.toLowerCase().trim()}`;
    const storedOTP = await redis.get<string | number>(redisKey);

    if (!storedOTP) {
      res.status(400).json({ error: "OTP expired or not found" });
      return;
    }

    if (String(storedOTP) !== String(otp).trim()) {
      res.status(400).json({ error: "Invalid OTP" });
      return;
    }

    // OTP is valid, fetch user to return access code
    const user = await findUserByEmail(email.trim());

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete OTP from Redis after successful verification
    await redis.del(redisKey);

    log({
      event: "otp_verified_successfully",
      email: email.trim(),
    });

    res.status(200).json({
      message: "OTP verified successfully",
      accessCode: user.access_code,
    });
  } catch (err) {
    next(err);
  }
};
