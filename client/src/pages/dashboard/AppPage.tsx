import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../../store";
import { message, Spin, Modal } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  apiGetApp,
  apiGetAppData,
  apiGetAppChats,
  apiAppChat,
  type AppEntry,
} from "../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UIMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

interface ClarificationData {
  type: "clarification";
  question: string;
  options: string[];
}

// ─── Schema-driven UI renderer ───────────────────────────────────────────────

const AppSchemaRenderer: React.FC<{
  schema: AppEntry["schema"];
  appData: Record<string, unknown>;
}> = ({ schema, appData }) => {
  const layout = schema?.layout;
  if (!Array.isArray(layout) || layout.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No UI components defined for this app.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {layout.map((item, idx) => {
        const componentName = item.component;
        const dataKey = componentName.replace(/_/g, " ");
        const matchedKey = Object.keys(appData).find(
          (k) =>
            k === componentName ||
            k === dataKey ||
            k.replace(/_/g, " ") === dataKey,
        );
        const value = matchedKey ? appData[matchedKey] : undefined;

        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-sm"
          >
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">
                {getComponentIcon(componentName)}
              </span>
              {formatComponentName(componentName)}
            </h3>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              {renderDataValue(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function getComponentIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("member") || lower.includes("user")) return "group";
  if (lower.includes("balance") || lower.includes("summary"))
    return "account_balance_wallet";
  if (lower.includes("expense")) return "receipt_long";
  if (lower.includes("form") || lower.includes("add")) return "add_circle";
  if (lower.includes("task")) return "task_alt";
  if (lower.includes("list")) return "list";
  if (lower.includes("chart") || lower.includes("graph")) return "bar_chart";
  return "widgets";
}

function formatComponentName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderDataValue(value: unknown): React.ReactNode {
  if (value === undefined || value === null) {
    return (
      <span className="text-slate-400 italic text-xs">No data yet</span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="text-slate-400 italic text-xs">Empty</span>
      );
    }
    if (typeof value[0] === "string" || typeof value[0] === "number") {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span
              key={i}
              className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
            >
              {String(v)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div
            key={i}
            className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-lg text-xs space-y-1"
          >
            {typeof item === "object" && item !== null
              ? Object.entries(item).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 min-w-[80px]">
                      {k}:
                    </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
                    </span>
                  </div>
                ))
              : String(item)}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-1 text-xs">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400 min-w-[80px]">
              {k}:
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              {String(v ?? "")}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

// ─── App Chat Message Components ─────────────────────────────────────────────

const AppAiMessage: React.FC<{
  content: string;
  onOptionSelect?: (option: string) => void;
}> = ({ content, onOptionSelect }) => {
  const processed = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.type === "clarification") {
        return { kind: "clarification" as const, data: parsed as ClarificationData };
      }
      if (parsed?.message) {
        return { kind: "text" as const, text: parsed.message };
      }
    } catch {
      // not JSON
    }
    return { kind: "text" as const, text: content };
  }, [content]);

  return (
    <div className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
        <span className="material-symbols-outlined text-white text-base">
          smart_toy
        </span>
      </div>
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none text-sm">
          {processed.kind === "clarification" ? (
            <div className="flex flex-col gap-2.5">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {processed.data.question}
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {processed.data.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOptionSelect?.(option)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors text-slate-700 dark:text-slate-300 hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {processed.text}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

const AppUserMessage: React.FC<{ content: string }> = ({ content }) => (
  <div className="flex gap-3 justify-end group animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="flex flex-col gap-1 max-w-[85%] items-end">
      <div className="p-3 rounded-xl bg-primary text-white leading-relaxed shadow-sm prose prose-invert max-w-none text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  </div>
);

// ─── Main AppPage ────────────────────────────────────────────────────────────

const AppPage = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const accessCode = useMemo(
    () => user.accessCode || localStorage.getItem("accessCode") || "",
    [user.accessCode],
  );

  const [app, setApp] = useState<AppEntry | null>(null);
  const [appData, setAppData] = useState<Record<string, unknown>>({});
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load app context on mount
  useEffect(() => {
    if (!appId || !accessCode) return;

    const loadApp = async () => {
      try {
        setLoading(true);
        const [appRes, dataRes, chatsRes] = await Promise.all([
          apiGetApp(appId, accessCode),
          apiGetAppData(appId, accessCode),
          apiGetAppChats(appId, accessCode),
        ]);

        setApp(appRes.app);

        const dataMap: Record<string, unknown> = {};
        for (const entry of dataRes.data) {
          dataMap[entry.key] = entry.value;
        }
        setAppData(dataMap);

        const chatMessages: UIMessage[] = chatsRes.chats.map((c) => ({
          id: c.id,
          role: c.role,
          content: c.message,
        }));

        if (chatMessages.length === 0) {
          chatMessages.push({
            id: "welcome",
            role: "ai",
            content: `Welcome to **${appRes.app.name}**! I'm your AI assistant for this app. Ask me anything or tell me what you'd like to do.`,
          });
        }

        setMessages(chatMessages);
      } catch (err) {
        console.error("Failed to load app:", err);
        message.error("Failed to load app. You may not have access.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [appId, accessCode, navigate]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || !appId) return;

    const userMsg: UIMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const result = await apiAppChat(appId, content, accessCode);

      const aiReply: UIMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: result.reply,
      };
      setMessages((prev) => [...prev, aiReply]);

      // If the AI updated data, refresh app data
      if (result.dataUpdates?.length) {
        setAppData((prev) => {
          const next = { ...prev };
          for (const u of result.dataUpdates!) {
            next[u.key] = u.value;
          }
          return next;
        });
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to get response";
      message.error(errMsg);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, appId, accessCode]);

  const handleOptionSelect = useCallback(
    (option: string) => {
      setInputValue(option);
      setTimeout(() => {
        setInputValue("");
        const userMsg: UIMessage = {
          id: Date.now().toString(),
          role: "user",
          content: option,
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        apiAppChat(appId!, option, accessCode)
          .then((result) => {
            const aiReply: UIMessage = {
              id: (Date.now() + 1).toString(),
              role: "ai",
              content: result.reply,
            };
            setMessages((prev) => [...prev, aiReply]);

            if (result.dataUpdates?.length) {
              setAppData((prev) => {
                const next = { ...prev };
                for (const u of result.dataUpdates!) {
                  next[u.key] = u.value;
                }
                return next;
              });
            }
          })
          .catch((err: unknown) => {
            const errMsg =
              err instanceof Error ? err.message : "Failed to get response";
            message.error(errMsg);
          })
          .finally(() => setIsTyping(false));
      }, 0);
    },
    [appId, accessCode],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Spin size="large" />
        <p className="text-sm font-medium">Loading app...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <span className="material-symbols-outlined text-4xl">error</span>
        <p className="text-sm font-medium">App not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-background-dark">
      {/* App Header */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/apps")}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-500 text-lg">
              arrow_back
            </span>
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">
                apps
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">
                {app.name}
              </h1>
              {app.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  {app.description}
                </p>
              )}
            </div>
          </div>
          {app.join_code && (
            <button
              onClick={() => setShareOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-base">
                share
              </span>
              Share
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content: App UI + Chat */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
        <div className="max-w-4xl mx-auto w-full">
          {/* App UI from Schema */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
            <AppSchemaRenderer schema={app.schema} appData={appData} />
          </div>

          {/* Chat Messages */}
          <div className="px-4 sm:px-6 py-4 space-y-6">
            {messages.map((msg) =>
              msg.role === "ai" ? (
                <AppAiMessage
                  key={msg.id}
                  content={msg.content}
                  onOptionSelect={handleOptionSelect}
                />
              ) : (
                <AppUserMessage key={msg.id} content={msg.content} />
              ),
            )}
            {isTyping && (
              <div className="flex gap-3 animate-in fade-in">
                <div className="size-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-base animate-pulse">
                    smart_toy
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="size-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="size-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="size-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <footer className="shrink-0 p-4 sm:p-6 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-start bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${app.name}...`}
              rows={1}
              className="w-full bg-transparent border-none rounded-xl py-3.5 pl-4 pr-14 text-sm placeholder-slate-500 resize-none outline-none"
              style={{ maxHeight: "120px" }}
            />
            <div className="absolute right-2 inset-y-0 flex items-center">
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="size-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send (Enter)"
              >
                <span className="material-symbols-outlined text-lg translate-x-[1px]">
                  send
                </span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Share Modal */}
      {app.join_code && (
        <Modal
          open={shareOpen}
          onCancel={() => setShareOpen(false)}
          footer={null}
          centered
          width={400}
          closable
        >
          <div className="flex flex-col items-center gap-5 py-3">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">
                share
              </span>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Share "{app.name}"
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Share this code with others so they can join your app.
              </p>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">
                Invite Code
              </p>
              <p className="text-3xl font-black font-mono text-center text-slate-800 dark:text-white tracking-[0.2em]">
                {app.join_code}
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(app.join_code!);
                message.success("Join code copied to clipboard!");
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">
                content_copy
              </span>
              Copy Code
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AppPage;
