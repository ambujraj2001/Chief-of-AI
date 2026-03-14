import {
  DatePicker,
  Pagination,
  ConfigProvider,
  theme,
  Spin,
  Empty,
} from "antd";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetChatHistory, type ChatMessage } from "../../../services/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;

interface Conversation {
  id: string;
  lastMessage: string;
  firstMessage: string;
  timestamp: string;
  messageCount: number;
}

const RecentChatsPage = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<"7d" | "30d" | "custom">("7d");
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [customDates, setCustomDates] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const hasFetched = useRef(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [range, customDates]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const accessCode = localStorage.getItem("accessCode") || "";
        const response = await apiGetChatHistory(accessCode);
        setAllMessages(response.messages);
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const conversations = useMemo(() => {
    // 1. Sort all messages once
    const sorted = [...allMessages].sort(
      (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    );

    // 2. Filter based on range
    let filtered = sorted;
    if (range === "7d") {
      const cutOff = dayjs().subtract(7, "days").startOf("day");
      filtered = sorted.filter((m) => dayjs(m.created_at).isAfter(cutOff));
    } else if (range === "30d") {
      const cutOff = dayjs().subtract(30, "days").startOf("day");
      filtered = sorted.filter((m) => dayjs(m.created_at).isAfter(cutOff));
    } else if (range === "custom" && customDates) {
      filtered = sorted.filter((m) => {
        const d = dayjs(m.created_at);
        return (
          d.isAfter(customDates[0].startOf("day")) &&
          d.isBefore(customDates[1].endOf("day"))
        );
      });
    }

    // 3. Group messages
    const groups: Record<string, ChatMessage[]> = {};
    let currentVirtualCid = "initial";
    let lastMessageTime = 0;

    filtered.forEach((msg) => {
      const cid = msg.conversation_id;
      const msgTime = dayjs(msg.created_at).unix();

      if (!cid) {
        if (lastMessageTime !== 0 && msgTime - lastMessageTime > 300) {
          currentVirtualCid = `v-${msgTime}`;
        }
        if (!groups[currentVirtualCid]) groups[currentVirtualCid] = [];
        groups[currentVirtualCid].push(msg);
      } else {
        if (!groups[cid]) groups[cid] = [];
        groups[cid].push(msg);
      }
      lastMessageTime = msgTime;
    });

    return Object.keys(groups)
      .map((cid): Conversation => {
        const msgs = groups[cid];
        const userMsgCount = msgs.filter((m) => m.role === "user").length;
        return {
          id: cid,
          firstMessage: msgs[0]?.content || "Empty Conversation",
          lastMessage: msgs[msgs.length - 1]?.content || "",
          timestamp:
            msgs[msgs.length - 1]?.created_at || new Date().toISOString(),
          messageCount: userMsgCount,
        };
      })
      .sort((a, b) => dayjs(b.timestamp).unix() - dayjs(a.timestamp).unix());
  }, [allMessages, range, customDates]);

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Title Section */}
      <div className="p-6 sm:p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Recent Chats
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Review your past conversations with your AI executive agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setRange("7d")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${range === "7d" ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setRange("30d")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${range === "30d" ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
              >
                Last 30 Days
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsRangePickerOpen(!isRangePickerOpen)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${range === "custom" ? "bg-primary text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                >
                  Custom Range{" "}
                  <span className="material-symbols-outlined text-xs">
                    calendar_month
                  </span>
                </button>
                {isRangePickerOpen && (
                  <div className="absolute top-full right-0 mt-2 z-50">
                    <ConfigProvider
                      theme={{ algorithm: theme.defaultAlgorithm }}
                    >
                      <RangePicker
                        open={true}
                        autoFocus
                        onChange={(
                          dates:
                            | [dayjs.Dayjs | null, dayjs.Dayjs | null]
                            | null,
                        ) => {
                          if (dates && dates[0] && dates[1]) {
                            setRange("custom");
                            setCustomDates([dates[0], dates[1]]);
                          }
                          setIsRangePickerOpen(false);
                        }}
                        onOpenChange={(open: boolean) => {
                          if (!open) setIsRangePickerOpen(false);
                        }}
                      />
                    </ConfigProvider>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
            <Spin size="large" />
            <p className="text-sm font-medium">
              Retrieving your intelligence logs...
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Empty
              description={
                <span className="text-slate-500">
                  No conversations found yet.
                </span>
              }
            />
          </div>
        ) : (
          conversations
            .slice((currentPage - 1) * 10, currentPage * 10)
            .map((conv: Conversation) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/dashboard/chat/${conv.id}`)}
                className="group flex items-center gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {conv.firstMessage.length > 40
                        ? conv.firstMessage.substring(0, 40) + "..."
                        : conv.firstMessage}
                    </h3>
                    <span className="text-xs font-medium text-slate-400">
                      {dayjs(conv.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                    {conv.lastMessage}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      Nexora
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {conv.messageCount} messages
                    </span>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    arrow_forward_ios
                  </span>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-background-dark/50 backdrop-blur-sm flex justify-center">
        <ConfigProvider
          theme={{ token: { colorPrimary: "#3c83f6", borderRadius: 8 } }}
        >
          <Pagination
            current={currentPage}
            onChange={(page) => setCurrentPage(page)}
            total={conversations.length}
            pageSize={10}
            showSizeChanger={false}
            itemRender={(
              _page: number,
              type: string,
              originalElement: React.ReactNode,
            ) => {
              if (type === "prev")
                return (
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                );
              if (type === "next")
                return (
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                );
              return originalElement;
            }}
          />
        </ConfigProvider>
      </div>
    </div>
  );
};

export default RecentChatsPage;
