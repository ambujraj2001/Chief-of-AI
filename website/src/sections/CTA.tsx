import { Sparkles, ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="bg-background-dark rounded-[40px] p-8 md:p-20 text-center relative overflow-hidden group">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Ready to build your{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AI Workspace?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Create apps, automate tasks, and manage everything through one
              intelligent assistant. Join thousands of users today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://chief-of-ai.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                Start Using Chief of AI
                <ArrowRight className="w-6 h-6" />
              </a>
              <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-2xl text-lg font-bold border border-white/10 transition-all flex items-center justify-center gap-2">
                Talk to Sales
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 font-medium">
              <Sparkles className="w-5 h-5 text-accent" />
              <span>No credit card required to start</span>
            </div>
          </div>

          {/* Background shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
      </div>
    </section>
  );
};

export default CTA;
