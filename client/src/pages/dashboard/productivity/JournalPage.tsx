import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Spin, message } from "antd";
import { apiGetJournal, type MemoryEntry } from "../../../services/api";
import dayjs from "dayjs";

const JournalPage: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchJournal = async () => {
      try {
        const accessCode = localStorage.getItem("accessCode") || "";
        if (!accessCode) {
          message.error("Access code not found.");
          setLoading(false);
          return;
        }

        const data = await apiGetJournal(accessCode);
        setJournalEntries(data.journal || []);
      } catch (err: unknown) {
        message.error(
          err instanceof Error ? err.message : "Failed to fetch journal",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full bg-background-light dark:bg-background-dark">
      {/* Page Intro */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">book_2</span>
            <span className="text-xs font-bold uppercase tracking-widest">
              AI Guided Reflections
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            Journal Log
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Capture moments and reflections through{" "}
            <Link
              to="/dashboard"
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Chat
            </Link>
            . Try:{" "}
            <span className="text-slate-700 dark:text-slate-300">
              "Draft a journal entry about..."
            </span>
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative">
        {loading ? (
          <div className="flex justify-center my-12">
            <Spin size="large" />
          </div>
        ) : journalEntries.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-4">
              book_2
            </span>
            <h4 className="text-slate-500 dark:text-slate-400 font-medium text-lg">
              Your Journal is empty
            </h4>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
              Use Chat to write your first daily entry or reflection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                      {dayjs(entry.created_at).format("MMMM DD, YYYY")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {dayjs(entry.created_at).format("h:mm A")}
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors pr-6">
                  {entry.title || "Journal Entry"}
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-grow whitespace-pre-wrap line-clamp-4">
                  {entry.content}
                </p>
                <div className="mt-auto flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-xs">
                    auto_fix
                  </span>
                  <span>Saved by AI</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default JournalPage;
