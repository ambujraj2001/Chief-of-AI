import {
  DollarSign,
  Newspaper,
  ClipboardList,
  BrainCircuit,
} from "lucide-react";

const cases = [
  {
    title: "Expense Tracking",
    desc: "Build a micro-ledger for individual projects or group trips. Add expenses via natural chat and get instant reports.",
    icon: DollarSign,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    title: "Daily Briefings",
    desc: "Schedule AI routines to summarize industry news, stock market shifts, or weather alerts every morning.",
    icon: Newspaper,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    title: "Project Planning",
    desc: "Coordinate tasks and files across your small business. The AI tracks deadlines and progress automatically.",
    icon: ClipboardList,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    title: "Knowledge Assistant",
    desc: "Upload documents and let the AI index them. Ask questions about your own data and get cited answers.",
    icon: BrainCircuit,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
];

const UseCases = () => {
  return (
    <section id="use-cases" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
          <div className="md:w-1/2">
            <span className="text-primary font-bold text-sm tracking-widest uppercase mb-4 block">
              Use Cases
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
              Built for builders, creators, and teams.
            </h2>
          </div>
          <div className="md:w-1/3">
            <p className="text-gray-600 text-lg italic">
              "Chief of AI has replaced five different tools in my daily
              workflow. It's truly a single pane of glass."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cases.map((item, idx) => (
            <div key={idx} className="group cursor-default">
              <div
                className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
