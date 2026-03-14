export type ToolIntent =
  | "general_chat"
  | "tool_task"
  | "app_creation"
  | "memory_query"
  | "memory_write"
  | "memory_delete"
  | "file_operation"
  | "bound_action";

export interface ToolMetadata {
  name: string;
  version: string;
  category: string;
  tags: string[];
  intents: ToolIntent[];
}

const v = "1.0.0";

export const toolMetadataList: ToolMetadata[] = [
  { name: "add_numbers", version: v, category: "math", tags: ["math", "sum"], intents: ["tool_task"] },
  { name: "subtract_numbers", version: v, category: "math", tags: ["math", "subtract"], intents: ["tool_task"] },
  { name: "prettify_response", version: v, category: "conversation", tags: ["formatting", "style"], intents: ["general_chat", "tool_task"] },
  { name: "get_chat_history", version: v, category: "conversation", tags: ["history", "chat"], intents: ["tool_task", "memory_query"] },

  { name: "add_memory", version: v, category: "memory", tags: ["memory", "store"], intents: ["memory_write"] },
  { name: "update_memory", version: v, category: "memory", tags: ["memory", "edit"], intents: ["memory_write"] },
  { name: "delete_memory", version: v, category: "memory", tags: ["memory", "delete"], intents: ["memory_delete"] },
  { name: "search_memory", version: v, category: "memory", tags: ["memory", "search"], intents: ["memory_query", "memory_delete", "memory_write"] },
  { name: "get_memories", version: v, category: "memory", tags: ["memory", "list"], intents: ["memory_query", "memory_delete", "memory_write"] },

  { name: "add_journal", version: v, category: "journal", tags: ["journal", "entry"], intents: ["memory_write", "tool_task"] },
  { name: "update_journal", version: v, category: "journal", tags: ["journal", "edit"], intents: ["memory_write", "tool_task"] },
  { name: "delete_journal", version: v, category: "journal", tags: ["journal", "delete"], intents: ["memory_delete", "tool_task"] },
  { name: "search_journal", version: v, category: "journal", tags: ["journal", "search"], intents: ["memory_query", "tool_task"] },
  { name: "get_journals", version: v, category: "journal", tags: ["journal", "list"], intents: ["memory_query", "memory_delete", "tool_task"] },

  { name: "add_knowledge", version: v, category: "knowledge", tags: ["knowledge", "store"], intents: ["memory_write", "tool_task"] },
  { name: "update_knowledge", version: v, category: "knowledge", tags: ["knowledge", "edit"], intents: ["memory_write", "tool_task"] },
  { name: "delete_knowledge", version: v, category: "knowledge", tags: ["knowledge", "delete"], intents: ["memory_delete", "tool_task"] },
  { name: "search_knowledge", version: v, category: "knowledge", tags: ["knowledge", "search"], intents: ["memory_query", "tool_task"] },
  { name: "get_knowledges", version: v, category: "knowledge", tags: ["knowledge", "list"], intents: ["memory_query", "memory_delete", "tool_task"] },

  { name: "add_task", version: v, category: "tasks", tags: ["task", "todo"], intents: ["tool_task"] },
  { name: "update_task", version: v, category: "tasks", tags: ["task", "edit"], intents: ["tool_task"] },
  { name: "delete_task", version: v, category: "tasks", tags: ["task", "delete"], intents: ["tool_task", "memory_delete"] },
  { name: "get_tasks", version: v, category: "tasks", tags: ["task", "list"], intents: ["tool_task", "memory_query"] },

  { name: "add_reminder", version: v, category: "reminders", tags: ["reminder", "schedule"], intents: ["tool_task"] },
  { name: "update_reminder", version: v, category: "reminders", tags: ["reminder", "edit"], intents: ["tool_task"] },
  { name: "delete_reminder", version: v, category: "reminders", tags: ["reminder", "delete"], intents: ["tool_task", "memory_delete"] },
  { name: "get_reminders", version: v, category: "reminders", tags: ["reminder", "list"], intents: ["tool_task", "memory_query", "memory_delete"] },

  { name: "list_files", version: v, category: "files", tags: ["files", "list"], intents: ["file_operation"] },
  { name: "delete_file", version: v, category: "files", tags: ["files", "delete"], intents: ["file_operation", "memory_delete"] },
  { name: "read_and_summarize_file", version: v, category: "files", tags: ["files", "read", "summary"], intents: ["file_operation", "memory_query"] },

  { name: "create_app", version: v, category: "apps", tags: ["app", "builder"], intents: ["app_creation"] },
  { name: "list_apps", version: v, category: "apps", tags: ["app", "list"], intents: ["app_creation", "tool_task"] },

  { name: "create_routine", version: v, category: "routines", tags: ["routine", "automation"], intents: ["tool_task"] },
  { name: "get_routines", version: v, category: "routines", tags: ["routine", "list"], intents: ["tool_task"] },
  { name: "update_routine", version: v, category: "routines", tags: ["routine", "edit"], intents: ["tool_task"] },
  { name: "delete_routine", version: v, category: "routines", tags: ["routine", "delete"], intents: ["tool_task", "memory_delete"] },

  { name: "web_search", version: v, category: "web", tags: ["search", "internet"], intents: ["tool_task", "general_chat"] },
  { name: "send_email", version: v, category: "communication", tags: ["email", "send"], intents: ["tool_task"] },

  { name: "make_phone_call", version: v, category: "communication", tags: ["call", "phone"], intents: ["tool_task"] },
  { name: "get_joke", version: v, category: "fun", tags: ["joke", "humor"], intents: ["tool_task", "general_chat"] },

  { name: "handle_inappropriate_request", version: v, category: "safety", tags: ["safety", "guardrails"], intents: ["general_chat", "tool_task"] },
  { name: "get_capabilities", version: v, category: "help", tags: ["help", "capabilities"], intents: ["general_chat", "tool_task"] },
];

export const toolMetadataByName = Object.fromEntries(
  toolMetadataList.map((m) => [m.name, m]),
) as Record<string, ToolMetadata>;
