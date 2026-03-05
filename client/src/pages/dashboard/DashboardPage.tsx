import { useState, useCallback } from 'react';
import { message } from 'antd';
import ChatArea from './ChatArea';

const DashboardPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('Link copied to clipboard!');
    });
  }, []);

  return (
    <>
      {/* Top Nav */}
      <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-white dark:bg-background-dark">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
              <span className="truncate">Personal Workspace</span>
              <span className="material-symbols-outlined text-[14px] sm:text-xs text-slate-400 cursor-pointer hover:text-primary transition-colors shrink-0">
                edit
              </span>
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 sm:size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                Intelligence Synced
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Share */}
          <button
            onClick={handleShare}
            className="size-8 sm:size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Share"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-600 dark:text-slate-400">share</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="size-8 sm:size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle dark mode"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px] text-slate-600 dark:text-slate-400">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

        {/* Chat Area + Input */}
        <ChatArea />
    </>
  );
};

export default DashboardPage;
