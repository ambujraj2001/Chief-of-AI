import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Spin, message } from "antd";
import { apiGetTasks, type TaskEntry } from "../../../services/api";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import isYesterday from "dayjs/plugin/isYesterday";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchTasks = async () => {
      try {
        const accessCode = localStorage.getItem("accessCode") || "";
        if (!accessCode) {
          message.error("Access code not found.");
          setLoading(false);
          return;
        }

        const data = await apiGetTasks(accessCode);
        setTasks(data.tasks || []);
      } catch (err: unknown) {
        message.error(
          err instanceof Error ? err.message : "Failed to fetch tasks",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const getPriorityTag = (priority?: string) => {
    switch (priority) {
      case "low":
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-wider">
            Low
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 uppercase tracking-wider">
            Medium
          </span>
        );
      case "high":
      default:
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wider">
            High
          </span>
        );
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = dayjs(dateStr);
    if (d.isToday()) return "Today";
    if (d.isTomorrow()) return "Tomorrow";
    if (d.isYesterday()) return "Yesterday";
    return d.format("MMM DD");
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <span className="material-symbols-outlined text-base">
              task_alt
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Action Items
            </span>
          </div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
            Tasks
          </h1>
        </div>
      </div>

      <div className="w-full">
        {/* AI Hint Banner */}
        <div className="mb-8 p-4 rounded-xl border border-primary/20 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                AI Assistant Enabled
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tasks are managed via{" "}
                <Link
                  to="/dashboard"
                  className="text-primary hover:underline cursor-pointer"
                >
                  Chat
                </Link>
                . Try:{" "}
                <span className="italic text-slate-800 dark:text-slate-200 font-medium">
                  "Add buy milk to my tasks".
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-primary px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors whitespace-nowrap"
          >
            Open Chat
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <Spin size="large" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="mt-12 text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-5xl mb-4">
              check_box
            </span>
            <h4 className="text-slate-400 dark:text-slate-600 font-medium">
              No tasks yet
            </h4>
            <p className="text-slate-400 dark:text-slate-600 text-sm mb-6">
              Ask me to add a task for you in the chat.
            </p>
          </div>
        ) : (
          <>
            {/* Pending Tasks Section */}
            {pendingTasks.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Active Tasks
                  </h2>
                </div>
                <div className="space-y-px">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors"
                    >
                      <input
                        className="size-5 rounded-full border-slate-300 dark:border-slate-700 text-primary focus:ring-0 cursor-not-allowed shrink-0"
                        disabled
                        type="checkbox"
                      />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {task.due_date && (
                              <span className="text-xs text-primary flex items-center gap-1 shrink-0">
                                <span className="material-symbols-outlined text-[14px]">
                                  calendar_today
                                </span>
                                {formatDueDate(task.due_date)}
                              </span>
                            )}
                            {getPriorityTag(task.priority)}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block shrink-0">
                          more_horiz
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Section */}
            {completedTasks.length > 0 && (
              <section className="opacity-60">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Completed
                  </h2>
                </div>
                <div className="space-y-px">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 py-3 px-2"
                    >
                      <div className="size-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined text-sm">
                          check
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-through truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 uppercase tracking-wider">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default TasksPage;
