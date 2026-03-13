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
    | 'memory_search_started'
    | 'memory_search_fallback_triggered'
    | 'memory_candidates_retrieved'
    | 'memory_filtered'
    | 'response_generating'
    | 'response_complete';
  message: string;
  status: 'pending' | 'success' | 'warning' | 'info';
  timestamp: number;
  data?: Record<string, any>;
}
