import { Bot, Twitter, Github, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Bot className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Chief of AI
              </span>
            </div>
            <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
              The premier AI-powered digital workspace for intelligent task
              management, app generation, and workflow automation.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">
              Product
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  AI Apps
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Routines
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">
              Resources
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Guides
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Community
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 uppercase text-xs tracking-widest">
              Company
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-primary transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-gray-100 flex flex-col md:row items-center justify-between gap-6">
          <p className="text-gray-400 text-sm">
            © 2026 Chief of AI. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <p className="text-gray-400 text-sm cursor-pointer hover:text-primary">
              Status: Operational
            </p>
            <p className="text-gray-400 text-sm cursor-pointer hover:text-primary">
              Cloud Region: US-East
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
