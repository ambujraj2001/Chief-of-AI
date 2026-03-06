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
}

export interface SignupResult {
  accessCode: string;
  userId: string;
}

export interface BootConfigResult {
  user: { id: string; fullName: string; email: string; role: string };
  preferences: {
    interactionTone: string;
    responseComplexity: number;
    voiceModel: string;
    notifyResponseAlerts: boolean;
    notifyDailyBriefing: boolean;
    showDemo: boolean;
  };
}

export interface UpdateProfilePayload extends Partial<SignupPayload> {
  accessCode: string;
  showDemo?: boolean;
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
export const apiBootConfig = (accessCode: string): Promise<BootConfigResult> =>
  post<BootConfigResult>("/auth/bootconfig", { accessCode });

/** POST /auth/update-profile — updates user profile & preferences */
export const apiUpdateProfile = (
  payload: UpdateProfilePayload,
): Promise<BootConfigResult> =>
  post<BootConfigResult>("/auth/update-profile", payload);

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
