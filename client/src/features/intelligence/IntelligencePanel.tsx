import React from 'react';
import ContextStack from './ContextStack';
import ActivityStream from './ActivityStream';
import ActivitySimulator from '../../shared/ActivitySimulator';

const IntelligencePanel: React.FC = () => {
  return (
    <aside 
      className="w-[300px] xl:w-[350px] h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hidden lg:flex flex-col shrink-0 animate-in slide-in-from-right duration-500"
    >
      <ActivitySimulator />
      {/* Header */}
      <div className="p-6 pb-4 flex items-center gap-1.5">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span className="material-symbols-outlined text-[20px]">hub</span>
        </div>
        <div className="flex flex-col min-w-0 gap-0.5">
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">Intelligence</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Command Center</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 px-6 pb-6 space-y-6 overflow-hidden">
        <ActivityStream />
        <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
        <ContextStack />
      </div>

      {/* Footer / Connection Badge */}
      <div className="p-6 pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30">
          <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Core Engine Linked
          </span>
        </div>
      </div>
    </aside>
  );
};

export default IntelligencePanel;
