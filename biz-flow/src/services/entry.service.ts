import { supabase } from "../config/supabase";
import { generateEmbedding } from "./embedding.service";

export type EntryType = "memory" | "journal" | "knowledge" | "note";

export const findEntryByTitleAndType = async (
  userId: string,
  type: EntryType,
  title: string,
) => {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .ilike("title", title)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export const getUserMemories = async (userId: string) => {
  const { data: accessData, error: accessError } = await supabase
    .from("memory_access")
    .select("memory_id")
    .eq("user_id", userId);

  if (accessError) {
    console.warn(
      "[getUserMemories] memory_access query error, safely falling back to user's own memories:",
      accessError.message,
    );
  }

  const sharedIds = accessData ? accessData.map((a: any) => a.memory_id) : [];

  let query = supabase.from("entries").select("*").eq("type", "memory");

  if (sharedIds.length > 0) {
    query = query.or(`user_id.eq.${userId},id.in.(${sharedIds.join(",")})`);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const memories = data || [];
  if (memories.length === 0) return [];

  const memoryIds = memories.map((m: any) => m.id);

  // Fetch all access records for these memories
  const { data: allAccessRecords } = await supabase
    .from("memory_access")
    .select("memory_id, user_id")
    .in("memory_id", memoryIds);

  const accessRecords = allAccessRecords || [];

  // Collect all unique user IDs we need to fetch names for
  const userIds = new Set<string>();
  memories.forEach((m: any) => userIds.add(m.user_id));
  accessRecords.forEach((a: any) => userIds.add(a.user_id));

  let usersMap: Record<string, any> = {};
  if (userIds.size > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", Array.from(userIds));

    if (usersData) {
      usersData.forEach((u: any) => {
        usersMap[u.id] = u;
      });
    }
  }

  // Enrich memories
  const enrichedMemories = memories.map((m: any) => {
    const isOwner = m.user_id === userId;
    const memoryAccess = accessRecords.filter((a: any) => a.memory_id === m.id);

    const enriched = { ...m };

    if (!isOwner) {
      enriched.shared_by = usersMap[m.user_id]
        ? {
            full_name: usersMap[m.user_id].full_name,
            email: usersMap[m.user_id].email,
          }
        : null;
    }

    const sharedWithIds = isOwner
      ? memoryAccess.map((a: any) => a.user_id)
      : memoryAccess
          .filter((a: any) => a.user_id !== userId)
          .map((a: any) => a.user_id);

    enriched.shared_with = sharedWithIds.map((id: string) =>
      usersMap[id]
        ? { full_name: usersMap[id].full_name, email: usersMap[id].email }
        : { full_name: "Unknown User", email: "" },
    );

    return enriched;
  });

  return enrichedMemories;
};

export const getUserJournal = async (userId: string) => {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "journal")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const getUserKnowledge = async (userId: string) => {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "knowledge")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const addEntry = async (
  userId: string,
  type: EntryType,
  title: string | undefined,
  content: string,
) => {
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase
    .from("entries")
    .insert([{ user_id: userId, type, title, content, embedding }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateEntry = async (
  id: string,
  userId: string,
  title: string | undefined,
  content: string,
) => {
  const embedding = await generateEmbedding(content);

  const { data, error } = await supabase
    .from("entries")
    .update({ title, content, embedding, created_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteEntry = async (id: string, userId: string) => {
  const { data, error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(`Entry with ID ${id} not found or permission denied.`);
  }
  return true;
};

export const searchEntries = async (
  userId: string,
  type: EntryType,
  query: string,
  limit: number = 5,
) => {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_entries", {
    p_user_id: userId,
    p_type: type,
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  });

  if (error) throw new Error(error.message);
  return data || [];
};

export const createMemoryShareCode = async (
  userId: string,
  memoryId: string,
) => {
  const { data: memory, error: memoryError } = await supabase
    .from("entries")
    .select("id")
    .eq("id", memoryId)
    .eq("user_id", userId)
    .single();

  if (memoryError || !memory) {
    throw new Error("Memory not found or access denied.");
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "MEM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  const { data, error } = await supabase
    .from("memory_share_codes")
    .insert([{ memory_id: memoryId, share_code: code, created_by: userId, max_uses: 10 }])
    .select("share_code")
    .single();

  if (error) throw new Error(error.message);
  return data.share_code;
};

export const joinSharedMemory = async (userId: string, code: string) => {
  const { data: share, error: shareError } = await supabase
    .from("memory_share_codes")
    .select("memory_id, current_uses, max_uses, expires_at")
    .eq("share_code", code)
    .single();

  if (shareError || !share) {
    throw new Error("Invalid share code.");
  }

  if (share.current_uses >= share.max_uses) {
    throw new Error("Share code usage limit reached.");
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new Error("Share code has expired.");
  }

  const { data: existing } = await supabase
    .from("memory_access")
    .select("id")
    .eq("memory_id", share.memory_id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    throw new Error("You already have access to this memory.");
  }

  const { error: accessError } = await supabase
    .from("memory_access")
    .insert([{ memory_id: share.memory_id, user_id: userId }]);

  if (accessError) {
    if (accessError.code === "23505") return true;
    throw new Error(accessError.message);
  }

  await supabase
    .from("memory_share_codes")
    .update({ current_uses: share.current_uses + 1 })
    .eq("share_code", code);

  return true;
};
