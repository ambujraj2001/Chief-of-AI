import { create } from 'zustand';
import { aiEventBus, type AIEvent } from '../../features/activity/aiEventBus';

interface AIState {
  currentStatus: 'idle' | 'planning' | 'thinking' | 'executing' | 'responding';
  activityFeed: AIEvent[];
  activeAgents: Array<{
    id: string;
    name: string;
    role: 'planner' | 'executor' | 'critic';
    status: 'active' | 'waiting';
  }>;
  activeContext: {
    totalTokens: number;
    referencedIds: string[];
    memories: Array<{ id: string; title: string; tokens: number }>;
    files: Array<{ id: string; name: string; tokens: number }>;
  };
  
  // Actions
  setStatus: (status: AIState['currentStatus']) => void;
  addEvent: (event: AIEvent) => void;
  clearFeed: () => void;
  updateContext: (update: Partial<AIState['activeContext']>) => void;
  setAgents: (agents: AIState['activeAgents']) => void;
}

export const useAIStore = create<AIState>((set) => ({
  currentStatus: 'idle',
  activityFeed: [],
  activeAgents: [
    { id: '1', name: 'Planner', role: 'planner', status: 'waiting' },
    { id: '2', name: 'Executor', role: 'executor', status: 'waiting' },
  ],
  activeContext: {
    totalTokens: 0,
    referencedIds: [],
    memories: [],
    files: [],
  },

  setStatus: (status) => set({ currentStatus: status }),
  addEvent: (event) => set((state) => ({ 
    activityFeed: [event, ...state.activityFeed].slice(0, 50) 
  })),
  clearFeed: () => set({ activityFeed: [] }),
  updateContext: (update) => set((state) => {
    const newContext = { ...state.activeContext, ...update };
    
    // Calculate total tokens from all components
    const memoryTokens = newContext.memories.reduce((sum, m) => sum + m.tokens, 0);
    const fileTokens = newContext.files.reduce((sum, f) => sum + f.tokens, 0);
    newContext.totalTokens = memoryTokens + fileTokens;
    
    return { activeContext: newContext };
  }),
  setAgents: (agents) => set({ activeAgents: agents }),
}));

// Auto-subscribe to the event bus
aiEventBus.subscribe((event: AIEvent) => {
  const store = useAIStore.getState();
  store.addEvent(event);

  // Update status based on event type
  switch (event.type) {
    case 'input_received':
    case 'thinking':
    case 'intent_detected':
    case 'memory_lookup':
    case 'knowledge_lookup':
      store.setStatus('thinking');
      if (event.type === 'input_received') {
        // Reset agents for new request
        store.setAgents(store.activeAgents.map(a => ({ ...a, status: 'waiting' })));
      }
      break;
    case 'plan_created':
      store.setStatus('planning');
      break;
    case 'tool_start':
      store.setStatus('executing');
      break;
    case 'tool_complete':
      store.setStatus('thinking'); // deciding next step
      break;
    case 'response_generating':
      store.setStatus('responding');
      break;
    case 'response_complete':
      store.setStatus('idle');
      // Reset all agents to waiting status
      store.setAgents(store.activeAgents.map(a => ({ ...a, status: 'waiting' })));
      break;
  }

  // Handle agent activation/spawning
  if (event.type === 'agent_spawn' && event.data?.agentId) {
    const data = event.data as { agentId: string; name: string; role: 'planner' | 'executor' | 'critic' };
    const currentAgents = store.activeAgents;
    if (!currentAgents.find(a => a.id === data.agentId)) {
      store.setAgents([
        ...currentAgents,
        { 
          id: data.agentId, 
          name: data.name || 'Agent', 
          role: data.role || 'executor', 
          status: 'active' 
        }
      ]);
    }
  }

  // Update context if provided
  if (event.type === 'context_updated' && event.data) {
    const data = event.data as { memories?: Array<{ id: string; title?: string; content?: string }> };
    if (data.memories) {
      store.updateContext({
        memories: data.memories.map((m) => ({
          id: m.id,
          title: m.title || m.content?.slice(0, 30) || 'Memory',
          tokens: Math.floor((m.content?.length || 0) / 4) // Rough token estimate
        }))
      });
    }
  }
});
