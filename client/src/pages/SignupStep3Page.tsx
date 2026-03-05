import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import { useSignup } from '../context/useSignup';
import { apiSignup } from '../services/api';

const SignupStep3Page = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const { combined } = useSignup();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiSignup(combined());
      setAccessCode(result.accessCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [combined]);

  const handleCopy = useCallback(() => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [accessCode]);

  const handleLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased">
      <div className="layout-container flex h-full grow flex-col">
        {/* Navigation */}
        <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-slate-900 px-6 py-4 lg:px-20">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">smart_toy</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Chief of AI</h2>
          </div>
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>
        </header>

        {/* Main */}
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12 animate-slide-up">
          <div className="w-full mb-2">
            <ProgressBar step={3} totalSteps={3} label="Security Setup" />
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3 sm:mb-4">
              Finalize &amp; Secure
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-lg">
              {accessCode
                ? 'Your account is ready! Save your unique access code before continuing.'
                : 'Review your setup and create your account to get your master access code.'}
            </p>
          </div>

          {/* Access Code Card — shown after successful API call */}
          {accessCode ? (
            <div className="w-full rounded-xl border-2 border-primary/20 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl shadow-primary/5">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">lock</span>
                </div>

                <div className="text-center w-full">
                  <h3 className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 sm:mb-4">
                    Your Unique Access Code
                  </h3>
                  <div className="flex flex-col items-center gap-3 sm:flex-row justify-center">
                    <div className="flex h-14 sm:h-16 w-full items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 sm:px-6 font-mono text-xl sm:text-2xl font-bold tracking-widest text-primary sm:w-[320px]">
                      {accessCode}
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`flex h-14 sm:h-16 w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-6 font-bold text-white transition-all ${
                        copied ? 'bg-green-500 hover:bg-green-500' : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {copied ? 'check_circle' : 'content_copy'}
                      </span>
                      <span className="text-sm sm:text-base">{copied ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/30 w-full text-left">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0 text-[18px] sm:text-[24px]">warning</span>
                  <div className="text-xs sm:text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                    <span className="font-bold uppercase text-[10px] sm:text-xs block mb-1">Crucial Information</span>
                    Keep this code in a secure location. While we prioritize your privacy, you can recover this code via the "Forgot Access Code" flow if lost.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Pre-submit state — show a summary card + submit button */
            <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">rocket_launch</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm text-center max-w-xs">
                  Click below to create your account and receive your unique AI access code.
                </p>

                {error && (
                  <div className="w-full flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 border border-red-200 dark:border-red-900/30">
                    <span className="material-symbols-outlined text-red-500 shrink-0 text-[18px]">error</span>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 sm:mt-10 w-full flex flex-col gap-4">
            {accessCode ? (
              <>
                <button
                  onClick={handleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 dark:bg-white px-8 py-4 sm:py-5 text-base sm:text-lg font-bold text-white dark:text-slate-900 hover:opacity-90 transition-all shadow-lg"
                >
                  <span>Login</span>
                  <span className="material-symbols-outlined">login</span>
                </button>
                <p className="mt-4 text-center text-xs sm:text-sm text-slate-500">
                  By clicking above, you confirm that you have saved your access code.
                </p>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1 px-8 py-4 sm:py-5 rounded-xl border border-primary/20 text-slate-700 dark:text-slate-300 font-bold text-base sm:text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-3 rounded-xl bg-primary px-8 py-4 sm:py-5 text-base sm:text-lg font-bold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      <span>Creating Account…</span>
                    </>
                  ) : (
                    <>
                      <span>Create My Account</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto px-6 py-6 sm:py-8 text-center text-slate-500 text-[10px] sm:text-sm">
          <p>© 2026 Chief of AI Inc. Built for the era of intelligence.</p>
        </footer>
      </div>
    </div>
  );
};

export default SignupStep3Page;
