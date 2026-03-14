import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../../components/ProgressBar";
import { useSignup } from "../../context/useSignup";
import { apiSignup, apiGenerateSignup2FA } from "../../services/api";

const SignupStep3Page = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const { combined } = useSignup();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 2FA State
  const [use2FA, setUse2FA] = useState(true);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const init2FA = async () => {
      try {
        const data = combined();
        const { secret, qrCodeUrl } = await apiGenerateSignup2FA(data.email);
        setTwoFactorSecret(secret);
        setQrCodeUrl(qrCodeUrl);
      } catch {
        setError("Failed to initialize security setup");
      }
    };
    init2FA();
  }, [combined]);

  const handleSubmit = useCallback(async () => {
    if (use2FA && (!verificationCode || verificationCode.length !== 6)) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...combined(),
        ...(use2FA ? { twoFactorSecret, twoFactorCode: verificationCode } : {}),
      };
      const result = await apiSignup(payload);
      setAccessCode(result.accessCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [combined, twoFactorSecret, verificationCode, use2FA]);

  const handleCopy = useCallback(() => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [accessCode]);

  const handleLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased">
      <div className="layout-container flex h-full grow flex-col">
        {/* Navigation */}
        <header className="flex items-center justify-between border-b border-primary/10 bg-white dark:bg-slate-900 px-6 py-4 lg:px-20">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Nexora</h2>
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
                ? "Your account is ready! Save your unique access code before continuing."
                : "Review your setup and create your account to get your master access code."}
            </p>
          </div>

          {/* Access Code Card — shown after successful API call */}
          {accessCode ? (
            <div className="w-full rounded-xl border-2 border-primary/20 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl shadow-primary/5">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                    lock
                  </span>
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
                        copied
                          ? "bg-green-500 hover:bg-green-500"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {copied ? "check_circle" : "content_copy"}
                      </span>
                      <span className="text-sm sm:text-base">
                        {copied ? "Copied!" : "Copy Code"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-900/30 w-full text-left">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0 text-[18px] sm:text-[24px]">
                    warning
                  </span>
                  <div className="text-xs sm:text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                    <span className="font-bold uppercase text-[10px] sm:text-xs block mb-1">
                      Crucial Information
                    </span>
                    Keep this code in a secure location. While we prioritize
                    your privacy, you can recover this code via the "Forgot
                    Access Code" flow if lost.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Pre-submit state — show 2FA setup */
            <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md">
              <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-2 w-full">
                  <div className="rounded-full bg-primary/10 p-3 w-fit mx-auto">
                    <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                      security
                    </span>
                  </div>
                  <h2 className="text-lg font-bold">Security Setup</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">
                    Protect your account with two-factor authentication.
                  </p>
                </div>

                {/* 2FA Toggle */}
                <div className="flex items-center justify-between w-full mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors ${use2FA ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {use2FA ? "shield_lock" : "shield"}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">Two-Factor Auth</p>
                      <p className="text-[10px] text-slate-500">
                        {use2FA ? "Enabled (Highly Recommended)" : "Disabled"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUse2FA(!use2FA)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${use2FA ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${use2FA ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                {use2FA ? (
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs">
                        Scan the QR code with your authenticator app
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px]">
                        (e.g., Google Authenticator, Microsoft Authenticator)
                      </p>
                    </div>
                    {qrCodeUrl ? (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                        <img
                          src={qrCodeUrl}
                          alt="2FA QR Code"
                          className="w-40 sm:w-48 h-40 sm:h-48 mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined animate-spin text-slate-300">
                          progress_activity
                        </span>
                      </div>
                    )}

                    <div className="w-full max-w-[280px] space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center block">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(
                            e.target.value.replace(/[^0-9]/g, ""),
                          )
                        }
                        placeholder="000000"
                        maxLength={6}
                        className="block w-full text-center text-2xl font-mono tracking-[0.5em] py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-primary focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                      <p className="text-[10px] text-slate-500 text-center">
                        Enter the 6-digit code from your app to verify setup.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="w-full py-8 px-4 text-center space-y-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
                      lock_open
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto">
                      You've opted out of additional security. You can always
                      enable this later from your profile settings.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="w-full flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 border border-red-200 dark:border-red-900/30">
                    <span className="material-symbols-outlined text-red-500 shrink-0 text-[18px]">
                      error
                    </span>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
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
                  By clicking above, you confirm that you have saved your access
                  code.
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
                      <span className="material-symbols-outlined animate-spin text-[20px]">
                        progress_activity
                      </span>
                      <span>
                        {use2FA ? "Verifying & Creating…" : "Creating Account…"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {use2FA ? "Verify & Create Account" : "Create Account"}
                      </span>
                      <span className="material-symbols-outlined">
                        {use2FA ? "security" : "person_add"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto px-6 py-6 sm:py-8 text-center text-slate-500 text-[10px] sm:text-sm">
          <p>© 2026 Nexora Inc. Built for the era of intelligence.</p>
        </footer>
      </div>
    </div>
  );
};

export default SignupStep3Page;
