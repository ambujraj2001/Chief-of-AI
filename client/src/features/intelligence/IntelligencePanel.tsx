import React from 'react';
import ContextPanel from './ContextPanel';
import ActivityStream from './ActivityStream';
import SystemStatusPanel from './SystemStatusPanel';

const IntelligencePanel: React.FC = () => {
  return (
    <aside 
      className="w-[280px] xl:w-[320px] h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hidden lg:flex flex-col shrink-0 animate-in slide-in-from-right duration-500"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[20px]">hub</span>
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Intelligence</h2>
          <span className="text-[10px] font-bold text-slate-400 -mt-1 uppercase tracking-widest">Command Center</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
        <ContextPanel />
        <ActivityStream />
        <SystemStatusPanel />
      </div>

      {/* Footer / Connection Badge */}
      <div className="p-6 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Core Engine Linked
          </span>
        </div>
      </div>
    </aside>
  );
};

export default IntelligencePanel;
