import { motion } from "framer-motion";
import {
  MessageSquare,
  Layers,
  Zap,
  CheckSquare,
  Brain,
  FileSearch,
  Users,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Chat-First Assistant",
    description: "Interact through natural conversation. Ask questions, run tools, manage tasks — all from one chat.",
  },
  {
    icon: Layers,
    title: "AI Generated Apps",
    description: "Create apps by typing prompts. Habit trackers, project planners, expense splitters — built instantly.",
  },
  {
    icon: Zap,
    title: "AI Routines",
    description: "Automate workflows on a schedule. Daily briefings, price alerts, news digests — hands-free.",
  },
  {
    icon: CheckSquare,
    title: "Tasks & Reminders",
    description: "Create tasks, set deadlines, and schedule reminders through chat or the task interface.",
  },
  {
    icon: Brain,
    title: "Knowledge & Memory",
    description: "Store notes, documents, and knowledge. The AI remembers and retrieves when you need it.",
  },
  {
    icon: FileSearch,
    title: "File Intelligence",
    description: "Upload files and interact with AI. Summarize, extract info, and ask questions about documents.",
  },
  {
    icon: Users,
    title: "Collaborative Apps",
    description: "Share apps with others using join codes. Collaborate on shared data with private chat.",
  },
  {
    icon: Globe,
    title: "Web Search",
    description: "Search the web directly through the assistant. Get real-time information without leaving your workspace.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Features = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Everything in <span className="text-gradient">one place</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop switching between tools. Chief of AI brings chat, apps, automation, and knowledge into a single intelligent workspace.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="p-6 rounded-xl border border-border bg-card/50 card-hover"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
