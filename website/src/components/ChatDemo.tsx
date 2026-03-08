import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Brain, Search, CheckCircle2, Sparkles, Loader2, ChevronDown, User, Bot } from "lucide-react";

interface ReasoningStep {
  icon: typeof Brain;
  text: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: ReasoningStep[];
}

const conversation: ChatMessage[] = [
  {
    role: "user",
    content: "I need to plan a trip to Tokyo next month. Can you help me organize everything?",
  },
  {
    role: "assistant",
    content:
      "I've created a complete Tokyo trip plan for you! Here's what I've set up:\n\n🗓️ **Trip Planner App** — Created with day-by-day itinerary\n📋 **12 Tasks** — Visa check, flights, hotels, pocket WiFi, JR Pass, etc.\n⏰ **3 Reminders** — Passport renewal, booking deadline, packing day\n📝 **Saved to Memory** — Your travel preferences and dates\n\nWant me to research flights and hotel deals now?",
    reasoning: [
      { icon: Brain, text: "Understanding request: multi-step trip planning with tasks, reminders, and knowledge storage" },
      { icon: Search, text: "Checking memory for previous travel preferences and passport status" },
      { icon: Sparkles, text: "Generating trip planner app with customizable itinerary template" },
      { icon: CheckCircle2, text: "Creating tasks with deadlines and setting calendar reminders" },
    ],
  },
  {
    role: "user",
    content: "Yes! Find me flights under $800 and hotels near Shibuya station.",
  },
  {
    role: "assistant",
    content:
      "Done! I found 3 great options:\n\n✈️ **Flights** (Round-trip, under $800):\n• ANA — $745, direct, 13h\n• JAL — $780, direct, 13.5h\n• United — $690, 1 stop, 16h\n\n🏨 **Hotels near Shibuya** (per night):\n• Shibuya Stream Hotel — $120, 4.6★, 2min walk\n• Cerulean Tower — $155, 4.8★, 5min walk\n• Sequence Miyashita Park — $95, 4.4★, 3min walk\n\nI've added these to your trip planner. Want me to set a price alert routine for the ANA flight?",
    reasoning: [
      { icon: Search, text: "Searching web for round-trip flights to Tokyo under $800" },
      { icon: Search, text: "Searching for hotels within 500m of Shibuya Station with high ratings" },
      { icon: Brain, text: "Ranking results by price, rating, and distance to match preferences" },
      { icon: CheckCircle2, text: "Updating trip planner app with flight and hotel options" },
    ],
  },
];

const TypingText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayed("");
    setDone(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse-glow align-text-bottom" />}
    </span>
  );
};

const ReasoningBlock = ({
  steps,
  onComplete,
}: {
  steps: ReasoningStep[];
  onComplete: () => void;
}) => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (visibleSteps < steps.length) {
      const timer = setTimeout(() => setVisibleSteps((v) => v + 1), 700);
      return () => clearTimeout(timer);
    }

    if (completed) return;

    const timer = setTimeout(() => {
      setCollapsed(true);
      setCompleted(true);
      onCompleteRef.current?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [visibleSteps, steps.length, completed]);

  return (
    <motion.div
      className="mb-3 rounded-lg border border-primary/20 bg-primary/5 overflow-hidden"
      layout
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-primary"
      >
        {visibleSteps < steps.length ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        <span>
          {visibleSteps < steps.length
            ? "Reasoning..."
            : `Thought for ${steps.length} steps`}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${
            collapsed ? "" : "rotate-180"
          }`}
        />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pb-3"
          >
            <div className="space-y-2 border-l-2 border-primary/20 pl-3">
              {steps.slice(0, visibleSteps).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-2"
                >
                  <step.icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {step.text}
                  </span>
                </motion.div>
              ))}
              {visibleSteps < steps.length && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [typingDone, setTypingDone] = useState<Record<number, boolean>>({});
  const [reasoningDone, setReasoningDone] = useState<Record<number, boolean>>({});
  const [autoScroll, setAutoScroll] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (isInView && !started) {
      setStarted(true);
      setVisibleMessages(1);
    }
  }, [isInView, started]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 24;
      setAutoScroll(nearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Advance to next message when current one is done
  useEffect(() => {
    if (visibleMessages === 0) return;
    const currentIdx = visibleMessages - 1;
    const msg = conversation[currentIdx];

    if (msg.role === "user" && typingDone[currentIdx] && visibleMessages < conversation.length) {
      const timer = setTimeout(() => setVisibleMessages((v) => v + 1), 600);
      return () => clearTimeout(timer);
    }

    if (msg.role === "assistant") {
      if (msg.reasoning && !reasoningDone[currentIdx]) return;
      if (typingDone[currentIdx] && visibleMessages < conversation.length) {
        const timer = setTimeout(() => setVisibleMessages((v) => v + 1), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [visibleMessages, typingDone, reasoningDone]);

  useEffect(() => {
    if (!autoScroll) return;
    const container = chatContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "auto",
    });
  }, [visibleMessages, typingDone, reasoningDone, autoScroll]);

  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const boldParsed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
      return (
        <span key={i}>
          {i > 0 && <br />}
          <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
        </span>
      );
    });
  };

  return (
    <section ref={sectionRef} className="py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Watch it <span className="text-gradient">think</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chief of AI doesn't just answer — it reasons, plans, and executes multi-step workflows in real time.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden glow-border">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-secondary/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-muted-foreground font-medium">Chief of AI</span>
              </div>
            </div>

            {/* Chat area */}
            <div
              ref={chatContainerRef}
              className="p-5 space-y-5 max-h-[520px] overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {conversation.slice(0, visibleMessages).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  layout={false}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.role === "assistant" && msg.reasoning && (
                      <ReasoningBlock
                        steps={msg.reasoning}
                        onComplete={() =>
                          setReasoningDone((prev) => ({ ...prev, [idx]: true }))
                        }
                      />
                    )}

                    {(msg.role === "user" || !msg.reasoning || reasoningDone[idx]) && (
                      <div
                        className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary/15 border border-primary/20 text-foreground"
                            : "bg-secondary/60 border border-border text-secondary-foreground"
                        }`}
                      >
                        {!typingDone[idx] ? (
                          <TypingText
                            text={msg.content}
                            onComplete={() =>
                              setTypingDone((prev) => ({ ...prev, [idx]: true }))
                            }
                          />
                        ) : (
                          formatContent(msg.content)
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator for next message */}
              {visibleMessages > 0 &&
                visibleMessages < conversation.length &&
                typingDone[visibleMessages - 1] &&
                (conversation[visibleMessages - 1].role === "user" ||
                  reasoningDone[visibleMessages - 1]) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 items-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex gap-1.5 px-4 py-3 rounded-xl bg-secondary/60 border border-border">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse-glow" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
                    </div>
                  </motion.div>
                )}
            </div>

            {/* Input bar */}
            <div className="px-5 py-4 border-t border-border">
              <div className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-3 border border-border">
                <span className="text-sm text-muted-foreground flex-1">Ask Chief anything...</span>
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatDemo;
