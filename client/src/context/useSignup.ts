import { useContext } from 'react';
import { SignupContext } from './signupContextCore';
import type { SignupContextValue } from './signupContextCore';

export const useSignup = (): SignupContextValue => {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error('useSignup must be used inside <SignupProvider>');
  return ctx;
};
