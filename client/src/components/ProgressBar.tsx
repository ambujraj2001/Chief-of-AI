interface ProgressBarProps {
  step: number;
  totalSteps: number;
  label: string;
}

const ProgressBar = ({ step, totalSteps, label }: ProgressBarProps) => {
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div className="flex flex-col gap-3 mb-8">
      <div className="flex gap-6 justify-between items-end">
        <div className="flex flex-col">
          <span className="text-primary text-xs font-bold uppercase tracking-wider">{label}</span>
          <h3 className="text-slate-900 dark:text-slate-100 text-sm font-semibold">
            Step {step} of {totalSteps}
          </h3>
        </div>
        <p className="text-primary text-sm font-bold">{pct}%</p>
      </div>
      <div className="h-2 w-full rounded-full bg-primary/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
