import React from 'react';

interface AiMessageProps {
  content: React.ReactNode;
}

const AiMessage: React.FC<AiMessageProps> = ({ content }) => (
  <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
      <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
    </div>
    <div className="flex flex-col gap-1.5 max-w-[85%]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chief of AI</p>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
        {content}
      </div>
      <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Helpful">
          <span className="material-symbols-outlined text-sm">thumb_up</span>
        </button>
        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Not helpful">
          <span className="material-symbols-outlined text-sm">thumb_down</span>
        </button>
        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Copy">
          <span className="material-symbols-outlined text-sm">content_copy</span>
        </button>
      </div>
    </div>
  </div>
);

export default AiMessage;
