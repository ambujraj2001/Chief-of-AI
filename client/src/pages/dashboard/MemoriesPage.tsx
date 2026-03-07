import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Spin, message } from "antd";
import { apiGetMemories, type MemoryEntry } from "../../services/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const MemoriesPage: React.FC = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const accessCode = localStorage.getItem("accessCode") || "";
        if (!accessCode) {
          message.error("Access code not found.");
          setLoading(false);
          return;
        }

        const data = await apiGetMemories(accessCode);
        setMemories(data.memories || []);
      } catch (err: unknown) {
        message.error(
          err instanceof Error ? err.message : "Failed to fetch memories",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, []);

  const getIcon = (title: string | null) => {
    const defaultIcon = "neurology";
    if (!title) return defaultIcon;
    const t = title.toLowerCase();
    if (t.includes("wifi") || t.includes("password") || t.includes("code"))
      return "vpn_key";
    if (
      t.includes("coffee") ||
      t.includes("drink") ||
      t.includes("food") ||
      t.includes("restaurant")
    )
      return "coffee";
    if (t.includes("flight") || t.includes("passport") || t.includes("travel"))
      return "flight";
    if (t.includes("birthday") || t.includes("cake") || t.includes("party"))
      return "cake";
    if (
      t.includes("commute") ||
      t.includes("work") ||
      t.includes("office") ||
      t.includes("job")
    )
      return "work";
    if (t.includes("gym") || t.includes("workout") || t.includes("fitness"))
      return "fitness_center";
    if (t.includes("health") || t.includes("allergy") || t.includes("doctor"))
      return "medical_services";
    return defaultIcon;
  };

  return (
    <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">
              cloud_done
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Secure Sync Active
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            Memory Vault
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            A secure storage of your preferences, data points, and context
            notes.
          </p>
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary mt-1">
            info
          </span>
          <div>
            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">
              Read-only View
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              This view is currently read-only. To modify these notes, ask me to{" "}
              <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">
                "update"
              </span>{" "}
              or{" "}
              <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded">
                "forget"
              </span>{" "}
              items in the Chat.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="whitespace-nowrap inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
        >
          Go to Chat
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Spin size="large" />
        </div>
      ) : memories.length === 0 ? (
        <div className="mt-12 text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-4">
            psychology
          </span>
          <h4 className="text-slate-400 dark:text-slate-600 font-medium">
            Have something new to remember?
          </h4>
          <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">
            Just mention it in the chat and I'll store it here automatically.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-all"
          >
            Start a conversation
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full flex items-center justify-center translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
                <span className="material-symbols-outlined text-primary text-sm">
                  {getIcon(memory.title)}
                </span>
              </div>
              <h3 className="text-slate-900 dark:text-slate-100 font-bold mb-2 pr-6">
                {memory.title || "Untitled Memory"}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed line-clamp-4">
                {memory.content}
              </p>
              <div className="mt-auto flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-xs">
                  auto_fix
                </span>
                <span>Saved by AI • {dayjs(memory.created_at).fromNow()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default MemoriesPage;
