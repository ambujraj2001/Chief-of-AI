import { useState, type ReactNode } from 'react';
import { SignupContext } from './signupContextCore';
import type { Step1Data, Step2Data } from './signupContextCore';
import type { SignupPayload } from '../services/api';

export const SignupProvider = ({ children }: { children: ReactNode }) => {
  const [step1, setStep1] = useState<Step1Data>({ fullName: '', email: '' });
  const [step2, setStep2] = useState<Step2Data>({
    interactionTone: 'professional',
    responseComplexity: 3,
    voiceModel: 'atlas',
    notifyResponseAlerts: true,
    notifyDailyBriefing: false,
  });

  const combined = (): SignupPayload => ({ ...step1, ...step2 });

  return (
    <SignupContext.Provider value={{ step1, step2, setStep1, setStep2, combined }}>
      {children}
    </SignupContext.Provider>
  );
};
