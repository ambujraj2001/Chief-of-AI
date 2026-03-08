import { motion } from "framer-motion";
import { MessageSquare, Wand2, Bot, LayoutDashboard } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Start chatting",
    description: "Open the workspace and start a conversation with your AI assistant.",
  },
  {
    icon: Wand2,
    step: "02",
    title: "Ask anything",
    description: "Request a task, build an app, or set up an automation through natural language.",
  },
  {
    icon: Bot,
    step: "03",
    title: "AI delivers",
    description: "The assistant generates results, runs tools, or creates applications instantly.",
  },
  {
    icon: LayoutDashboard,
    step: "04",
    title: "Manage & iterate",
    description: "Continue chatting to refine, automate, and manage your entire workspace.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How it <span className="text-gradient">works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            From first message to full workspace — in minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="text-center relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="w-24 h-24 mx-auto rounded-2xl border border-border bg-card flex items-center justify-center mb-6 glow-border">
                <s.icon className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-2 block">
                Step {s.step}
              </span>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
