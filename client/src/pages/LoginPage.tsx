import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { apiBootConfig } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apiBootConfig(userCode.trim());
      // Store user in session storage so the dashboard can read it
      // Persist access code for auto-login on future visits
      localStorage.setItem('accessCode', userCode.trim().toUpperCase());
      sessionStorage.setItem('chief_user', JSON.stringify(result));
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        <AppHeader />

        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-[420px] space-y-8 animate-slide-up">
            {/* Hero Text */}
            <div className="text-center space-y-2">
              <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base">
                Enter your unique access code to continue
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="user-code"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >
                    User Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">key</span>
                    </div>
                    <input
                      id="user-code"
                      name="user-code"
                      type="text"
                      value={userCode}
                      onChange={(e) => {
                        setUserCode(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      placeholder="AI-XXXX-XXXX"
                      className="block w-full pl-11 pr-4 py-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono tracking-widest uppercase outline-none"
                      required
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !userCode.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Login to Dashboard</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Don't have an access code?{' '}
                  <button
                    onClick={() => navigate('/signup')}
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
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </div>
          </div>
        </main>

        <footer className="py-8 px-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            © 2026 Chief of AI • Secure Enterprise Version
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
