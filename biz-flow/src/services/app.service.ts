import { supabase } from "../config/supabase";

// ─── Join code generator ─────────────────────────────────────────────────────

const PREFIXES = [
  "APP",
  "SPLT",
  "TASK",
  "TRCK",
  "NOTE",
  "POLL",
  "HBIT",
  "BUDG",
  "PLAN",
  "LIST",
  "MEET",
  "GOAL",
  "TEAM",
  "WORK",
];

export const generateJoinCode = (): string => {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const hex = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase(),
  ).join("");
  return `${prefix}-${hex}`;
};

const generateUniqueJoinCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    const { data } = await supabase
      .from("apps")
      .select("id")
      .eq("join_code", code)
      .single();
    if (!data) return code;
  }
  return `APP-${Date.now().toString(36).toUpperCase().slice(-4)}`;
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppRow {
  id: string;
  name: string;
  description: string | null;
  schema: Record<string, unknown>;
  owner_id: string;
  join_code: string | null;
  created_at: string;
}

export interface AppDataRow {
  id: string;
  app_id: string;
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface AppChatRow {
  id: string;
  app_id: string;
  user_id: string;
  role: "user" | "ai";
  message: string;
  created_at: string;
}

export interface AppMemberRow {
  id: string;
  app_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface AppMemberInfo {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
}

export const getAppMembers = async (
  appId: string,
): Promise<AppMemberInfo[]> => {
  const { data, error } = await supabase
    .from("app_members")
    .select("user_id, role, joined_at, users(full_name, email)")
    .eq("app_id", appId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch app members: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    user_id: row.user_id,
    full_name: row.users?.full_name ?? "Unknown",
    email: row.users?.email ?? "Unknown",
    role: row.role,
    joined_at: row.joined_at,
  }));
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export const getUserApps = async (userId: string): Promise<AppRow[]> => {
  // Apps owned by the user
  const { data: ownedApps, error: ownedErr } = await supabase
    .from("apps")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (ownedErr)
    throw new Error(`Failed to fetch owned apps: ${ownedErr.message}`);

  // Apps the user is a member of
  const { data: memberships, error: memberErr } = await supabase
    .from("app_members")
    .select("app_id")
    .eq("user_id", userId);

  if (memberErr)
    throw new Error(`Failed to fetch memberships: ${memberErr.message}`);

  const memberAppIds = (memberships ?? [])
    .map((m) => m.app_id)
    .filter((id) => !(ownedApps ?? []).some((a) => a.id === id));

  let memberApps: AppRow[] = [];
  if (memberAppIds.length > 0) {
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .in("id", memberAppIds)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch member apps: ${error.message}`);
    memberApps = (data ?? []) as AppRow[];
  }

  return [...((ownedApps ?? []) as AppRow[]), ...memberApps];
};

export const getAppById = async (appId: string): Promise<AppRow | null> => {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("id", appId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to fetch app: ${error.message}`);
  }

  return data as AppRow;
};

export const getAppData = async (appId: string): Promise<AppDataRow[]> => {
  const { data, error } = await supabase
    .from("app_data")
    .select("*")
    .eq("app_id", appId);

  if (error) throw new Error(`Failed to fetch app data: ${error.message}`);
  return (data ?? []) as AppDataRow[];
};

export const getAppChatHistory = async (
  appId: string,
  userId: string,
  limit: number = 20,
): Promise<AppChatRow[]> => {
  const { data, error } = await supabase
    .from("app_chats")
    .select("*")
    .eq("app_id", appId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error)
    throw new Error(`Failed to fetch app chat history: ${error.message}`);

  return ((data ?? []) as AppChatRow[]).reverse();
};

export const saveAppChatMessage = async (
  appId: string,
  userId: string,
  role: "user" | "ai",
  msg: string,
): Promise<AppChatRow> => {
  const { data, error } = await supabase
    .from("app_chats")
    .insert({ app_id: appId, user_id: userId, role, message: msg })
    .select("*")
    .single();

  if (error)
    throw new Error(`Failed to save app chat message: ${error.message}`);

  return data as AppChatRow;
};

export const upsertAppData = async (
  appId: string,
  key: string,
  value: unknown,
): Promise<AppDataRow> => {
  const { data: existing } = await supabase
    .from("app_data")
    .select("id")
    .eq("app_id", appId)
    .eq("key", key)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("app_data")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw new Error(`Failed to update app data: ${error.message}`);
    return data as AppDataRow;
  }

  const { data, error } = await supabase
    .from("app_data")
    .insert({ app_id: appId, key, value })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to insert app data: ${error.message}`);
  return data as AppDataRow;
};

export const verifyAppMembership = async (
  appId: string,
  userId: string,
): Promise<boolean> => {
  // Owner always has access
  const { data: app } = await supabase
    .from("apps")
    .select("owner_id")
    .eq("id", appId)
    .single();

  if (app?.owner_id === userId) return true;

  const { data: member } = await supabase
    .from("app_members")
    .select("id")
    .eq("app_id", appId)
    .eq("user_id", userId)
    .single();

  return !!member;
};

// ─── Join code helpers ───────────────────────────────────────────────────────

export const createAppWithJoinCode = async (
  name: string,
  description: string | null,
  schema: Record<string, unknown>,
  ownerId: string,
): Promise<AppRow> => {
  const joinCode = await generateUniqueJoinCode();

  const { data, error } = await supabase
    .from("apps")
    .insert({
      name,
      description,
      schema,
      owner_id: ownerId,
      join_code: joinCode,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create app: ${error.message}`);
  return data as AppRow;
};

export const getAppByJoinCode = async (
  joinCode: string,
): Promise<AppRow | null> => {
  const { data, error } = await supabase
    .from("apps")
    .select("*")
    .eq("join_code", joinCode.toUpperCase().trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to look up join code: ${error.message}`);
  }

  return data as AppRow;
};

export const addAppMember = async (
  appId: string,
  userId: string,
  role: string = "member",
): Promise<AppMemberRow> => {
  const { data, error } = await supabase
    .from("app_members")
    .insert({ app_id: appId, user_id: userId, role })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to add member: ${error.message}`);
  return data as AppMemberRow;
};

export const isAppMember = async (
  appId: string,
  userId: string,
): Promise<boolean> => {
  const { data: app } = await supabase
    .from("apps")
    .select("owner_id")
    .eq("id", appId)
    .single();

  if (app?.owner_id === userId) return true;

  const { data } = await supabase
    .from("app_members")
    .select("id")
    .eq("app_id", appId)
    .eq("user_id", userId)
    .single();

  return !!data;
};

export const deleteApp = async (appId: string): Promise<void> => {
  const { error: dataErr } = await supabase
    .from("app_data")
    .delete()
    .eq("app_id", appId);
  if (dataErr) throw new Error(`Failed to delete app data: ${dataErr.message}`);

  const { error: chatErr } = await supabase
    .from("app_chats")
    .delete()
    .eq("app_id", appId);
  if (chatErr)
    throw new Error(`Failed to delete app chats: ${chatErr.message}`);

  const { error: memberErr } = await supabase
    .from("app_members")
    .delete()
    .eq("app_id", appId);
  if (memberErr)
    throw new Error(`Failed to delete app members: ${memberErr.message}`);

  const { error } = await supabase.from("apps").delete().eq("id", appId);
  if (error) throw new Error(`Failed to delete app: ${error.message}`);
};
export const joinSharedApp = async (data: { userId: string; code: string }): Promise<boolean> => {
  const { userId, code } = data;
  const app = await getAppByJoinCode(code);

  if (!app) {
    throw new Error("Invalid share code.");
  }

  const alreadyMember = await isAppMember(app.id, userId);
  if (alreadyMember) {
    throw new Error("You are already a member of this workspace.");
  }

  await addAppMember(app.id, userId);
  return true;
};
