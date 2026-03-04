import React from 'react';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';

export const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const { checking } = useAuthBootstrap();

  if (checking) {
    // Minimal full-screen spinner while we validate
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            progress_activity
          </span>
          <p className="text-sm text-slate-500 font-medium">Loading Chief of AI…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
