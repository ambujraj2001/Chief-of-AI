import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface UserMessageProps {
  content: string;
  avatarUrl: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content, avatarUrl }) => {
  // Hide the technical [File: ..., ID: ...] metadata from the user's view if it exists
  const cleanContent = content
    .split("Attached:")[0]
    .split("I uploaded:")[0]
    .trim();
  const attachmentPart = content.includes("Attached:")
    ? content.split("Attached:")[1]
    : content.includes("I uploaded:")
      ? content.split("I uploaded:")[1]
      : null;

  return (
    <div className="flex gap-4 justify-end group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1.5 max-w-[85%] items-end">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          You
        </p>
        <div className="p-4 rounded-2xl bg-primary text-white leading-relaxed shadow-sm prose prose-invert max-w-none">
          {cleanContent && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanContent}
            </ReactMarkdown>
          )}

          {attachmentPart && (
            <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap gap-2">
              {/* Extract file names from the markdown links like [File: Name, ID: ...](url) */}
              {attachmentPart.split("),").map((part, idx) => {
                const nameMatch = part.match(/\[File: (.*?), ID:/);
                const name = nameMatch ? nameMatch[1] : "Document";
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-xs font-medium border border-white/10"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      description
                    </span>
                    {name}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div
        className="size-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-1 border-2 border-white dark:border-slate-800 shadow-sm"
        style={{ backgroundImage: avatarUrl, backgroundSize: "cover" }}
      />
    </div>
  );
};

export default UserMessage;
