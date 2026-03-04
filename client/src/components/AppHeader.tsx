interface AppHeaderProps {
  rightSlot?: React.ReactNode;
}

const AppHeader = ({ rightSlot }: AppHeaderProps) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 md:px-10 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined text-xl">smart_toy</span>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
          Chief of AI
        </h2>
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </header>
  );
};

export default AppHeader;
