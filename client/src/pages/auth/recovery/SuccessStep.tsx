import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../../components/AppHeader';

interface SuccessStepProps {
  accessCode: string;
}

const SuccessStep = ({ accessCode }: SuccessStepProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [accessCode]);

  const handleGoToLogin = useCallback(() => navigate('/login'), [navigate]);

  const codeParts = useMemo(() => 
    accessCode ? accessCode.split('-') : ['AI', 'XXXX', 'XXXX'],
    [accessCode]
  );

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <div className="relative flex h-full min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <AppHeader />

          <main className="flex flex-1 justify-center py-12 px-4">
            <div className="layout-content-container flex flex-col max-w-[420px] w-full bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-xl shadow-sm border border-primary/10 h-fit self-center animate-slide-up">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-2xl sm:text-3xl font-bold leading-tight">
                  Access Code Recovered
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-normal leading-relaxed max-w-sm">
                  Your identity has been verified. Below is your unique system access code.
                </p>
              </div>

              <div className="mt-10 mb-8">
                <div className="bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl p-6 flex flex-col items-center gap-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Your Access Code</span>
                  <div className="flex items-center gap-2 font-mono text-2xl lg:text-3xl font-bold tracking-wider text-primary">
                    <span>{codeParts[0]}</span>
                    <span className="text-primary/30">-</span>
                    <span>{codeParts[1]}</span>
                    {codeParts[2] && (
                      <>
                        <span className="text-primary/30">-</span>
                        <span>{codeParts[2]}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCopy}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white gap-2 text-sm font-bold leading-normal tracking-wide hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
                  <span className="truncate">{copied ? 'Copied to Clipboard' : 'Copy Access Code'}</span>
                </button>
                <button
                  onClick={handleGoToLogin}
                  className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary/10 text-primary gap-2 text-sm font-bold leading-normal tracking-wide hover:bg-primary/20 transition-all"
                >
                  <span className="material-symbols-outlined">login</span>
                  <span className="truncate">Back to Login</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-primary/10">
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 mt-0.5">warning</span>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-normal">
                    <strong>Security Note:</strong> This code will only be displayed once. If lost, you will need to repeat the recovery process.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <footer className="py-6 text-center text-slate-500 dark:text-slate-500 text-xs">
            © 2026 Chief of AI • Secure Access Management Systems
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SuccessStep;
