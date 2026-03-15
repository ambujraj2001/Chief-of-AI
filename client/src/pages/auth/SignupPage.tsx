import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { apiGoogleLogin } from "../../services/api";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/userSlice";

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(err instanceof Error ? err.message : "Google signup failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate, dispatch],
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-[420px] space-y-8 animate-slide-up">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Request Access
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Join Nexora for secure intelligence workspace
              </p>
            </div>

            <div className="bg-white dark:bg-card-dark/50 p-8 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
              <div className="space-y-6">
                <button
                  onClick={() => navigate("/signup-step-1")}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  ) : (
                    <>
                      <span>Start Manual Request</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-border-dark"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-card-dark text-slate-500">Or quick signup with</span>
                  </div>
                </div>

                <div className="flex justify-center w-full google-login-container">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google Signup Failed")}
                    theme="outline"
                    shape="pill"
                    size="large"
                    width="100%"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <span className="material-symbols-outlined text-[16px]">
                      error
                    </span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-border-dark text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Already have an access code?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SignupPage;
