import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReminderListCard from "./components/ReminderListCard";
import TaskListCard from "./components/TaskListCard";
import MemoryListCard from "./components/MemoryListCard";
import FileListCard from "./components/FileListCard";
import ContactListCard from "./components/ContactListCard";
import AppListCard from "./components/AppListCard";
import RoutineListCard from "./components/RoutineListCard";
import { message } from "antd";



interface AiMessageProps {
  content: string;
  onOptionSelect?: (option: string) => void;
}

interface ClarificationData {
  type: "clarification";
  question: string;
  options: string[];
}

interface UIComponentData {
  type: "ui_component";
  component: string;
  data: unknown;
}

type ParsedContent =
  | { kind: "clarification"; data: ClarificationData }
  | { kind: "ui_component"; data: UIComponentData; text?: string }
  | { kind: "text"; text: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const COMPONENT_REGISTRY: Record<string, React.FC<{ data: any }>> = {
  reminder_list: ReminderListCard as React.FC<{ data: any }>,
  task_list: TaskListCard as React.FC<{ data: any }>,
  memory_list: MemoryListCard as React.FC<{ data: any }>,
  file_list: FileListCard as React.FC<{ data: any }>,
  contact_list: ContactListCard as React.FC<{ data: any }>,
  app_list: AppListCard as React.FC<{ data: any }>,
  routine_list: RoutineListCard as React.FC<{ data: any }>,
};



/**
 * Try to extract a leading JSON object from a string that may have
 * trailing non-JSON text (e.g. the LLM returns `{...}\n\n1. item`).
 */
function extractLeadingJson(
  raw: string,
): { parsed: Record<string, unknown>; rest: string } | null {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("{")) return null;

  let idx = trimmed.indexOf("}");
  while (idx !== -1) {
    try {
      const parsed = JSON.parse(trimmed.substring(0, idx + 1));
      if (parsed && typeof parsed === "object") {
        return { parsed, rest: trimmed.substring(idx + 1).trim() };
      }
    } catch {
      /* try next closing brace */
    }
    idx = trimmed.indexOf("}", idx + 1);
  }
  return null;
}

const AiMessage: React.FC<AiMessageProps> = ({ content, onOptionSelect }) => {
  const processed = useMemo<ParsedContent>(() => {
    // 1. Try clean JSON parse
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        if (parsed.type === "clarification") {
          return { kind: "clarification", data: parsed as ClarificationData };
        }
        if (parsed.type === "ui_component") {
          return { kind: "ui_component", data: parsed as unknown as UIComponentData };
        }
        if (parsed.message) {
          return { kind: "text", text: parsed.message };
        }
      }
    } catch {
      // 2. Try extracting a leading JSON object with trailing text
      const extracted = extractLeadingJson(content);
      if (extracted) {
        const { parsed, rest } = extracted;
        if (parsed.type === "clarification" && parsed.options) {
          const data = parsed as unknown as ClarificationData;
          if (rest)
            data.question = data.question
              ? `${data.question}\n\n${rest}`
              : rest;
          return { kind: "clarification", data };
        }
        if (parsed.type === "ui_component") {
          return { kind: "ui_component", data: parsed as unknown as UIComponentData, text: rest };
        }
        const msg = typeof parsed.message === "string" ? parsed.message : "";
        const fullText = rest ? (msg ? `${msg}\n\n${rest}` : rest) : msg;
        if (fullText) return { kind: "text", text: fullText };
      }
    }

    return { kind: "text", text: content };
  }, [content]);

  return (
    <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 max-w-[85%]">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Nexora
        </p>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-card-dark text-slate-800 dark:text-slate-100 leading-relaxed border border-slate-100 dark:border-border-dark shadow-sm prose dark:prose-invert max-w-none">
          {processed.kind === "clarification" ? (
            <div className="flex flex-col gap-3">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {processed.data.question}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {processed.data.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOptionSelect?.(option)}
                    className="px-4 py-2 bg-white dark:bg-border-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : processed.kind === "ui_component" ? (
            <div className="flex flex-col gap-3">
              {processed.text && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {processed.text}
                </ReactMarkdown>
              )}
              {(() => {
                const UIComponent = COMPONENT_REGISTRY[processed.data.component];
                if (UIComponent) {
                  return <UIComponent data={processed.data.data} />;
                }
                return (
                  <div className="text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {typeof processed.data.data === "string"
                        ? processed.data.data
                        : "```json\n" +
                          JSON.stringify(processed.data.data, null, 2) +
                          "\n```"}
                    </ReactMarkdown>
                  </div>
                );
              })()}
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {processed.text}
            </ReactMarkdown>
          )}
        </div>
        {processed.kind !== "clarification" && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <button
              className="p-1 text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
              title="Copy message"
              onClick={() => {
                const text =
                  processed.kind === "text" ? processed.text : content;
                navigator.clipboard.writeText(text ?? content).then(
                  () => message.success("Copied to clipboard"),
                  () => message.error("Copy failed"),
                );
              }}
            >
              <span className="material-symbols-outlined text-[16px]">
                content_copy
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiMessage;
