// Central API client — all backend calls go through here
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

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
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
