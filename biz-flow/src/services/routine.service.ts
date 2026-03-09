import { supabase } from "../config/supabase";

export interface AIRoutine {
  id: string;
  user_id: string;
  name: string;
  instruction: string;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  last_run: string | null;
  created_at: string;
}

export interface AIRoutineRun {
  id: string;
  routine_id: string;
  result: string;
  executed_at: string;
}

export interface AINotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const getActiveRoutines = async (): Promise<AIRoutine[]> => {
  const { data, error } = await supabase
    .from("ai_routines")
    .select("*, users(*)")
    .eq("is_active", true);

  if (error) throw error;
  return data as any[];
};

export const getUserRoutines = async (userId: string): Promise<AIRoutine[]> => {
  const { data, error } = await supabase
    .from("ai_routines")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const createRoutine = async (
  routine: Partial<AIRoutine>,
): Promise<AIRoutine> => {
  const { data, error } = await supabase
    .from("ai_routines")
    .insert(routine)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const updateRoutine = async (
  id: string,
  updates: Partial<AIRoutine>,
): Promise<AIRoutine> => {
  const { data, error } = await supabase
    .from("ai_routines")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const deleteRoutine = async (id: string): Promise<void> => {
  const { data, error } = await supabase
    .from("ai_routines")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Routine with ID ${id} not found.`);
  }
};

export const getRoutineRuns = async (
  routineId: string,
): Promise<AIRoutineRun[]> => {
  const { data, error } = await supabase
    .from("ai_routine_runs")
    .select("*")
    .eq("routine_id", routineId)
    .order("executed_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const saveRoutineRun = async (
  run: Partial<AIRoutineRun>,
): Promise<AIRoutineRun> => {
  const { data, error } = await supabase
    .from("ai_routine_runs")
    .insert(run)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const createNotification = async (
  notif: Partial<AINotification>,
): Promise<AINotification> => {
  const { data, error } = await supabase
    .from("ai_notifications")
    .insert(notif)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const getUserNotifications = async (
  userId: string,
): Promise<AINotification[]> => {
  const { data, error } = await supabase
    .from("ai_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
