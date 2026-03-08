import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, ArrowRight } from "lucide-react";

const CTA_URL = "https://chief-of-ai.vercel.app/";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b border-border" : ""
      }`}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-heading font-bold text-lg">
          <Bot className="w-6 h-6 text-primary" />
          Chief of AI
        </a>

        <div className="hidden sm:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <Link to="/use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Explore
          </Link>
          <a
            href={CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:scale-105"
          >
            Try it <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
