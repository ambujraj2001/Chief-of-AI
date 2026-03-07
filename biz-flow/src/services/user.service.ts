import { supabase } from "../config/supabase";
import { generateAccessCode } from "../utils/generateAccessCode";
import { SignupBody, UserRow } from "../types/user.types";

/**
 * Creates a new user record.
 * Retries once if the generated access code collides (extremely rare).
 */
export const createUser = async (
  body: SignupBody,
): Promise<Pick<UserRow, "id" | "access_code">> => {
  const {
    fullName,
    email,
    role,
    interactionTone,
    responseComplexity,
    voiceModel,
    notifyResponseAlerts,
    notifyDailyBriefing,
    twoFactorSecret,
  } = body;

  let accessCode = generateAccessCode();

  const insertData = {
    access_code: accessCode,
    full_name: fullName,
    email,
    role: role || "User",
    interaction_tone: interactionTone,
    response_complexity: responseComplexity,
    voice_model: voiceModel,
    notify_response_alerts: notifyResponseAlerts,
    notify_daily_briefing: notifyDailyBriefing,
    show_demo: false,
    two_factor_enabled: !!twoFactorSecret,
    two_factor_secret: twoFactorSecret || null,
  };

  const { data, error } = await supabase
    .from("users")
    .insert(insertData)
    .select("id, access_code")
    .single();

  if (error) {
    if (error.code === "23505") {
      accessCode = generateAccessCode();
      const retry = await supabase
        .from("users")
        .insert({
          ...insertData,
          access_code: accessCode,
        })
        .select("id, access_code")
        .single();

      if (retry.error) throw new Error(retry.error.message);
      return retry.data as Pick<UserRow, "id" | "access_code">;
    }

    throw new Error(error.message);
  }

  return data as Pick<UserRow, "id" | "access_code">;
};

/**
 * Looks up a user by their access code.
 * Returns null if not found.
 */
export const findUserByAccessCode = async (
  accessCode: string,
): Promise<UserRow | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("access_code", accessCode.toUpperCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as UserRow;
};

/**
 * Updates a user by their access code.
 */
export const updateUserByAccessCode = async (
  accessCode: string,
  updates: any,
): Promise<UserRow> => {
  const payload: any = {};
  if (updates.fullName) payload.full_name = updates.fullName;
  if (updates.email) payload.email = updates.email;
  if (updates.role) payload.role = updates.role;
  if (updates.interactionTone)
    payload.interaction_tone = updates.interactionTone;
  if (updates.responseComplexity !== undefined)
    payload.response_complexity = updates.responseComplexity;
  if (updates.voiceModel) payload.voice_model = updates.voiceModel;
  if (updates.notifyResponseAlerts !== undefined)
    payload.notify_response_alerts = updates.notifyResponseAlerts;
  if (updates.notifyDailyBriefing !== undefined)
    payload.notify_daily_briefing = updates.notifyDailyBriefing;
  if (updates.showDemo !== undefined) 
    payload.show_demo = updates.showDemo;
  if (updates.twoFactorEnabled !== undefined)
    payload.two_factor_enabled = updates.twoFactorEnabled;
  if (updates.twoFactorSecret !== undefined)
    payload.two_factor_secret = updates.twoFactorSecret;

  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("access_code", accessCode.toUpperCase())
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as UserRow;
};

/**
 * Looks up a user by their email.
 * Returns null if not found.
 */
export const findUserByEmail = async (
  email: string,
): Promise<UserRow | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as UserRow;
};
