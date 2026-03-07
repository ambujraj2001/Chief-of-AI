import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import { apiBootConfig } from "../services/api";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [userCode, setUserCode] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (step === 1 && !userCode.trim()) return;
      if (step === 2 && !twoFactorCode.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const result = await apiBootConfig(
          userCode.trim(),
          step === 2 ? twoFactorCode.trim() : undefined,
        );

        if (result.twoFactorRequired) {
          setStep(2);
          setLoading(false);
          return;
        }

        if (result.sessionToken) {
          localStorage.setItem("2fa_session", result.sessionToken);
        }

        dispatch(
          setUser({ ...result, accessCode: userCode.trim().toUpperCase() }),
        );
        localStorage.setItem("accessCode", userCode.trim().toUpperCase());
        sessionStorage.setItem("chief_user", JSON.stringify(result));
        navigate("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [userCode, twoFactorCode, step, navigate, dispatch],
  );

  const handleUserCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserCode(e.target.value.toUpperCase());
      setError(null);
    },
    [],
  );

  const handleTwoFactorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove any spaces or non-digit characters
      const val = e.target.value.replace(/[^0-9]/g, "");
      setTwoFactorCode(val);
      setError(null);
    },
    [],
  );

  const handleForgotAccessCode = useCallback(() => {
    navigate("/forgot-access-code");
  }, [navigate]);

  const handleSignup = useCallback(() => {
    navigate("/signup");
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[420px] space-y-6 sm:space-y-8 animate-slide-up">
            {/* Hero Text */}
            <div className="text-center space-y-2">
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base px-2">
                Enter your unique access code to continue
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mx-2 sm:mx-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 1 ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="user-code"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                    >
                      User Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">
                          key
                        </span>
                      </div>
                      <input
                        id="user-code"
                        name="user-code"
                        type="text"
                        value={userCode}
                        onChange={handleUserCodeChange}
                        placeholder="AI-XXXX-XXXX"
                        className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono tracking-widest uppercase outline-none"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="2fa-code"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                    >
                      Authenticator Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">
                          lock
                        </span>
                      </div>
                      <input
                        id="2fa-code"
                        name="2fa-code"
                        type="text"
                        value={twoFactorCode}
                        onChange={handleTwoFactorChange}
                        placeholder="6-digit code"
                        maxLength={6}
                        className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono tracking-[0.5em] text-center outline-none"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1">
                    <span className="material-symbols-outlined text-[16px]">
                      error
                    </span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    (step === 1 ? !userCode.trim() : !twoFactorCode.trim())
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {step === 1
                          ? "Login to Dashboard"
                          : "Verify & Continue"}
                      </span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
                {step === 1 && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={handleForgotAccessCode}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors decoration-2 underline-offset-4 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Forgot access code?
                    </button>
                  </div>
                )}
                {step === 2 && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors decoration-2 underline-offset-4 hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Return to code entry
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Don't have an access code?{" "}
                  <button
                    onClick={handleSignup}
                    className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 bg-transparent border-none cursor-pointer"
                  >
                    Request a code
                  </button>
                </p>
              </div>
            </div>

            {/* Bottom icons */}
            <div className="flex justify-center gap-6 text-slate-400 dark:text-slate-600">
              <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors">
                help_outline
              </span>
              <span className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors">
                language
              </span>
              <span
                onClick={toggleDark}
                className="material-symbols-outlined hover:text-primary cursor-pointer transition-colors"
                title="Toggle dark mode"
              >
                {darkMode ? "light_mode" : "dark_mode"}
              </span>
            </div>
          </div>
        </main>

        <footer className="py-8 px-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest px-4">
            © 2026 Chief of AI • Secure Enterprise Version
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
