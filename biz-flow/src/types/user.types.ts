// Chief of AI – types/user.types.ts

export type InteractionTone =
  | "professional"
  | "casual"
  | "technical"
  | "concise";
export type VoiceModel = "atlas" | "standard";

/** Raw row from the Supabase `users` table */
export interface UserRow {
  id: string;
  access_code: string;
  full_name: string;
  email: string;
  role: string;
  interaction_tone: InteractionTone;
  response_complexity: number;
  voice_model: VoiceModel;
  notify_response_alerts: boolean;
  notify_daily_briefing: boolean;
  show_demo: boolean;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  created_at: string;
  updated_at: string;
}

/** Signup request body (camelCase from client) */
export interface SignupBody {
  fullName: string;
  email: string;
  role?: string;
  interactionTone: InteractionTone;
  responseComplexity: number;
  voiceModel: VoiceModel;
  notifyResponseAlerts: boolean;
  notifyDailyBriefing: boolean;
  showDemo?: boolean;
  twoFactorSecret?: string;
  twoFactorCode?: string;
}

/** Profile Update request body */
export interface UpdateProfileBody extends Partial<SignupBody> {
  accessCode: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

/** BootConfig request body */
export interface BootConfigBody {
  accessCode: string;
  twoFactorCode?: string;
  sessionToken?: string;
}

/** Signup response */
export interface SignupResponse {
  accessCode: string;
  userId: string;
}

/** BootConfig response */
export interface BootConfigResponse {
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  preferences?: {
    interactionTone: InteractionTone;
    responseComplexity: number;
    voiceModel: VoiceModel;
    notifyResponseAlerts: boolean;
    notifyDailyBriefing: boolean;
    showDemo: boolean;
    twoFactorEnabled: boolean;
  };
  twoFactorRequired?: boolean;
  sessionToken?: string;
}
