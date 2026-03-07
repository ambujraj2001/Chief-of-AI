import { Calendar, Bell, Zap } from "lucide-react";

const routines = [
  "Daily tech news summary",
  "Crypto price tracker",
  "Local weather updates",
  "Morning productivity briefing",
  "Weekly expense report",
  "Social media sentiment",
];

const Automations = () => {
  return (
    <section className="py-24 bg-background-light relative overflow-hidden">
      {/* Visual Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-6">
        <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 md:p-16 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
                <Zap className="w-4 h-4" />
                <span>Automations</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-[1.1]">
                Automate Your Work <br /> With AI Routines
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Set up recurring AI operations that run automatically. No more
                manual searching or repetitive data entries.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {routines.map((routine, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 font-semibold text-gray-700"
                  >
                    <Calendar className="w-5 h-5 text-primary" />
                    {routine}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative z-10 p-2 bg-white rounded-3xl shadow-2xl border border-gray-200">
                <div className="bg-gray-50 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="font-bold text-gray-900">
                        Tech News Routine
                      </h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                        Status: Active
                      </p>
                    </div>
                    <Bell className="text-primary animate-bounce" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Trigger: 09:00 AM Daily
                        </p>
                        <p className="text-xs text-gray-500">
                          Scheduled via Cron Service
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Action: Search and Summarize
                        </p>
                        <p className="text-xs text-gray-500">
                          Querying for latest AI and EV trends
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Deliver: Push Notification
                        </p>
                        <p className="text-xs text-gray-500">
                          Sending to mobile and dashboard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Decorative Blur */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[100px] -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Automations;
