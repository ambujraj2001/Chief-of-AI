import { IFlow } from "./types";
import { listRemindersFlow } from "./reminders/listReminders.flow";
import { createReminderFlow } from "./reminders/createReminder.flow";
import { deleteReminderFlow } from "./reminders/deleteReminder.flow";
import { shareMemoryFlow } from "./memory/shareMemory.flow";
import { joinMemoryFlow } from "./memory/joinMemory.flow";
import { listTasksFlow } from "./tasks/listTasks.flow";
import { createTaskFlow } from "./tasks/createTask.flow";
import { deleteTaskFlow } from "./tasks/deleteTask.flow";
import { updateTaskFlow } from "./tasks/updateTask.flow";
import { joinAppFlow } from "./app/joinApp.flow";

export class FlowRegistry {
  private flows: Map<string, IFlow> = new Map();

  constructor() {
    this.registerFlow(listRemindersFlow);
    this.registerFlow(createReminderFlow);
    this.registerFlow(deleteReminderFlow);
    this.registerFlow(shareMemoryFlow);
    this.registerFlow(joinMemoryFlow);
    this.registerFlow(listTasksFlow);
    this.registerFlow(createTaskFlow);
    this.registerFlow(deleteTaskFlow);
    this.registerFlow(updateTaskFlow);
    this.registerFlow(joinAppFlow);
  }

  /**
   * Registers a new deterministic flow
   */
  registerFlow(flow: IFlow): void {
    if (this.flows.has(flow.id)) {
      console.warn(`[FlowRegistry] Overwriting existing flow with ID: ${flow.id}`);
    }
    this.flows.set(flow.id, flow);
  }

  /**
   * Retrieves a flow by its unique ID
   */
  getFlowById(flowId: string): IFlow | undefined {
    return this.flows.get(flowId);
  }

  /**
   * Returns all registered flows sorted by priority (higher priority first)
   */
  getAllFlows(): IFlow[] {
    return Array.from(this.flows.values()).sort((a, b) => b.priority - a.priority);
  }

  /**
   * Clears all registered flows (mainly for testing)
   */
  clear(): void {
    this.flows.clear();
  }
}

export const registry = new FlowRegistry();
