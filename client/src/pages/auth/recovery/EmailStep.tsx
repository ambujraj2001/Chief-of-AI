import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../../components/AppHeader";
import { apiForgotAccessCode } from "../../../services/api";

interface EmailStepProps {
  onSuccess: (email: string) => void;
}

const EmailStep = ({ onSuccess }: EmailStepProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;

      setLoading(true);
      setError(null);

      try {
        await apiForgotAccessCode(email.trim());
        onSuccess(email.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [email, onSuccess],
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      setError(null);
    },
    [],
  );

  const handleGoToLogin = useCallback(() => navigate("/login"), [navigate]);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center sm:text-left">
          <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-8 animate-slide-up">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary mb-2 mx-auto sm:mx-0">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "28px" }}
                >
                  lock_reset
                </span>
              </div>
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-bold tracking-tight">
                Forgot Access Code
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-normal leading-relaxed">
                Enter your registered email address and we'll send you a
                passcode to reset your access.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-normal ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    style={{ fontSize: "20px" }}
                  >
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                    className="flex w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 focus:border-primary h-14 pl-12 pr-4 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-base font-normal transition-all outline-none"
                    placeholder="name@company.com"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1">
                    <span className="material-symbols-outlined text-[16px]">
                      error
                    </span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <span
                        className="material-symbols-outlined animate-spin mr-2"
                        style={{ fontSize: "20px" }}
                      >
                        progress_activity
                      </span>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Passcode</span>
                      <span
                        className="material-symbols-outlined ml-2"
                        style={{ fontSize: "20px" }}
                      >
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-transparent text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-bold leading-normal transition-colors"
                >
                  <span
                    className="material-symbols-outlined mr-2"
                    style={{ fontSize: "18px" }}
                  >
                    arrow_back
                  </span>
                  <span>Back to Login</span>
                </button>
              </div>
            </form>

            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50">
                <span
                  className="material-symbols-outlined text-primary"
                  style={{ fontSize: "20px" }}
                >
                  info
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  If you no longer have access to this email address, please
                  contact your workspace administrator or our support team for
                  manual verification.
                </p>
              </div>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none select-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-600"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        </div>
      </div>
    </div>
  );
};

export default EmailStep;
