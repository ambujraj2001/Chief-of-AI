import { useState, useEffect } from "react";
import { Menu, X, Bot } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-lg shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Chief of AI
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            How it Works
          </a>
          <a
            href="#use-cases"
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            Use Cases
          </a>
          <a
            href="#"
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            Docs
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors">
            Login
          </button>
          <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95">
            Get Started
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          <a
            href="#features"
            className="text-lg font-medium text-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-lg font-medium text-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            How it Works
          </a>
          <a
            href="#use-cases"
            className="text-lg font-medium text-gray-800"
            onClick={() => setMobileMenuOpen(false)}
          >
            Use Cases
          </a>
          <button className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-2">
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
