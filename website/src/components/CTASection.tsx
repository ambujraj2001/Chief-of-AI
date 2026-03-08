import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTA_URL = "https://chief-of-ai.vercel.app/";

const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-6xl font-bold mb-6">
            Ready to meet your{" "}
            <span className="text-gradient">AI Chief?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Stop juggling tools. Start chatting with an assistant that does it all.
          </p>
          <a
            href={CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-10 py-5 rounded-lg bg-primary text-primary-foreground font-semibold text-lg glow-primary transition-all duration-300 hover:scale-105"
          >
            Get Started — It's Free
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
