import React from 'react';
import { useAIStore } from '../../shared/store/aiStore';

const AgentsPanel: React.FC = () => {
  const agents = useAIStore((state) => state.activeAgents);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        AI Agents
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {agents.map((agent) => (
          <div 
            key={agent.id} 
            className={`p-2 rounded-lg border flex flex-col gap-1 transition-all ${
              agent.status === 'active' 
                ? 'bg-primary/5 border-primary/20 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-tight ${agent.status === 'active' ? 'text-primary' : 'text-slate-400'}`}>
                {agent.name}
              </span>
              {agent.status === 'active' && (
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <span className="text-[9px] text-slate-500 font-medium">
              Role: {agent.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentsPanel;
