import { useState, useCallback } from "react";
import SignupStep1Page from "./SignupStep1Page";
import SignupStep2Page from "./SignupStep2Page";
import SignupStep3Page from "./SignupStep3Page";

const SignupPage = () => {
  const [step, setStep] = useState(1);

  const nextStep = useCallback(() => setStep((s) => s + 1), []);
  const prevStep = useCallback(() => setStep((s) => s - 1), []);

  return (
    <>
      {step === 1 && <SignupStep1Page onNext={nextStep} />}
      {step === 2 && <SignupStep2Page onNext={nextStep} onBack={prevStep} />}
      {step === 3 && <SignupStep3Page onBack={prevStep} />}
    </>
  );
};

export default SignupPage;
