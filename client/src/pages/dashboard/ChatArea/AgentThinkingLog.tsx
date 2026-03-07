import { useState, useEffect } from "react";

const AgentThinkingLog = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2400),
      setTimeout(() => setStep(3), 3600),
      setTimeout(() => setStep(4), 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { label: "Parsing user intent", icon: "manage_search" },
    { label: "Loading conversation context", icon: "forum" },
    { label: "Retrieving memory & knowledge", icon: "memory" },
    { label: "Evaluating available tools", icon: "terminal" },
    { label: "Synthesizing final response", icon: "auto_awesome" },
  ];

  return (
    <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 mt-1 shadow-lg border border-slate-700">
        <span className="material-symbols-outlined text-primary text-lg animate-pulse">
          hub
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none max-w-[85%] relative overflow-hidden">
        {/* Progress Background */}
        <div className="absolute top-0 left-0 h-0.5 bg-primary/20 w-full">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] font-mono">
              Agent Reasoning Engine
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 text-[11px] font-mono transition-all duration-500 ${
                idx <= step
                  ? "text-slate-700 dark:text-slate-200"
                  : "text-slate-400 dark:text-slate-700"
              }`}
            >
              <div className="relative">
                {idx < step ? (
                  <span className="material-symbols-outlined text-sm text-primary">
                    done_all
                  </span>
                ) : idx === step ? (
                  <span className="material-symbols-outlined text-sm text-primary animate-spin-slow">
                    sync
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-sm opacity-30">
                    {s.icon}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={`${idx === step ? "font-bold" : "font-medium"}`}
                >
                  {s.label}
                </span>
                {idx === step && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 animate-pulse transition-opacity">
                    {idx === 0 && "> mounting modules..."}
                    {idx === 1 && "> tokenizing intent vectors..."}
                    {idx === 2 && "> verifying middleware permissions..."}
                    {idx === 3 && "> selecting optimal response format..."}
                    {idx === 4 && "> finalizing cognitive stream..."}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentThinkingLog;
