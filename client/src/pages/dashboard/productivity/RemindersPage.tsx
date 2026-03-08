import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetReminders } from "../../../services/api";
import type { ReminderEntry } from "../../../services/api";
import dayjs from "dayjs";

const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const accessCode = localStorage.getItem("accessCode") || "";
      try {
        const res = await apiGetReminders(accessCode);
        setReminders(res.reminders);
      } catch (err) {
        console.error("Failed to fetch reminders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const morningReminders = useMemo(
    () => reminders.filter((r) => dayjs(r.remind_at).hour() < 12),
    [reminders],
  );

  const afternoonReminders = useMemo(
    () => reminders.filter((r) => dayjs(r.remind_at).hour() >= 12),
    [reminders],
  );

  const renderReminderCard = (reminder: ReminderEntry) => {
    const timeStr = dayjs(reminder.remind_at).format("HH:mm");
    const isCompleted = reminder.status === "completed";
    const isUpcoming =
      !isCompleted && dayjs(reminder.remind_at).isAfter(dayjs());

    return (
      <div
        key={reminder.id}
        className={`bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary/50 transition-all ${isUpcoming ? "border-l-4 border-l-primary" : ""} ${isCompleted ? "opacity-70" : ""}`}
      >
        <div
          className={`text-3xl font-black transition-transform group-hover:scale-105 ${isCompleted ? "text-slate-400" : "text-primary"}`}
        >
          {timeStr}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            {reminder.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${isUpcoming ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
            >
              {isCompleted ? "Completed" : isUpcoming ? "Upcoming" : "Schedule"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">
                notifications
              </span>{" "}
              {dayjs(reminder.remind_at).format("MMM D")}
            </span>
          </div>
        </div>
        <div className="text-slate-300 dark:text-slate-700">
          <span className="material-symbols-outlined">lock</span>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-6xl mx-auto w-full bg-background-light dark:bg-background-dark">
      <div>
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              notifications_active
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Reminders
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Active Reminders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Stay on track with timely reminders powered by AI.
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-10 bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-primary flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Read-only Mode
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              To change a reminder, tell me in the Chat. E.g.,{" "}
              <span className="italic font-medium text-slate-800 dark:text-slate-200">
                "Change my reminder to 6 PM"
              </span>
              .
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Go to Chat
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
              notifications_off
            </span>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No reminders set yet
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Chat with the Chief to set up your schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning */}
            {morningReminders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 px-1">
                  Morning Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {morningReminders.map(renderReminderCard)}
                </div>
              </div>
            )}

            {/* Afternoon */}
            {afternoonReminders.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 mt-8 px-1">
                  Afternoon & Evening
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {afternoonReminders.map(renderReminderCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state hint */}
        <div className="mt-12 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">
            add_circle
          </span>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Need to add more?
          </p>
          <p className="text-sm text-slate-400">
            Simply chat with the Chief to set up new automated reminders.
          </p>
        </div>
      </div>
    </main>
  );
};

export default RemindersPage;
