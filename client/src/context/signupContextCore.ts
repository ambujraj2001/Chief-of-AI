import { createContext } from 'react';
import type { SignupPayload } from '../services/api';

export interface Step1Data {
  fullName: string;
  email: string;
}

export interface Step2Data {
  interactionTone: SignupPayload['interactionTone'];
  responseComplexity: number;
  voiceModel: SignupPayload['voiceModel'];
  notifyResponseAlerts: boolean;
  notifyDailyBriefing: boolean;
}

export interface SignupContextValue {
  step1: Step1Data;
  step2: Step2Data;
  setStep1: (data: Step1Data) => void;
  setStep2: (data: Step2Data) => void;
  combined: () => SignupPayload;
}

export const SignupContext = createContext<SignupContextValue | null>(null);
