import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import {
  apiBootConfig,
  apiGoogleLogin,
  apiGithubLogin,
  apiLockAccount,
  apiRequestLockOTP,
  apiRequestUnlockOTP,
  apiUnlockAccount,
} from "../../services/api";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/userSlice";
import { message } from "antd";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

type FormMode = "login" | "lock" | "unlock";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formMode, setFormMode] = useState<FormMode>("login");
  const [step, setStep] = useState<1 | 2>(1);

  const [userCode, setUserCode] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const resetForm = useCallback((mode: FormMode) => {
    setFormMode(mode);
    setStep(1);
    setError(null);
    setTwoFactorCode("");
    setOtp("");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        if (formMode === "login") {
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
        } else if (formMode === "lock") {
          if (step === 1) {
            const res = await apiRequestLockOTP(email.trim());
            message.success(res.message);
            setStep(2);
          } else {
            const res = await apiLockAccount(
              email.trim(),
              otp.trim(),
              twoFactorCode.trim(),
            );
            message.success(res.message);
            resetForm("login");
          }
        } else if (formMode === "unlock") {
          if (step === 1) {
            const res = await apiRequestUnlockOTP(email.trim());
            message.success(res.message);
            setStep(2);
          } else {
            const res = await apiUnlockAccount(
              email.trim(),
              otp.trim(),
              twoFactorCode.trim(),
            );
            message.success(res.message);
            resetForm("login");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setLoading(false);
      }
    },
    [
      userCode,
      twoFactorCode,
      step,
      navigate,
      dispatch,
      formMode,
      email,
      otp,
      resetForm,
    ],
  );

  const handleTwoFactorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9]/g, "");
      setTwoFactorCode(val);
      setError(null);
    },
    [],
  );
  
  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiGoogleLogin(credentialResponse.credential);
        dispatch(
          setUser({ ...result, accessCode: result.accessCode }),
        );
        localStorage.setItem("accessCode", result.accessCode);
        sessionStorage.setItem("chief_user", JSON.stringify(result));
        navigate("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate, dispatch],
  );

  const handleGithubLogin = useCallback(() => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = window.location.origin + "/login";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      const loginWithGithub = async () => {
        setLoading(true);
        setError(null);
        try {
          const redirectUri = window.location.origin + "/login";
          const result = await apiGithubLogin(code, redirectUri);
          dispatch(setUser({ ...result, accessCode: result.accessCode }));
          localStorage.setItem("accessCode", result.accessCode);
          sessionStorage.setItem("chief_user", JSON.stringify(result));
          
          // Clear URL params
          window.history.replaceState({}, document.title, window.location.pathname);
          
          navigate("/dashboard");
        } catch (err) {
          setError(err instanceof Error ? err.message : "GitHub login failed");
        } finally {
          setLoading(false);
        }
      };
      loginWithGithub();
    }
  }, [navigate, dispatch]);

  const renderInputs = () => {
    if (formMode === "login") {
      return step === 1 ? (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            User Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">key</span>
            </div>
            <input
              type="text"
              value={userCode}
              onChange={(e) => {
                setUserCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="AI-XXXX-XXXX"
              className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none font-mono tracking-widest uppercase"
              required
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            Authenticator Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">
                lock
              </span>
            </div>
            <input
              type="text"
              value={twoFactorCode}
              onChange={handleTwoFactorChange}
              placeholder="6-digit code"
              maxLength={6}
              className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center font-mono tracking-[0.5em] outline-none"
              required
              autoFocus
            />
          </div>
        </div>
      );
    }

    if (formMode === "lock") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              User Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="email@example.com"
                className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={step === 2}
              />
            </div>
          </div>
          {step === 2 && (
            <>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Email OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      chat_bubble
                    </span>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="OTP from email"
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  2FA Code (If enabled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      security
                    </span>
                  </div>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={handleTwoFactorChange}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center font-mono tracking-[0.5em] outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    if (formMode === "unlock") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              User Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[20px]">
                  mail
                </span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="email@example.com"
                className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={step === 2}
              />
            </div>
          </div>
          {step === 2 && (
            <>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Email OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      chat_bubble
                    </span>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="OTP from email"
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center outline-none"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 animate-slide-up">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  2FA Code (If enabled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">
                      security
                    </span>
                  </div>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={handleTwoFactorChange}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary text-center font-mono tracking-[0.5em] outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[420px] animate-slide-up">
            {!(
              formMode === "login" && step === 1
            ) && (
              <div className="mb-6 text-center space-y-2">
                <h1 className="text-slate-900 dark:text-slate-100 text-2xl sm:text-3xl font-bold tracking-tight capitalize">
                  {formMode === "login" ? "Welcome back" : `${formMode} Account`}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base px-2">
                  {formMode === "login"
                    ? "Enter your unique access code to continue"
                    : formMode === "lock"
                      ? "Temporarily disable access to your account"
                      : "Verify your identity to regain access"}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-card-dark/50 p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm mx-2 sm:mx-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderInputs()}

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
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      <span>
                        {formMode === "login"
                          ? step === 1
                            ? "Login to Dashboard"
                            : "Verify & Continue"
                          : formMode === "lock"
                            ? step === 1
                              ? "Lock Account"
                              : "Confirm Lock"
                            : step === 1
                              ? "Send Unlock OTP"
                              : "Unlock Account"}
                      </span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                {formMode === "login" && step === 1 && (
                  <>
                    <div className="relative flex items-center gap-4 py-2">
                      <div className="flex-grow border-t border-slate-200 dark:border-border-dark"></div>
                      <span className="flex-shrink-0 text-sm text-slate-500 bg-white dark:bg-card-dark">Or continue with</span>
                      <div className="flex-grow border-t border-slate-200 dark:border-border-dark"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full items-stretch">
                      <div className="group relative min-w-0 overflow-hidden rounded-xl">
                        <div className="pointer-events-none flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-colors group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          <span>Google</span>
                        </div>
                        <div className="absolute inset-0 z-10 opacity-0">
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Login Failed")}
                            theme={darkMode ? "filled_black" : "outline"}
                            shape="pill"
                            size="large"
                            width="100%"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleGithubLogin}
                        className="flex w-full min-w-0 items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        <span className="truncate">GitHub</span>
                      </button>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 pt-2 text-center">
                  {formMode === "login" ? (
                    <div className="border-t border-slate-100 dark:border-border-dark pt-4 mt-2 space-y-4">
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-access-code")}
                        className="block mx-auto text-slate-500 hover:text-primary transition-colors underline-offset-4 hover:underline"
                      >
                        Forgot access code?
                      </button>
                      <div className="flex justify-center items-center gap-3 text-[11px] sm:text-xs text-slate-400">
                        <button
                          type="button"
                          onClick={() => resetForm("lock")}
                          className="font-bold hover:text-rose-500 transition-colors"
                        >
                          Lock Account
                        </button>
                        <span className="opacity-50">|</span>
                        <button
                          type="button"
                          onClick={() => resetForm("unlock")}
                          className="font-bold hover:text-emerald-500 transition-colors"
                        >
                          Unlock Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resetForm("login")}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      Back to Login
                    </button>
                  )}
                </div>
              </form>

              {formMode === "login" && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-border-dark text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Don't have an access code?{" "}
                    <button
                      onClick={() => navigate("/signup")}
                      className="text-primary font-semibold hover:underline"
                    >
                      Request a code
                    </button>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-6 mt-8 text-slate-400 dark:text-slate-600">
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

        <footer className="py-8 px-6 text-center mt-auto">
          <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest px-4">
            © 2026 Nexora • Secure Intelligence Workspace
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
