import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  rightSlot?: React.ReactNode;
}

const AppHeader = ({ rightSlot }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 md:px-10 bg-white dark:bg-slate-900">
      <button
        onClick={() => navigate("/login")}
        className="flex items-center gap-3 cursor-pointer"
      >
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
          Nexora
        </h2>
      </button>
      {rightSlot && <div>{rightSlot}</div>}
    </header>
  );
};

export default AppHeader;
