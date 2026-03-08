import React, { useRef, useEffect, useCallback, useState } from "react";
import { message } from "antd";
import type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from "./types";
import type { FileEntry } from "../../../../services/api";
import { apiUploadFile } from "../../../../services/api";

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: (attachments?: FileEntry[]) => void;
  isListening: boolean;
  setIsListening: (value: boolean) => void;
  disabled?: boolean;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSend,
  isListening,
  setIsListening,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(isListening);
  const inputValueRef = useRef(inputValue);

  const [attachments, setAttachments] = useState<FileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const accessCode = localStorage.getItem("accessCode") || "";

  // Keep refs in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  const onInputChangeRef = useRef(onInputChange);
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    if (isListening) {
      const win = window as unknown as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognitionClass =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        message.error("Web Speech API is not supported in your browser.");
        setIsListening(false);
        return;
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      // Track the committed (final) base text separately from interim results.
      // This prevents interim results from being appended on top of themselves.
      const baseText = { value: inputValueRef.current };

      recognition.onstart = () => {
        console.log("Speech recognition started");
        // Snapshot current input value as the starting base
        baseText.value = inputValueRef.current;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        if (finalTranscript) {
          // Permanently commit final transcript into the base
          const separator = baseText.value ? " " : "";
          baseText.value = `${baseText.value}${separator}${finalTranscript.trim()}`;
          onInputChangeRef.current(baseText.value);
        } else if (interimTranscript) {
          // Show interim result as a preview without permanently committing
          const separator = baseText.value ? " " : "";
          onInputChangeRef.current(
            `${baseText.value}${separator}${interimTranscript.trim()}`,
          );
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          message.error(
            "Microphone access denied. Please check your browser permissions.",
          );
          setIsListening(false);
        } else if (event.error === "network") {
          message.error("Speech recognition network error.");
          setIsListening(false);
        }
        // Ignore "aborted" — this fires when we manually call .stop()
      };

      recognition.onend = () => {
        // Only restart if the user hasn't clicked Stop
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.warn("Speech recognition restart failed:", e);
          }
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.error("Initial speech start failed:", e);
        setIsListening(false);
      }
    } else {
      // User clicked Stop — cleanly tear down recognition
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {}; // Prevent the restart loop
        recognitionRef.current.onerror = () => {};
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Stop failed:", e);
        }
        recognitionRef.current = null;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.onerror = () => {};
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Cleanup stop failed:", e);
        }
        recognitionRef.current = null;
      }
    };
  }, [isListening, setIsListening]);

  const handleSend = useCallback(() => {
    onSend(attachments);
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [onSend, attachments]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    [onInputChange],
  );

  const toggleListening = useCallback(() => {
    setIsListening(!isListening);
  }, [isListening, setIsListening]);

  const handleFileClick = () => {
    if (attachments.length >= 2) {
      message.warning("Maximum 2 files allowed per message");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (attachments.length >= 2) {
      message.warning("Maximum 2 files allowed per message");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      message.error("File size exceeds 1MB limit");
      return;
    }

    const supportedExtensions = [".docx", ".txt", ".md", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!supportedExtensions.includes(ext)) {
      message.error("Unsupported file type");
      return;
    }

    setIsUploading(true);
    try {
      const res = await apiUploadFile(accessCode, file);
      setAttachments((prev) => [...prev, res.file]);
      message.success(`${file.name} attached`);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to upload file";
      message.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <footer className="p-4 sm:p-6 shrink-0 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 lg:border-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {attachments.length > 0 && (
          <div className="flex gap-2 px-1">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in"
              >
                <span className="material-symbols-outlined text-sm text-primary">
                  description
                </span>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                  {file.file_name}
                </span>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="bg-slate-200 dark:bg-slate-700 rounded-full size-4 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    close
                  </span>
                </button>
              </div>
            ))}
            {isUploading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] text-slate-500">Uploading...</span>
              </div>
            )}
          </div>
        )}

        <div className="relative flex items-start bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".docx,.txt,.md,.csv"
          />
          <button
            className={`absolute left-3 sm:left-4 top-4 transition-colors ${attachments.length >= 2 || isUploading ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-primary"}`}
            title="Attach file"
            onClick={handleFileClick}
            disabled={attachments.length >= 2 || isUploading}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                attach_file
              </span>
            )}
          </button>

          <textarea
            ref={textareaRef}
            id="chat-input"
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            rows={1}
            className="w-full bg-transparent border-none rounded-xl py-4 pl-10 sm:pl-14 pr-24 sm:pr-32 text-sm placeholder-slate-500 resize-none outline-none transition-all"
            style={{ maxHeight: "160px" }}
          />

          <div className="absolute right-2 sm:right-3 inset-y-0 flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleListening}
              className={`size-7 sm:size-8 rounded-full flex items-center justify-center transition-all border ${
                isListening
                  ? "bg-red-500 text-white border-red-600 animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
              }`}
              title={isListening ? "Stop recording" : "Voice input"}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                {isListening ? "graphic_eq" : "mic"}
              </span>
            </button>
            <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 mx-0.5 sm:mx-1" />
            <button
              id="send-button"
              onClick={handleSend}
              disabled={
                (!inputValue.trim() && attachments.length === 0) ||
                disabled ||
                isUploading
              }
              className="size-8 sm:size-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send (Enter)"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] translate-x-[1px]">
                send
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            Supercharged by AI
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <span className="material-symbols-outlined text-[14px]">
              shield_person
            </span>
            Enterprise Encryption
          </p>
        </div>
      </div>
    </footer>
  );
};

export default ChatInput;
