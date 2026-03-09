import { supabase } from "../config/supabase";

export const findTaskByTitle = async (userId: string, title: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .ilike("title", title)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export interface TaskRow {
  id?: string;
  user_id: string;
  title: string;
  status?: string;
  priority?: string;
  due_date?: string | null;
  created_at?: string;
}

export const getUserTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const addTask = async (task: TaskRow) => {
  const { data, error } = await supabase
    .from("tasks")
    .insert([task])
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateTask = async (
  taskId: string,
  userId: string,
  updates: Partial<TaskRow>,
) => {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteTask = async (taskId: string, userId: string) => {
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(`Task with ID ${taskId} not found or permission denied.`);
  }

  return true;
};
