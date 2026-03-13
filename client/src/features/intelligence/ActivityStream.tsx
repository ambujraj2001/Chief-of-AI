import React from 'react';
import { useAIStore } from '../../shared/store/aiStore';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityStream: React.FC = () => {
  const activityFeed = useAIStore((state) => state.activityFeed);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          AI Activity
        </h3>
        {activityFeed.length > 0 && (
          <button 
            onClick={() => useAIStore.getState().clearFeed()}
            className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence initial={false}>
          {activityFeed.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No recent activity...</p>
          ) : (
            activityFeed.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
              >
                <div className={`mt-0.5 size-1.5 rounded-full shrink-0 ${
                  event.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                  event.status === 'warning' ? 'bg-amber-500' :
                  event.status === 'pending' ? 'bg-primary animate-pulse' : 'bg-slate-400'
                }`} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-tight">
                    {event.message}
                  </p>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityStream;
