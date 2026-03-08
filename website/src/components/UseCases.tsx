import { motion } from "framer-motion";
import { DollarSign, Bell, FolderKanban, BookOpen } from "lucide-react";

const useCases = [
  { icon: DollarSign, title: "Expense Tracking", description: "Split bills and track spending with AI." },
  { icon: Bell, title: "Daily Briefings", description: "Automated news and updates every morning." },
  { icon: FolderKanban, title: "Project Management", description: "Tasks, deadlines, and progress — managed by AI." },
  { icon: BookOpen, title: "Knowledge Assistant", description: "Store, search, and retrieve information instantly." },
];

const UseCases = () => {
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
          <h2 className="text-4xl sm:text-5xl font-bold">
            Built for <span className="text-gradient">real work</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              className="p-8 rounded-2xl border border-border bg-card/50 card-hover text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-6">
                <uc.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-bold text-xl mb-3">{uc.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{uc.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
