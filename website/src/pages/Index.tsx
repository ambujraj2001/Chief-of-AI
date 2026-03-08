import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatDemo from "@/components/ChatDemo";
import BuildApps from "@/components/BuildApps";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <ChatDemo />
      <BuildApps />
      <HowItWorks />
      <UseCases />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
