import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiMessageProps {
  content: string;
  onOptionSelect?: (option: string) => void;
}

interface ClarificationData {
  type: "clarification";
  question: string;
  options: string[];
}

type ParsedContent =
  | { kind: "clarification"; data: ClarificationData }
  | { kind: "text"; text: string };

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
        <span className="material-symbols-outlined text-white text-lg">
          smart_toy
        </span>
      </div>
      <div className="flex flex-col gap-1.5 max-w-[85%]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Chief of AI
        </p>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none">
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
                    className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {processed.text}
            </ReactMarkdown>
          )}
        </div>
        {processed.kind !== "clarification" && (
          <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy"
              onClick={() =>
                navigator.clipboard.writeText(
                  processed.kind === "text" ? processed.text : content,
                )
              }
            >
              <span className="material-symbols-outlined text-sm">
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
