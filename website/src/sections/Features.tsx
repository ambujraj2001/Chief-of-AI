import {
  MessageSquare,
  Layout,
  Zap,
  Search,
  Users,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Chat First AI",
    desc: "Interact with your workspace using natural language. It understands context, goals, and complex instructions.",
    icon: MessageSquare,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/20",
  },
  {
    title: "AI Generated Apps",
    desc: "Create fully functional micro-apps like Splitwise or habit trackers simply by asking for them.",
    icon: Layout,
    color: "bg-indigo-500",
    shadow: "shadow-indigo-500/20",
  },
  {
    title: "AI Routines",
    desc: "Automate tasks using scheduled AI. Get daily tech news, gold price updates, or morning briefings automatically.",
    icon: Zap,
    color: "bg-orange-500",
    shadow: "shadow-orange-500/20",
  },
  {
    title: "Smart Tools",
    desc: "The AI uses tools like Web Search, File Processing, and Task Management to get real work done.",
    icon: Search,
    color: "bg-green-500",
    shadow: "shadow-green-500/20",
  },
  {
    title: "Shared Workspace",
    desc: "Invite team members to your generated apps with a secure join code. Build and manage together.",
    icon: Users,
    color: "bg-purple-500",
    shadow: "shadow-purple-500/20",
  },
  {
    title: "Knowledge Memory",
    desc: "A digital brain that stores your files, conversations, and projects, making everything instantly searchable.",
    icon: Database,
    color: "bg-rose-500",
    shadow: "shadow-rose-500/20",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Everything you need for an AI-powered life
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Chief of AI isn't just a chatbot. it's an operating system for your
            digital needs, combining execution with intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -8 }}
              className="p-8 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all duration-300 group shadow-sm hover:shadow-xl hover:shadow-gray-200/50"
            >
              <div
                className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="text-white w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                {feature.desc}
              </p>

              <div className="flex items-center gap-2 text-primary font-bold text-sm cursor-pointer group-hover:gap-3 transition-all">
                Learn more
                <span className="text-lg">→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
