export interface AIEvent {
  id: string;
  type: 
    | 'input_received'
    | 'intent_detected'
    | 'plan_created'
    | 'memory_scan'
    | 'memory_lookup'
    | 'task_fetch'
    | 'calendar_lookup'
    | 'knowledge_lookup'
    | 'tool_start'
    | 'tool_complete'
    | 'tool_approval'
    | 'tool_denial'
    | 'clarification_needed'
    | 'agent_spawn'
    | 'thinking'
    | 'context_updated'
    | 'response_generating'
    | 'response_complete';
  message: string;
  status: 'pending' | 'success' | 'warning' | 'info';
  timestamp: number;
  data?: Record<string, unknown>;
}

type AIEventListener = (event: AIEvent) => void;

class AIEventBus {
  private listeners: AIEventListener[] = [];

  subscribe(listener: AIEventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: AIEvent) {
    this.listeners.forEach((l) => l(event));
  }

  // Helper for quick emitting
  emitSimple(type: AIEvent['type'], message: string, status: AIEvent['status'] = 'info') {
    this.emit({
      id: Math.random().toString(36).substring(7),
      type,
      message,
      status,
      timestamp: Date.now(),
    });
  }
}

export const aiEventBus = new AIEventBus();
