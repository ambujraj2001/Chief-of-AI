import { useState, useRef, useCallback, useMemo } from 'react';
import AppHeader from '../../../components/AppHeader';
import { apiVerifyOTP, apiForgotAccessCode } from '../../../services/api';

interface OTPStepProps {
  email: string;
  onSuccess: (code: string) => void;
}

const OTPStep = ({ email, onSuccess }: OTPStepProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = useCallback((index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError(null);

    // Focus last filled input or the first empty one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  }, [otp]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError(null);
    try {
      await apiForgotAccessCode(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  }, [email]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiVerifyOTP(email, otpValue);
      onSuccess(result.accessCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }, [email, otp, onSuccess]);

  const isFormValid = useMemo(() => otp.every(digit => digit !== ''), [otp]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <AppHeader />

          <main className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="layout-content-container flex flex-col max-w-[420px] w-full bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-slide-up">
              <div className="flex flex-col gap-3 mb-8 text-center sm:text-left">
                <h1 className="text-slate-900 dark:text-white text-2xl sm:text-3xl font-bold tracking-tight">Enter OTP</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal leading-normal">
                  We've sent a 6-digit verification code to <span className="text-slate-900 dark:text-slate-100 font-medium">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="flex justify-between gap-2 md:gap-4 mb-8">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      placeholder="•"
                      className="w-full h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus:outline-none rounded-lg transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm mb-6 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-wide hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    ) : (
                      <span className="truncate">Verify & Login</span>
                    )}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-primary text-sm font-semibold hover:underline decoration-primary/30 underline-offset-4 disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : "Didn't receive the code? Resend Code"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-12 flex justify-center opacity-50 grayscale hover:grayscale-0 transition-all">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>lock</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Secure AI Verification</span>
                </div>
              </div>
            </div>
          </main>

          <footer className="p-6 text-center text-slate-400 dark:text-slate-600 text-xs">
            © 2026 Chief of AI. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default OTPStep;
