// Central API client — all backend calls go through here
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal
  ? "http://localhost:4000"
  : (import.meta.env.VITE_API_URL ?? "https://chief-of-ai.onrender.com");

export interface SignupPayload {
  fullName: string;
  email: string;
  interactionTone: "professional" | "casual" | "technical" | "concise";
  responseComplexity: number;
  voiceModel: "atlas" | "standard";
  notifyResponseAlerts: boolean;
  notifyDailyBriefing: boolean;
  twoFactorSecret?: string;
  twoFactorCode?: string;
}

export interface SignupResult {
  accessCode: string;
  userId: string;
}

export interface BootConfigResult {
  user?: { id: string; fullName: string; email: string; role: string };
  preferences?: {
    interactionTone: string;
    responseComplexity: number;
    voiceModel: string;
    notifyResponseAlerts: boolean;
    notifyDailyBriefing: boolean;
    showDemo: boolean;
    twoFactorEnabled: boolean;
  };
  twoFactorRequired?: boolean;
  sessionToken?: string;
}

export interface UpdateProfilePayload extends Partial<SignupPayload> {
  accessCode: string;
  showDemo?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const traceId = crypto.randomUUID();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-trace-id": traceId,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  }

  return data as T;
};

/** POST /auth/signup */
export const apiSignup = (payload: SignupPayload): Promise<SignupResult> =>
  post<SignupResult>("/auth/signup", payload);

/** POST /auth/bootconfig — validates access code & returns user profile */
export const apiBootConfig = (
  accessCode: string,
  twoFactorCode?: string,
  sessionToken?: string,
): Promise<BootConfigResult> =>
  post<BootConfigResult>("/auth/bootconfig", {
    accessCode,
    twoFactorCode,
    sessionToken,
  });

/** POST /auth/update-profile — updates user profile & preferences */
export const apiUpdateProfile = (
  payload: UpdateProfilePayload,
): Promise<BootConfigResult> =>
  post<BootConfigResult>("/auth/update-profile", payload);

/** POST /auth/2fa/generate */
export interface Generate2FAResult {
  secret: string;
  qrCodeUrl: string;
}
export const apiGenerate2FA = (
  accessCode: string,
): Promise<Generate2FAResult> =>
  post<Generate2FAResult>("/auth/2fa/generate", { accessCode });

/** POST /auth/2fa/enable */
export const apiEnable2FA = (
  accessCode: string,
  secret: string,
  code: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/2fa/enable", { accessCode, secret, code });

/** POST /auth/2fa/disable */
export const apiDisable2FA = (
  accessCode: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/2fa/disable", { accessCode });

export const apiGenerateSignup2FA = (
  email: string,
): Promise<{ secret: string; qrCodeUrl: string }> =>
  post<{ secret: string; qrCodeUrl: string }>("/auth/2fa/generate-signup", {
    email,
  });

/** POST /chat — sends message to AI agent & returns reply */
export interface ChatResult {
  reply: string;
}
export const apiChat = (
  message: string,
  accessCode: string,
  conversationId?: string,
): Promise<ChatResult> =>
  post<ChatResult>("/chat", { message, accessCode, conversationId });

/** POST /auth/forgot-access-code — sends OTP to email */
export const apiForgotAccessCode = (
  email: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/forgot-access-code", { email });

/** POST /auth/verify-otp — verifies OTP & returns access code */
export interface VerifyOTPResult {
  message: string;
  accessCode: string;
}
export const apiVerifyOTP = (
  email: string,
  otp: string,
): Promise<VerifyOTPResult> =>
  post<VerifyOTPResult>("/auth/verify-otp", { email, otp });

/** GET /chat/history — fetches user chat messages */
export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  created_at: string;
  conversation_id?: string;
}
export interface ChatHistoryResponse {
  messages: ChatMessage[];
}
export const apiGetChatHistory = async (
  accessCode: string,
): Promise<ChatHistoryResponse> => {
  const res = await fetch(
    `${BASE_URL}/chat/history?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as ChatHistoryResponse;
};

export interface MemoryEntry {
  id: string;
  type: string;
  title: string | null;
  content: string;
  created_at: string;
}

export interface MemoriesResponse {
  memories: MemoryEntry[];
}

export const apiGetMemories = async (
  accessCode: string,
): Promise<MemoriesResponse> => {
  const res = await fetch(
    `${BASE_URL}/chat/memories?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as MemoriesResponse;
};

export interface KnowledgeResponse {
  knowledge: MemoryEntry[]; // Reusing MemoryEntry since it shares same fields.
}

export const apiGetKnowledge = async (
  accessCode: string,
): Promise<KnowledgeResponse> => {
  const res = await fetch(
    `${BASE_URL}/chat/knowledge?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as KnowledgeResponse;
};

export interface JournalResponse {
  journal: MemoryEntry[]; // Reusing MemoryEntry since it shares same fields.
}

export const apiGetJournal = async (
  accessCode: string,
): Promise<JournalResponse> => {
  const res = await fetch(
    `${BASE_URL}/chat/journal?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as JournalResponse;
};

export interface TaskEntry {
  id: string;
  user_id: string;
  title: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
}

export interface TasksResponse {
  tasks: TaskEntry[];
}

export const apiGetTasks = async (
  accessCode: string,
): Promise<TasksResponse> => {
  const res = await fetch(
    `${BASE_URL}/chat/tasks?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as TasksResponse;
};

export interface ReminderEntry {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "completed" | "dismissed";
  remind_at: string;
  created_at: string;
}

export interface RemindersResponse {
  reminders: ReminderEntry[];
}

export const apiGetReminders = async (
  accessCode: string,
): Promise<RemindersResponse> => {
  const res = await fetch(
    `${BASE_URL}/chat/reminders?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as RemindersResponse;
};

export interface InsightEntry {
  title: string;
  description: string;
  type: "neutral" | "positive" | "negative" | "recommendation";
}

export interface InsightsResponse {
  insights: InsightEntry[];
}

export const apiGetInsights = async (
  accessCode: string,
  startDate?: string,
  endDate?: string,
): Promise<InsightsResponse> => {
  const params = new URLSearchParams({ accessCode });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const res = await fetch(`${BASE_URL}/chat/insights?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as InsightsResponse;
};

// ─── Files API ─────────────────────────────────────────────────────────────

export interface FileEntry {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export interface FilesResponse {
  files: FileEntry[];
}

export const apiGetFiles = async (
  accessCode: string,
): Promise<FilesResponse> => {
  const res = await fetch(
    `${BASE_URL}/files?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as FilesResponse;
};

export const apiUploadFile = async (
  accessCode: string,
  file: File,
): Promise<{ file: FileEntry }> => {
  const formData = new FormData();
  formData.append("accessCode", accessCode);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { file: FileEntry };
};

export const apiDeleteFile = async (
  accessCode: string,
  fileId: string,
): Promise<{ message: string }> => {
  const res = await fetch(
    `${BASE_URL}/files/${fileId}?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "DELETE",
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { message: string };
};
// ─── Apps API ───────────────────────────────────────────────────────────────

export interface AppSchema {
  layout: Array<{ component: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface AppEntry {
  id: string;
  name: string;
  description: string | null;
  schema: AppSchema;
  owner_id: string;
  join_code: string | null;
  created_at: string;
}

export interface AppDataEntry {
  id: string;
  app_id: string;
  key: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}

export interface AppChatMessage {
  id: string;
  app_id: string;
  user_id: string;
  role: "user" | "ai";
  message: string;
  created_at: string;
}

export interface AppChatResult {
  reply: string;
  dataUpdates?: Array<{ key: string; value: unknown }>;
}

/** POST /apps/join — join an app using a join code */
export interface JoinAppResult {
  status: "success" | "already_member";
  appId: string;
  appName?: string;
  message: string;
}
export const apiJoinApp = (
  accessCode: string,
  joinCode: string,
): Promise<JoinAppResult> =>
  post<JoinAppResult>("/apps/join", { accessCode, joinCode });

/** GET /apps — list all apps the user has access to */
export const apiGetApps = async (
  accessCode: string,
): Promise<{ apps: AppEntry[] }> => {
  const res = await fetch(
    `${BASE_URL}/apps?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { apps: AppEntry[] };
};

export interface AppMemberInfo {
  user_id: string;
  full_name: string;
  role: string;
  joined_at: string;
}

/** GET /apps/:appId — fetch app metadata + schema + members */
export const apiGetApp = async (
  appId: string,
  accessCode: string,
): Promise<{ app: AppEntry; members: AppMemberInfo[] }> => {
  const res = await fetch(
    `${BASE_URL}/apps/${appId}?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { app: AppEntry; members: AppMemberInfo[] };
};

/** GET /apps/:appId/data — fetch current app data */
export const apiGetAppData = async (
  appId: string,
  accessCode: string,
): Promise<{ data: AppDataEntry[] }> => {
  const res = await fetch(
    `${BASE_URL}/apps/${appId}/data?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error ?? `Request failed with status ${res.status}`);
  return json as { data: AppDataEntry[] };
};

/** GET /apps/:appId/chats — fetch user's chat history inside app */
export const apiGetAppChats = async (
  appId: string,
  accessCode: string,
): Promise<{ chats: AppChatMessage[] }> => {
  const res = await fetch(
    `${BASE_URL}/apps/${appId}/chats?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { chats: AppChatMessage[] };
};

/** POST /apps/:appId/chat — send message to app AI agent */
export const apiAppChat = (
  appId: string,
  message: string,
  accessCode: string,
): Promise<AppChatResult> =>
  post<AppChatResult>(`/apps/${appId}/chat`, { message, accessCode });

/** GET /apps/:appId/analyze — analyze app data and generate HTML report */
export const apiAnalyzeApp = async (
  appId: string,
  accessCode: string,
): Promise<{ html: string }> => {
  const res = await fetch(
    `${BASE_URL}/apps/${appId}/analyze?accessCode=${encodeURIComponent(
      accessCode,
    )}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { html: string };
};

/** DELETE /apps/:appId — delete app */
export const apiDeleteApp = async (
  appId: string,
  accessCode: string,
): Promise<{ message: string }> => {
  const res = await fetch(
    `${BASE_URL}/apps/${appId}?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { message: string };
};

/** Account Lock/Unlock */
export const apiLockAccount = (
  email: string,
  otp: string,
  twoFactorCode?: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/lock-account", {
    email,
    otp,
    twoFactorCode,
  });

export const apiRequestLockOTP = (
  email: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/request-lock-otp", { email });

export const apiRequestUnlockOTP = (
  email: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/request-unlock-otp", { email });

export const apiUnlockAccount = (
  email: string,
  otp: string,
  twoFactorCode?: string,
): Promise<{ message: string }> =>
  post<{ message: string }>("/auth/unlock-account", {
    email,
    otp,
    twoFactorCode,
  });

// ─── AI Routines API ────────────────────────────────────────────────────────
export interface AIRoutineEntry {
  id: string;
  name: string;
  instruction: string;
  cron_expression: string;
  is_active: boolean;
  last_run: string | null;
  created_at: string;
}

export interface AIRoutineRunEntry {
  id: string;
  routine_id: string;
  result: string;
  executed_at: string;
}

export interface AINotificationEntry {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const apiGetRoutines = async (
  accessCode: string,
): Promise<{ routines: AIRoutineEntry[] }> => {
  const res = await fetch(
    `${BASE_URL}/routines?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { routines: AIRoutineEntry[] };
};

export const apiCreateRoutine = (
  accessCode: string,
  name: string,
  instruction: string,
  cronExpression: string,
): Promise<AIRoutineEntry> =>
  post<AIRoutineEntry>("/routines", {
    accessCode,
    name,
    instruction,
    cronExpression,
  });

export const apiUpdateRoutine = async (
  routineId: string,
  updates: {
    name?: string;
    instruction?: string;
    cronExpression?: string;
    isActive?: boolean;
  },
): Promise<AIRoutineEntry> => {
  const res = await fetch(`${BASE_URL}/routines/${routineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as AIRoutineEntry;
};

export const apiDeleteRoutine = async (
  routineId: string,
): Promise<{ success: boolean }> => {
  const res = await fetch(`${BASE_URL}/routines/${routineId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { success: boolean };
};

export const apiGetRoutineRuns = async (
  routineId: string,
): Promise<{ runs: AIRoutineRunEntry[] }> => {
  const res = await fetch(`${BASE_URL}/routines/${routineId}/runs`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { runs: AIRoutineRunEntry[] };
};

export const apiGetNotifications = async (
  accessCode: string,
): Promise<{ notifications: AINotificationEntry[] }> => {
  const res = await fetch(
    `${BASE_URL}/routines/notifications?accessCode=${encodeURIComponent(accessCode)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  return data as { notifications: AINotificationEntry[] };
};

export const apiGenerateCron = (
  prompt: string,
): Promise<{ cronExpression: string }> =>
  post<{ cronExpression: string }>("/routines/generate-cron", { prompt });
