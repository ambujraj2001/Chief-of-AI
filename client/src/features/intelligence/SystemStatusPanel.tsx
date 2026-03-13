import React from 'react';

const SystemStatusPanel: React.FC = () => {
  const stats = [
    { label: 'Memory Engine', status: 'Synced', color: 'text-emerald-500' },
    { label: 'Knowledge Base', status: '100% Index', color: 'text-emerald-500' },
    { label: 'Tools Connected', status: '14 Active', color: 'text-primary' },
    { label: 'System Latency', status: '8ms', color: 'text-slate-400' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        System Status
      </h3>
      
      <div className="space-y-2">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
            <span className={`text-[11px] font-bold ${stat.color}`}>{stat.status}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-2 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/10">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">AI Nexus Secured</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
          Intelligence throughput is optimal. All safety protocols active.
        </p>
      </div>
    </div>
  );
};

export default SystemStatusPanel;
