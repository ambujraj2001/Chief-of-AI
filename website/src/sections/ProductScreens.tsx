import { motion } from "framer-motion";

const screens = [
  {
    title: "Intelligent Chat Interface",
    tag: "Core Experience",
    img: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=1200",
    desc: "A powerful text-first interface that handles everything from simple queries to building complex applications.",
  },
  {
    title: "AI Generated Apps Dashboard",
    tag: "Productivity",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    desc: "Manage all your custom-built AI micro-apps in one central place. Clean, fast, and responsive.",
  },
  {
    title: "Routines & Automations",
    tag: "Automation",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
    desc: "Set and forget tasks with AI routines. Get automated reports, briefings, and data updates.",
  },
  {
    title: "Knowledge & File Center",
    tag: "Digital Brain",
    img: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=1200",
    desc: "A deeply organized system for your tasks, files, and project memory. Everything indexed for the AI.",
  },
];

const ProductScreens = () => {
  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 px-4">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Experience the future of work
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg cursor-default">
            Take a look inside the workspace designed for high-performance
            individuals and teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {screens.map((screen, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 group-hover:shadow-2xl transition-all duration-500">
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-8">
                  <img
                    src={screen.img}
                    alt={screen.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
                      {screen.tag}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                    {screen.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {screen.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductScreens;
