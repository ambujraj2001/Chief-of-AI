import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Bell,
  FolderKanban,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Zap,
  Users,
  Brain,
  Sparkles,
  Code2,
  Database,
  Layout,
  Palette,
} from "lucide-react";

const useCases = [
  {
    icon: DollarSign,
    title: "Expense Tracking",
    tagline: "Split bills and track spending with AI.",
    description:
      "Chief of AI keeps a running ledger of every expense you mention in chat. It can split costs between friends, categorise spending, and send reminders for outstanding balances — all without leaving the conversation.",
    features: [
      "Auto-categorise expenses from natural language",
      "Split bills across group members instantly",
      "Monthly spending summaries on demand",
      "Currency conversion built-in",
    ],
  },
  {
    icon: Bell,
    title: "Daily Briefings",
    tagline: "Automated news and updates every morning.",
    description:
      "Wake up to a personalised briefing delivered right to your chat. Chief of AI aggregates news, calendar events, weather, and task reminders into a single, digestible morning update.",
    features: [
      "Customisable topics and sources",
      "Calendar and task integration",
      "Weather and commute updates",
      "Scheduled delivery at your preferred time",
    ],
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    tagline: "Tasks, deadlines, and progress — managed by AI.",
    description:
      "Tell Chief of AI about your project and it creates tasks, assigns priorities, tracks deadlines, and gives you status updates. It's like having a project manager that never sleeps.",
    features: [
      "Create tasks from natural conversation",
      "Automatic priority and deadline suggestions",
      "Progress tracking and nudges",
      "Team task delegation via group chat",
    ],
  },
  {
    icon: BookOpen,
    title: "Knowledge Assistant",
    tagline: "Store, search, and retrieve information instantly.",
    description:
      "Save articles, notes, links, and ideas in chat. Chief of AI indexes everything and lets you search your personal knowledge base with simple questions — no folders or tags required.",
    features: [
      "Save anything by sending it in chat",
      "Semantic search across all saved items",
      "Auto-generated summaries and tags",
      "Quick retrieval with natural questions",
    ],
  },
  {
    icon: Users,
    title: "Team Coordination",
    tagline: "Keep your team aligned without the meetings.",
    description:
      "Chief of AI facilitates async stand-ups, collects status updates, and surfaces blockers — so your team stays in sync without scheduling another meeting.",
    features: [
      "Automated daily stand-up prompts",
      "Blocker detection and escalation",
      "Shared team dashboards",
      "Meeting summary generation",
    ],
  },
  {
    icon: Brain,
    title: "Personal CRM",
    tagline: "Never forget a conversation or commitment.",
    description:
      "Mention a contact and Chief of AI remembers context — past conversations, commitments, birthdays, and follow-ups. Build deeper relationships effortlessly.",
    features: [
      "Auto-link mentions to contact profiles",
      "Follow-up reminders",
      "Relationship timeline view",
      "Birthday and milestone alerts",
    ],
  },
];

const UseCasesPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
            <Bot className="w-6 h-6 text-primary" />
            Chief of AI
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 text-sm text-muted-foreground mb-6">
              <Zap className="w-4 h-4 text-accent" />
              What can you build?
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Explore what's{" "}
              <span className="text-gradient">possible</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From building apps with a prompt to automating daily workflows —
              see everything Chief of AI can do for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* App Builder Section — now first */}
      <section className="pb-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 text-sm text-muted-foreground mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              App Builder
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              From idea to app in{" "}
              <span className="text-gradient">one prompt</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Describe what you want and Chief of AI scaffolds the entire application —
              UI, data models, and business logic — ready to use immediately.
            </p>
          </motion.div>

          {/* How it works steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { step: "01", icon: Sparkles, title: "Describe your app", desc: "Tell Chief of AI what you want to build in plain language." },
              { step: "02", icon: Code2, title: "AI generates everything", desc: "UI components, data models, and logic are created instantly." },
              { step: "03", icon: Palette, title: "Customise & ship", desc: "Tweak the design, add features, and deploy — all from chat." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="relative p-8 rounded-2xl border border-border bg-card/50 text-center group card-hover"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <span className="absolute top-4 right-4 text-xs font-mono text-muted-foreground/40">{s.step}</span>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Example apps grid */}
          <motion.div className="text-center mb-10" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h3 className="text-2xl font-bold mb-2">Apps people have built</h3>
            <p className="text-muted-foreground text-sm">All created with a single prompt</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { letter: "S", name: "Splitwise Clone", desc: "Bill splitting" },
              { letter: "H", name: "Habit Tracker", desc: "Daily routines" },
              { letter: "P", name: "Project Planner", desc: "Task boards" },
              { letter: "E", name: "Expense Logger", desc: "Budget tracking" },
              { letter: "C", name: "CRM Lite", desc: "Contact management" },
              { letter: "N", name: "Note Garden", desc: "Knowledge base" },
              { letter: "F", name: "Fitness Log", desc: "Workout tracking" },
              { letter: "I", name: "Invoice Maker", desc: "Billing & invoices" },
            ].map((app, i) => (
              <motion.div
                key={app.name}
                className="group flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card/50 card-hover cursor-pointer relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                whileHover={{ y: -3 }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/5 to-transparent" />
                <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 relative z-10 group-hover:bg-accent/25 transition-colors">
                  <span className="text-sm font-bold text-accent">{app.letter}</span>
                </div>
                <div className="relative z-10 min-w-0">
                  <span className="font-semibold block truncate">{app.name}</span>
                  <span className="text-xs text-muted-foreground">{app.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflows Section (formerly Use Cases) */}
      <section className="pb-32">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Powerful <span className="text-gradient">workflows</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Automate the tasks you do every day — right from the conversation.
            </p>
          </motion.div>

          <div className="space-y-16">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-6">
                    <uc.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">{uc.title}</h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{uc.description}</p>
                  <ul className="space-y-3">
                    {uc.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="rounded-2xl border border-border bg-card/50 p-10 flex flex-col items-center justify-center min-h-[280px]">
                    <uc.icon className="w-16 h-16 text-accent/30 mb-4" />
                    <p className="text-lg font-semibold text-center">{uc.tagline}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="pb-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Try Chief of AI and turn your conversations into real productivity.
            </p>
            <a
              href="https://chief-of-ai.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:scale-105"
            >
              Try it Free
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default UseCasesPage;
