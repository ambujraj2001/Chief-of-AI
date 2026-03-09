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
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "memory")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
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
