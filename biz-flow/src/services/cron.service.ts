import cron from "node-cron";
import { getDueReminders, updateReminder } from "./reminder.service";
import { sendReminderEmail, sendRoutineResultEmail } from "./mail.service";
import {
  getActiveRoutines,
  updateRoutine,
  saveRoutineRun,
  createNotification,
} from "./routine.service";
import { runAgent } from "../agents/chatAgent";
import { isValidCron } from "cron-validator";
import CronExpressionParser from "cron-parser";

// Simplified lock for concurrent runs
const runningRoutines = new Set<string>();

export const initCronJobs = () => {
  console.log("Initializing cron jobs...");

  const processAll = async () => {
    const now = new Date();
    console.log(`[CRON] Tick at ${now.toISOString()}`);

    // 1. Process Reminders
    try {
      const dueReminders = await getDueReminders();
      for (const reminder of dueReminders) {
        const userEmail = reminder.users?.email;
        if (userEmail) {
          try {
            await sendReminderEmail(
              userEmail,
              reminder.title,
              reminder.remind_at,
            );
            await updateReminder(reminder.id, reminder.user_id, {
              status: "notified",
            });
            console.log(`[REMINDER] Sent to ${userEmail}: ${reminder.title}`);
          } catch (mailError) {
            console.error(`[REMINDER] Failed for ${userEmail}:`, mailError);
          }
        }
      }
    } catch (err) {
      console.error("[CRON] Error in reminders:", err);
    }

    // 2. Process AI Routines
    try {
      const activeRoutines = await getActiveRoutines();
      for (const routine of activeRoutines) {
        if (runningRoutines.has(routine.id)) continue;

        if (!isValidCron(routine.cron_expression)) {
          console.warn(`[ROUTINE] Invalid cron: ${routine.cron_expression}`);
          continue;
        }

        try {
          const lastRun = routine.last_run
            ? new Date(routine.last_run)
            : new Date(now.getTime() - 61000);

          const interval = CronExpressionParser.parse(routine.cron_expression, {
            currentDate: lastRun,
            endDate: now,
            iterator: true,
          } as any);

          if (!interval.hasNext()) continue;

          console.log(`[ROUTINE] Executing: ${routine.name} (${routine.id})`);
          runningRoutines.add(routine.id);

          const result = await runAgent(
            routine.instruction,
            (routine as any).users,
          );

          await saveRoutineRun({
            routine_id: routine.id,
            result: result,
          });

          await updateRoutine(routine.id, { last_run: now.toISOString() });

          // Send Email Result
          const userEmail = (routine as any).users?.email;
          if (userEmail) {
            try {
              await sendRoutineResultEmail(userEmail, routine.name, result);
              console.log(`[ROUTINE] Email sent to ${userEmail}`);
            } catch (emailErr) {
              console.error(`[ROUTINE] Failed to send email:`, emailErr);
            }
          }

          await createNotification({
            user_id: routine.user_id,
            title: `Routine Completed: ${routine.name}`,
            message: `Your automated routine "${routine.name}" has finished. Check your email for the full report.`,
          });

          console.log(`[ROUTINE] Success: ${routine.name}`);
        } catch (execError: any) {
          if (!execError.message?.includes("No intermediate iterations")) {
            console.error(`[ROUTINE] Error in ${routine.name}:`, execError);
          }
        } finally {
          runningRoutines.delete(routine.id);
        }
      }
    } catch (err) {
      console.error("[CRON] Error in routines:", err);
    }
  };

  // Run every minute
  cron.schedule("* * * * *", processAll);
};
