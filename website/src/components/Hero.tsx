import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA_URL = "https://get-nexora.vercel.app/";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-[100px] animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[120px] animate-float" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/50 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Your AI-powered workspace</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          One chat.{" "}
          <span className="text-gradient">Every tool.</span>
          <br />
          Infinite possibilities.
        </motion.h1>

        <motion.p
          className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Nexora is a chat-first workspace where you manage tasks, build apps,
          automate workflows, and organize knowledge — all through one intelligent assistant.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
        >
          <a
            href={CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold text-lg glow-primary transition-all duration-300 hover:scale-105"
          >
            Try Nexora
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border border-border text-foreground font-medium transition-all duration-300 hover:border-primary/40 hover:bg-secondary/50"
          >
            Learn more
          </a>
        </motion.div>

        {/* Chat mockup */}
        {/* Animated badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {["Tasks", "Apps", "Routines", "Memory", "Files", "Search"].map((label, i) => (
            <motion.span
              key={label}
              className="px-4 py-1.5 rounded-full border border-border bg-secondary/40 text-xs text-muted-foreground font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.7 + i * 0.08 }}
              whileHover={{ borderColor: "hsl(175 80% 50% / 0.4)", scale: 1.05 }}
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
