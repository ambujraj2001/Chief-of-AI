import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./sections/Hero";
import Features from "./sections/Features";
import HowItWorks from "./sections/HowItWorks";
import ProductScreens from "./sections/ProductScreens";
import UseCases from "./sections/UseCases";
import Automations from "./sections/Automations";
import CTA from "./sections/CTA";

function App() {
  return (
    <div className="min-h-screen bg-background-light selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ProductScreens />
        <UseCases />
        <Automations />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default App;
