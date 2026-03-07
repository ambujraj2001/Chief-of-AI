import { Play, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-float">
            <Sparkles className="w-4 h-4" />
            <span>Introducing Your AI Workspace </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 max-w-4xl mx-auto tracking-tight">
            Your AI Workspace That{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Thinks, Builds, and Automates
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Chief of AI is a chat-first AI workspace powered by traditional
            email and password login. No complex access codes or separate
            authenticators required—just sign in and start building.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="https://chief-of-ai.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
            >
              Start Using Chief of AI
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <button className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl text-lg font-bold border border-gray-200 transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-gray-900" />
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Product UI Mockups */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white p-2">
            <div className="rounded-xl overflow-hidden aspect-video bg-gray-50 flex items-center justify-center relative group">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2000"
                alt="Chief of AI Interface"
                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent" />

              {/* Floating Chat Bubble Mock */}
              <div className="absolute bottom-8 left-8 right-8 flex flex-col items-start gap-4 max-w-sm">
                <div className="bg-white/90 backdrop-blur p-4 rounded-2xl rounded-bl-none shadow-xl border border-white/40 animate-float">
                  <p className="text-sm font-medium text-gray-800">
                    "Create a habit tracker app for me."
                  </p>
                </div>
                <div
                  className="self-end bg-primary/95 backdrop-blur p-4 rounded-2xl rounded-br-none shadow-xl border border-primary/20 animate-float"
                  style={{ animationDelay: "1s" }}
                >
                  <p className="text-sm font-medium text-white">
                    "Sure! I've built your habit tracker. You can now add daily
                    goals..."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle decoration */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
