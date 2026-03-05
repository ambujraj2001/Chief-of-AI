import { useState, useCallback } from 'react';
import ProgressBar from '../components/ProgressBar';
import { useSignup } from '../context/useSignup';
import type { SignupPayload } from '../services/api';

type Tone = SignupPayload['interactionTone'];

const TONE_OPTIONS: { label: string; value: Tone; icon: string }[] = [
  { label: 'Professional', value: 'professional', icon: 'work' },
  { label: 'Casual', value: 'casual', icon: 'chat' },
  { label: 'Technical', value: 'technical', icon: 'code' },
  { label: 'Concise', value: 'concise', icon: 'short_text' },
];

const COMPLEXITY_LABELS: Record<number, string> = {
  1: 'Simple',
  2: 'Simplified',
  3: 'Balanced',
  4: 'Detailed',
  5: 'Expert',
};

const VOICE_OPTIONS: { label: string; value: SignupPayload['voiceModel'] }[] = [
  { label: 'Atlas (Deep, Professional)', value: 'atlas' },
  { label: 'Standard', value: 'standard' },
];

const SignupStep2Page = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const { step2, setStep2 } = useSignup();

  const [tone, setTone] = useState<Tone>(step2.interactionTone);
  const [complexity, setComplexity] = useState(step2.responseComplexity);
  const [voice, setVoice] = useState<SignupPayload['voiceModel']>(step2.voiceModel);
  const [responseAlerts, setResponseAlerts] = useState(step2.notifyResponseAlerts);
  const [dailyBriefing, setDailyBriefing] = useState(step2.notifyDailyBriefing);

  const handleNext = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setStep2({
      interactionTone: tone,
      responseComplexity: complexity,
      voiceModel: voice,
      notifyResponseAlerts: responseAlerts,
      notifyDailyBriefing: dailyBriefing,
    });
    onNext();
  }, [tone, complexity, voice, responseAlerts, dailyBriefing, setStep2, onNext]);

  const handleSetTone = useCallback((value: Tone) => {
    setTone(value);
  }, []);

  const handleComplexityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setComplexity(Number(e.target.value));
  }, []);

  const handleVoiceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setVoice(e.target.value as SignupPayload['voiceModel']);
  }, []);

  const handleResponseAlertsChange = useCallback(() => {
    setResponseAlerts((v) => !v);
  }, []);

  const handleDailyBriefingChange = useCallback(() => {
    setDailyBriefing((v) => !v);
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/10 px-6 py-4 md:px-10 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
              Chief of AI
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="hidden md:block text-slate-500 hover:text-primary font-medium text-sm transition-colors"
            >
              Back
            </button>
            <button
              form="step2-form"
              type="submit"
              className="flex min-w-[100px] items-center justify-center rounded-lg h-10 px-5 bg-primary text-slate-50 text-sm font-bold leading-normal transition-colors hover:bg-primary/90"
            >
              Next Step
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[800px] mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-slide-up">
            <div className="mb-8">
              <h1 className="text-slate-900 dark:text-slate-100 text-2xl sm:text-4xl font-black leading-tight tracking-tight mb-2 text-center sm:text-left">
                Set up your Profile
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal text-center sm:text-left">
                Customize your AI experience to fit your professional needs.
              </p>
            </div>

            <ProgressBar step={2} totalSteps={3} label="Onboarding Progress" />

            <form id="step2-form" className="space-y-8 sm:space-y-12" onSubmit={handleNext}>
              {/* AI Preferences */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  <h2 className="text-slate-900 dark:text-slate-100 text-lg sm:text-xl font-bold leading-tight">
                    AI Preferences
                  </h2>
                </div>

                {/* Interaction Tone */}
                <div>
                  <label className="text-slate-700 dark:text-slate-300 text-sm font-medium block mb-3">
                    Interaction Tone
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {TONE_OPTIONS.map(({ label, value, icon }) => {
                      const active = tone === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleSetTone(value)}
                          className={`flex flex-col items-center justify-center p-3 sm:p-4 border-2 rounded-xl transition-all ${
                            active
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-primary/10 hover:border-primary/40 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className="material-symbols-outlined mb-1 text-[20px] sm:text-[24px]">{icon}</span>
                          <span className={`text-[10px] sm:text-xs ${active ? 'font-bold' : 'font-medium'}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Response Complexity */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                      Response Complexity
                    </label>
                    <span className="text-primary text-xs font-bold">
                      {COMPLEXITY_LABELS[complexity]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={complexity}
                    onChange={handleComplexityChange}
                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold px-1">
                    <span>Simple</span>
                    <span>Expert</span>
                  </div>
                </div>

                {/* Voice Model */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                    Voice Model
                  </label>
                  <div className="relative">
                    <select
                      value={voice}
                      onChange={handleVoiceChange}
                      className="w-full rounded-lg border border-primary/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary h-12 px-4 appearance-none outline-none transition-all text-sm"
                    >
                      {VOICE_OPTIONS.map(({ label, value: v }) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">keyboard_voice</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Notification Settings */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                  <span className="material-symbols-outlined text-primary">notifications</span>
                  <h2 className="text-slate-900 dark:text-slate-100 text-lg sm:text-xl font-bold leading-tight">
                    Notification Settings
                  </h2>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {/* Response Alerts */}
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="pr-2">
                      <p className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
                        Response Alerts
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">
                        Notify when tasks are complete
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={responseAlerts}
                        onChange={handleResponseAlertsChange}
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
                    </label>
                  </div>

                  {/* Daily Briefing */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-primary/10">
                    <div className="pr-2">
                      <p className="text-slate-900 dark:text-slate-100 font-semibold text-sm">
                        Daily AI Briefing
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">
                        Morning automated summary
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={dailyBriefing}
                        onChange={handleDailyBriefingChange}
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
                    </label>
                  </div>
                </div>
              </section>

              {/* Footer Actions */}
              <div className="pt-6 border-t border-primary/10 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full sm:w-auto px-8 py-3 rounded-lg border border-primary/20 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Next: Finalize
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="p-6 text-center border-t border-primary/10 bg-white dark:bg-slate-900">
          <p className="text-slate-500 text-[10px] sm:text-xs">
            © 2026 Chief of AI Inc. All rights reserved.{' '}
            <a href="#" className="text-primary hover:underline">Privacy</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SignupStep2Page;
