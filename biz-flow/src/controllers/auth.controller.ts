import { Request, Response, NextFunction } from 'express';
import { createUser, findUserByAccessCode, updateUserByAccessCode } from '../services/user.service';
import { SignupBody, BootConfigBody, UpdateProfileBody } from '../types/user.types';

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
      res.status(400).json({ error: 'fullName is required' });
      return;
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'A valid email is required' });
      return;
    }
    const validTones = ['professional', 'casual', 'technical', 'concise'];
    if (!validTones.includes(interactionTone)) {
      res.status(400).json({ error: `interactionTone must be one of: ${validTones.join(', ')}` });
      return;
    }
    if (typeof responseComplexity !== 'number' || responseComplexity < 1 || responseComplexity > 5) {
      res.status(400).json({ error: 'responseComplexity must be a number between 1 and 5' });
      return;
    }
    const validVoices = ['atlas', 'standard'];
    if (!validVoices.includes(voiceModel)) {
      res.status(400).json({ error: `voiceModel must be one of: ${validVoices.join(', ')}` });
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
      res.status(400).json({ error: 'accessCode is required' });
      return;
    }

    const user = await findUserByAccessCode(accessCode.trim());

    if (!user) {
      res.status(401).json({ error: 'Invalid access code' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role || 'User',
      },
      preferences: {
        interactionTone: user.interaction_tone,
        responseComplexity: user.response_complexity,
        voiceModel: user.voice_model,
        notifyResponseAlerts: user.notify_response_alerts,
        notifyDailyBriefing: user.notify_daily_briefing,
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
      res.status(400).json({ error: 'accessCode is required' });
      return;
    }

    const user = await updateUserByAccessCode(accessCode.trim(), updates);

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role || 'User',
      },
      preferences: {
        interactionTone: user.interaction_tone,
        responseComplexity: user.response_complexity,
        voice_model: user.voice_model,
        notify_response_alerts: user.notify_response_alerts,
        notify_daily_briefing: user.notify_daily_briefing,
      },
    });
  } catch (err) {
    next(err);
  }
};
