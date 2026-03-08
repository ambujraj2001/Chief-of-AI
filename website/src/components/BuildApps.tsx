import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Code2, Database, Layout } from "lucide-react";

const apps = [
  { letter: "S", name: "Splitwise Clone", desc: "Bill splitting & expense sharing" },
  { letter: "H", name: "Habit Tracker", desc: "Daily routines & streak tracking" },
  { letter: "P", name: "Project Planner", desc: "Tasks, boards & team workflows" },
  { letter: "E", name: "Expense Logger", desc: "Budgets, categories & reports" },
];

const capabilities = [
  { icon: Layout, label: "UI Components" },
  { icon: Database, label: "Data Models" },
  { icon: Code2, label: "Business Logic" },
];

const BuildApps = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 text-sm text-muted-foreground mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Powered Builder
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Build Apps With{" "}
              <span className="text-gradient">a Prompt</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Tell the AI what you need and it creates a full application
              workspace — complete with UI, data, and logic.
            </p>

            {/* Capabilities row */}
            <div className="flex flex-wrap gap-3 mb-10">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card/40 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                >
                  <cap.icon className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{cap.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Prompt box */}
            <motion.div
              className="inline-block rounded-xl border border-primary/20 bg-card/60 px-6 py-4 glow-border backdrop-blur-sm"
              whileHover={{ scale: 1.02, borderColor: "hsl(175 80% 50% / 0.4)" }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-muted-foreground mb-1">Example prompt:</p>
              <p className="text-base font-medium text-accent flex items-center gap-2">
                "Make a Splitwise app"
                <ArrowRight className="w-4 h-4 text-primary" />
              </p>
            </motion.div>
          </motion.div>

          {/* Right side — app list */}
          <div className="space-y-4">
            {apps.map((app, i) => (
              <motion.div
                key={app.name}
                className="group flex items-center gap-5 px-6 py-5 rounded-xl border border-border bg-card/50 card-hover cursor-pointer relative overflow-hidden"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                whileHover={{ x: 8 }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/5 to-transparent" />

                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 relative z-10 group-hover:bg-accent/25 transition-colors duration-300">
                  <span className="text-sm font-bold text-accent">{app.letter}</span>
                </div>
                <div className="relative z-10">
                  <span className="font-semibold text-lg block">{app.name}</span>
                  <span className="text-sm text-muted-foreground">{app.desc}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground/30 ml-auto relative z-10 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuildApps;
