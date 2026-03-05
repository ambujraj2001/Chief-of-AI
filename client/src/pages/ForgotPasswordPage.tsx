import { useState, useCallback } from 'react';
import EmailStep from './auth/recovery/EmailStep';
import OTPStep from './auth/recovery/OTPStep';
import SuccessStep from './auth/recovery/SuccessStep';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleEmailSuccess = useCallback((userEmail: string) => {
    setEmail(userEmail);
    setStep(2);
  }, []);

  const handleOTPSuccess = useCallback((code: string) => {
    setAccessCode(code);
    setStep(3);
  }, []);

  return (
    <>
      {step === 1 && (
        <EmailStep 
          onSuccess={handleEmailSuccess} 
        />
      )}
      {step === 2 && (
        <OTPStep 
          email={email} 
          onSuccess={handleOTPSuccess} 
        />
      )}
      {step === 3 && (
        <SuccessStep 
          accessCode={accessCode} 
        />
      )}
    </>
  );
};

export default ForgotPasswordPage;
