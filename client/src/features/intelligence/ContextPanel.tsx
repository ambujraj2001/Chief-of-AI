import React from 'react';
import { useAIStore } from '../../shared/store/aiStore';

const ContextPanel: React.FC = () => {
  const { memories, files, totalTokens } = useAIStore((state) => state.activeContext);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          AI Context
        </h3>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          {totalTokens.toLocaleString()} tokens
        </span>
      </div>

      <div className="space-y-4">
        {/* Memories */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-indigo-500">psychology</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Memories Referenced</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {memories.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic pl-1">No memories in current focus</p>
            ) : (
              memories.map((m) => (
                <div key={m.id} className="flex items-center justify-between pl-1 pb-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{m.title}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{m.tokens}t</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Files */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">description</span>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Files Analyzed</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {files.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic pl-1">No files in current focus</p>
            ) : (
              files.map((f) => (
                <div key={f.id} className="flex items-center justify-between pl-1 pb-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{f.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{f.tokens}t</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
