import { useNavigate } from "react-router-dom";

const ComingSoonPage = ({
  title,
  message,
}: {
  title: string;
  message?: string;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/20 text-center animate-fade-in">
      <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
          construction
        </span>
      </div>
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
        {title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
        {message ||
          "We're working hard to bring this feature to your digital workplace. Stay tuned for updates as we continue building the future of AI operations."}
      </p>
      <button
        onClick={() => navigate("/dashboard")}
        className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Chat
      </button>
    </div>
  );
};

export default ComingSoonPage;
