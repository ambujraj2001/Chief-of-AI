import React, { useState, useEffect, useMemo } from "react";
import { Calendar, dayjsLocalizer, Views } from "react-big-calendar";
import { Tooltip } from "antd";
import type { View, EventProps } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  apiGetTasks,
  apiGetReminders,
  apiGetInsights,
} from "../../../services/api";
import type {
  TaskEntry,
  ReminderEntry,
  InsightEntry,
} from "../../../services/api";

const localizer = dayjsLocalizer(dayjs);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "task" | "reminder";
  originalData: TaskEntry | ReminderEntry;
}

const CalendarPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [reminders, setReminders] = useState<ReminderEntry[]>([]);
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  useEffect(() => {
    const fetchData = async () => {
      const accessCode = localStorage.getItem("accessCode") || "";

      try {
        const [tasksRes, remindersRes] = await Promise.all([
          apiGetTasks(accessCode),
          apiGetReminders(accessCode),
        ]);

        setTasks(tasksRes.tasks);
        setReminders(remindersRes.reminders);

        fetchInsights(
          accessCode,
          dayjs().startOf("day").toISOString(),
          dayjs().endOf("day").toISOString(),
        );
      } catch (err) {
        console.error("Failed to fetch calendar data:", err);
      }
    };

    fetchData();
  }, []);

  const fetchInsights = async (
    accessCode: string,
    start: string,
    end: string,
  ) => {
    setLoadingInsights(true);
    try {
      const res = await apiGetInsights(accessCode, start, end);
      setInsights(res.insights);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleRefreshInsights = () => {
    const accessCode = localStorage.getItem("accessCode") || "";
    fetchInsights(
      accessCode,
      dayjs().startOf("day").toISOString(),
      dayjs().endOf("day").toISOString(),
    );
  };

  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    const pendingTasks = tasks.filter((t) => t.status === "pending");
    pendingTasks.forEach((task) => {
      const today = dayjs();
      calendarEvents.push({
        id: `task-${task.id}`,
        title: `[Task] ${task.title}`,
        start: today.hour(14).minute(0).second(0).toDate(),
        end: today.hour(17).minute(0).second(0).toDate(),
        type: "task",
        originalData: task,
      });
    });

    reminders.forEach((reminder) => {
      const start = dayjs(reminder.remind_at).toDate();
      const end = dayjs(reminder.remind_at).add(1, "hour").toDate();
      calendarEvents.push({
        id: `reminder-${reminder.id}`,
        title: `${reminder.status === "completed" ? "✓ " : ""}${reminder.title}`,
        start,
        end,
        type: "reminder",
        originalData: reminder,
      });
    });

    return calendarEvents;
  }, [tasks, reminders]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case "negative":
        return "bg-rose-500/5 border-rose-500/10 text-rose-700 dark:text-rose-400";
      case "positive":
        return "bg-emerald-500/5 border-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "recommendation":
        return "bg-indigo-500/5 border-indigo-500/10 text-indigo-700 dark:text-indigo-400";
      default:
        return "bg-primary/5 border-primary/10 text-primary";
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3b82f6";
    if (event.type === "task") {
      backgroundColor = "#4f46e5";
    } else if (event.type === "reminder") {
      const isCompleted = event.originalData.status === "completed";
      backgroundColor = isCompleted ? "#64748b" : "#10b981";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 4px",
      },
    };
  };

  const components = useMemo(
    () => ({
      event: ({ event }: EventProps<CalendarEvent>) => (
        <Tooltip
          title={
            <div className="p-1 space-y-1">
              <div className="font-bold border-b border-white/10 pb-1 mb-1 text-xs">
                {event.title}
              </div>
              <div className="text-[10px] flex items-center gap-1 opacity-90">
                <span className="material-symbols-outlined text-[10px]">
                  schedule
                </span>
                {dayjs(event.start).format("h:mm A")} -{" "}
                {dayjs(event.end).format("h:mm A")}
              </div>
              <div className="text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">
                  {event.type === "task" ? "task_alt" : "notifications"}
                </span>
                <span className="capitalize">{event.originalData.status}</span>
              </div>
            </div>
          }
          mouseEnterDelay={0.2}
        >
          <div className="w-full h-full text-[11px] font-semibold truncate px-1">
            {event.title}
          </div>
        </Tooltip>
      ),
    }),
    [],
  );

  return (
    <main className="flex-1 overflow-hidden p-0 m-0 w-full bg-background-light dark:bg-background-dark flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col overflow-y-auto px-6 py-8 md:px-10">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_month
              </span>
              <span className="text-xs font-bold uppercase tracking-widest">
                Schedule
              </span>
            </div>
            <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
              Calendar
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">
                info
              </span>
              Pending tasks are automatically scheduled for "deep work" today (2
              PM - 5 PM).
            </p>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-hidden flex flex-col rbc-dark-override">
          <div className="h-[700px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              date={currentDate}
              onView={(view: View) => setCurrentView(view)}
              onNavigate={(date: Date) => setCurrentDate(date)}
              eventPropGetter={eventStyleGetter}
              components={components}
              views={["month", "week", "day"]}
              className="font-sans text-sm"
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col overflow-y-auto shrink-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6 text-primary">
            <span className="material-symbols-outlined text-xl">
              auto_awesome
            </span>
            <h4 className="text-sm font-bold uppercase tracking-widest">
              Today's Insights
            </h4>
          </div>

          <div className="space-y-4">
            {loadingInsights ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse"
                >
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
                  </div>
                </div>
              ))
            ) : insights.length > 0 ? (
              insights.map((insight, idx) => {
                const styleClass = getInsightColor(insight.type);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${styleClass.split(" ")[0]} ${styleClass.split(" ")[1]}`}
                  >
                    <p
                      className={`text-sm font-bold mb-2 ${styleClass.split(" ")[2]} ${styleClass.split(" ")[3] || ""}`}
                    >
                      {insight.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="material-symbols-outlined text-slate-400 text-3xl mb-2">
                  done_all
                </span>
                <p className="text-sm font-bold text-slate-500 mb-1">
                  Clear Schedule
                </p>
                <p className="text-xs text-slate-400">
                  No pressing tasks or reminders for today!
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleRefreshInsights}
              className="w-full py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh Today's Insights
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .rbc-calendar {
            font-family: inherit;
        }
        .rbc-toolbar button {
            color: #64748b;
            border-color: #e2e8f0;
            border-radius: 6px;
            font-weight: 600;
        }
        .rbc-toolbar button:hover {
            color: #3c83f6;
            background-color: #f1f5f9;
        }
        .rbc-toolbar button.rbc-active {
            background-color: #3c83f6;
            color: white;
            border-color: #3c83f6;
            box-shadow: none;
        }
        .rbc-month-view, .rbc-time-view {
            border-color: #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .rbc-month-row, .rbc-day-bg, .rbc-header {
            border-color: #e2e8f0;
        }
        .rbc-header {
            padding: 8px 0;
            font-weight: 700;
            color: #475569;
        }
        .rbc-off-range-bg {
            background: #f8fafc;
        }
        .rbc-today {
            background-color: #eff6ff !important;
        }
        .rbc-event {
            padding: 2px 5px;
        }
        .rbc-time-content {
            border-top: 1px solid #e2e8f0;
        }
        .rbc-time-header-content {
            border-left: 1px solid #e2e8f0;
        }
        .rbc-timeslot-group {
            border-bottom: 1px solid #e2e8f0;
        }
        .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #f1f5f9;
        }
        
        .dark .rbc-month-view,
        .dark .rbc-time-view,
        .dark .rbc-month-row,
        .dark .rbc-day-bg,
        .dark .rbc-header,
        .dark .rbc-time-content,
        .dark .rbc-time-header-content,
        .dark .rbc-timeslot-group,
        .dark .rbc-toolbar button {
            border-color: #334155;
        }
        .dark .rbc-toolbar button {
            color: #94a3b8;
        }
        .dark .rbc-toolbar button:hover {
            color: #3c83f6;
            background-color: #1e293b;
        }
        .dark .rbc-toolbar button.rbc-active {
            background-color: #3c83f6;
            color: white;
            border-color: #3c83f6;
        }
        .dark .rbc-header {
            color: #cbd5e1;
        }
        .dark .rbc-off-range-bg {
            background: #0f172a;
        }
        .dark .rbc-today {
            background-color: #1e293b !important;
        }
        .dark .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #1e293b;
        }
        .dark .rbc-time-view .rbc-allday-cell {
            background-color: transparent;
        }
      `}</style>
    </main>
  );
};

export default CalendarPage;
