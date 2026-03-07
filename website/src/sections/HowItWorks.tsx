const steps = [
  {
    number: "01",
    title: "Chat with the assistant",
    desc: "Simply tell the AI what you need. From 'Create a Splitwise app' to 'Find the best tech stocks right now'.",
    example: "Create a habit tracker for me",
  },
  {
    number: "02",
    title: "AI generates the app",
    desc: "Chief of AI builds the entire interface, database, and logic on the fly based on your prompt.",
    example: "System: App generated successfully!",
  },
  {
    number: "03",
    title: "Full control via chat",
    desc: "Update your apps, add entries, or change logic just by talking to the assistant.",
    example: "Add 20 mins of yoga to my tracker",
  },
  {
    number: "04",
    title: "Automatic updates",
    desc: "The AI automatically handles the backend, state management, and updates across your team.",
    example: "Progress synced for all members",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-background-dark text-white relative overflow-hidden"
    >
      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
              One prompt to <span className="text-primary italic">launch</span>.{" "}
              <br /> One chat to <span className="text-accent">manage</span>.
            </h2>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="group flex gap-6 p-6 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-default"
                >
                  <div className="text-3xl font-black text-white/20 group-hover:text-primary transition-colors shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                      {step.desc}
                    </p>
                    <div className="mt-4 inline-flex px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-primary/80">
                      {step.example}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 relative">
            <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl">
              <div className="rounded-xl overflow-hidden bg-gray-900 border border-white/10">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <div className="ml-2 px-3 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400 uppercase tracking-widest">
                    Assistant Console
                  </div>
                </div>
                <div className="p-8 font-mono text-sm space-y-4">
                  <div className="text-gray-400">
                    User: Create a budget app for my trip to Japan
                  </div>
                  <div className="text-primary animate-pulse">
                    Assistant: Analyzing requirements...
                  </div>
                  <div className="text-accent">✓ Database schema created</div>
                  <div className="text-accent">✓ UI components generated</div>
                  <div className="text-indigo-400">
                    Assistant: Your "Japan Trip Budget" app is ready! I've added
                    Categories for Travel, Food, and Stay. How would you like to
                    proceed?
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Background Card */}
            <div className="absolute -top-6 -right-6 w-full h-full bg-white/5 rounded-2xl -z-10 translate-x-3 translate-y-3" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
