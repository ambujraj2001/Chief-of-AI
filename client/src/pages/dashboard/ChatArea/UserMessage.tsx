import React from 'react';

interface UserMessageProps {
  content: React.ReactNode;
  avatarUrl: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content, avatarUrl }) => (
  <div className="flex gap-4 justify-end group animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="flex flex-col gap-1.5 max-w-[85%] items-end">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">You</p>
      <div className="p-4 rounded-xl bg-primary text-white leading-relaxed shadow-sm">
        {content}
      </div>
    </div>
    <div
      className="size-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-1 border-2 border-white dark:border-slate-800 shadow-sm"
      style={{ backgroundImage: avatarUrl, backgroundSize: 'cover' }}
    />
  </div>
);

export default UserMessage;
