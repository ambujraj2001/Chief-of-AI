import { useState } from 'react';
import { message } from 'antd';
import ChatArea from './ChatArea';

const DashboardPage = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      message.success('Link copied to clipboard!');
    });
  };

  return (
    <>
      {/* Top Nav */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-background-dark">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold flex items-center gap-2">
                Quarterly Report Analysis
                <span className="material-symbols-outlined text-xs text-slate-400 cursor-pointer hover:text-primary transition-colors">
                  edit
                </span>
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                  AI Status: Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Share */}
            <button
              onClick={handleShare}
              className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Share"
            >
              <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">share</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle dark mode"
            >
              <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">
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
