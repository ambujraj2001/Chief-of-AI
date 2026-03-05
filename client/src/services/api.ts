// Central API client — all backend calls go through here
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BASE_URL = isLocal 
  ? 'http://localhost:4000' 
  : (import.meta.env.VITE_API_URL ?? 'https://chief-of-ai.onrender.com');

export interface SignupPayload {
  fullName: string;
  email: string;
  interactionTone: 'professional' | 'casual' | 'technical' | 'concise';
  responseComplexity: number;
  voiceModel: 'atlas' | 'standard';
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
  };
}

export interface UpdateProfilePayload extends Partial<SignupPayload> {
  accessCode: string;
}

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const traceId = crypto.randomUUID();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-trace-id': traceId
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
  post<SignupResult>('/auth/signup', payload);

/** POST /auth/bootconfig — validates access code & returns user profile */
export const apiBootConfig = (accessCode: string): Promise<BootConfigResult> =>
  post<BootConfigResult>('/auth/bootconfig', { accessCode });

/** POST /auth/update-profile — updates user profile & preferences */
export const apiUpdateProfile = (payload: UpdateProfilePayload): Promise<BootConfigResult> =>
  post<BootConfigResult>('/auth/update-profile', payload);

/** POST /chat — sends message to AI agent & returns reply */
export interface ChatResult { reply: string }
export const apiChat = (message: string, accessCode: string): Promise<ChatResult> =>
  post<ChatResult>('/chat', { message, accessCode });

/** POST /auth/forgot-access-code — sends OTP to email */
export const apiForgotAccessCode = (email: string): Promise<{ message: string }> =>
  post<{ message: string }>('/auth/forgot-access-code', { email });

/** POST /auth/verify-otp — verifies OTP & returns access code */
export interface VerifyOTPResult {
  message: string;
  accessCode: string;
}
export const apiVerifyOTP = (email: string, otp: string): Promise<VerifyOTPResult> =>
  post<VerifyOTPResult>('/auth/verify-otp', { email, otp });
