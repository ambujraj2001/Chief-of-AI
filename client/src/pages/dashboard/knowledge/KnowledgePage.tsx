import React, { useEffect, useState } from "react";
import { Spin, message } from "antd";
import {
  apiGetKnowledge,
  apiDeleteKnowledge,
  type MemoryEntry,
} from "../../../services/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const KnowledgePage: React.FC = () => {
  const [knowledgeList, setKnowledgeList] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchKnowledge = async () => {
      try {
        const accessCode = localStorage.getItem("accessCode") || "";
        if (!accessCode) {
          message.error("Access code not found.");
          setLoading(false);
          return;
        }

        const data = await apiGetKnowledge(accessCode);
        setKnowledgeList(data.knowledge || []);
      } catch (err: unknown) {
        message.error(
          err instanceof Error ? err.message : "Failed to fetch knowledge",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledge();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const accessCode = localStorage.getItem("accessCode") || "";
      if (!accessCode) return;
      await apiDeleteKnowledge(accessCode, id);
      setKnowledgeList((prev) => prev.filter((entry) => entry.id !== id));
      message.success("Knowledge entry deleted.");
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : "Failed to delete knowledge entry",
      );
    }
  };

  const getKnowledgeContext = (title: string | null) => {
    const t = (title || "").toLowerCase();

    if (
      t.includes("legal") ||
      t.includes("audit") ||
      t.includes("compliance")
    ) {
      return { icon: "gavel", category: "Legal" };
    }
    if (
      t.includes("market") ||
      t.includes("strategy") ||
      t.includes("financial") ||
      t.includes("compute")
    ) {
      return { icon: "monitoring", category: "Strategy" };
    }
    if (
      t.includes("science") ||
      t.includes("research") ||
      t.includes("breakthrough") ||
      t.includes("paper")
    ) {
      return { icon: "science", category: "Research" };
    }
    if (
      t.includes("ai") ||
      t.includes("technical") ||
      t.includes("code") ||
      t.includes("framework") ||
      t.includes("deployment") ||
      t.includes("software")
    ) {
      return { icon: "terminal", category: "Technical" };
    }
    return { icon: "description", category: "General" };
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full bg-background-light dark:bg-background-dark">
      {/* Page Intro */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">
              neurology
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              AI Processed Baseline
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            Knowledge Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            A curated view of long-form intelligence, research papers, and
            deep-extracted documents.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Total Documents
                </span>
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">
                  description
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl text-slate-900 dark:text-white font-bold leading-none">
                  {knowledgeList.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Saved in your knowledge base
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Last Sync
                </span>
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">
                  sync
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl text-slate-900 dark:text-white font-bold leading-none">
                  {knowledgeList.length > 0
                    ? dayjs(knowledgeList[0].created_at).fromNow(true)
                    : "Never"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Real-time data pipeline active
              </p>
            </div>
          </div>

          {knowledgeList.length === 0 ? (
            <div className="mt-12 text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-4">
                auto_stories
              </span>
              <h4 className="text-slate-500 dark:text-slate-400 font-medium text-lg">
                Your Knowledge Library is empty
              </h4>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">
                Ask me to remember facts, research, or snippets to build your
                library.
              </p>
            </div>
          ) : (
            <>
              {/* Document Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {knowledgeList.map((item) => {
                  const ctx = getKnowledgeContext(item.title);
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-primary/50 transition-all shadow-sm"
                    >
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-4">
                            <div className="size-14 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-primary text-3xl">
                                {ctx.icon}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase rounded text-slate-600 dark:text-slate-400">
                                  {ctx.category}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {dayjs(item.created_at).format(
                                    "MMM DD, YYYY",
                                  )}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                {item.title || "Untitled Document"}
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                {item.content}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors cursor-pointer">
                              visibility
                            </span>
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              title="Delete knowledge"
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <span className="material-symbols-outlined text-sm">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                            #knowledge
                          </span>
                          <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                            #{ctx.category.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
};

export default KnowledgePage;
