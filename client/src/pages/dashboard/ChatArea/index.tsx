import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { type RootState } from "../../../store";
import { message, Spin } from "antd";
import { useParams } from "react-router-dom";
import {
  apiChat,
  apiGetChatHistory,
  type ChatMessage as ApiChatMessage,
  type FileEntry,
} from "../../../services/api";
import dayjs from "dayjs";

import type { Message } from "./types";
import AiMessage from "./AiMessage";
import UserMessage from "./UserMessage";
import AgentThinkingLog from "./AgentThinkingLog";
import ChatInput from "./ChatInput";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "ai",
    content:
      "Welcome to Chief of AI. I can help you manage tasks, reminders, knowledge, and tools through chat. Just tell me what you want to do.",
  },
];

const ChatArea = () => {
  const user = useSelector((state: RootState) => state.user);
  const { conversationId: urlConversationId } = useParams<{
    conversationId: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sessionConversationId = useMemo(() => {
    if (urlConversationId) return urlConversationId;
    try {
      return crypto.randomUUID();
    } catch {
      return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  }, [urlConversationId]);

  const hasFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (urlConversationId === hasFetchedRef.current) return;

    const loadHistory = async () => {
      if (!urlConversationId) {
        setMessages(INITIAL_MESSAGES);
        hasFetchedRef.current = null;
        return;
      }

      try {
        setLoadingHistory(true);
        hasFetchedRef.current = urlConversationId;
        const accessCode = localStorage.getItem("accessCode") || "";
        const response = await apiGetChatHistory(accessCode);

        const sortedMessages = [...response.messages].sort(
          (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
        );

        const groups: Record<string, ApiChatMessage[]> = {};
        let currentVirtualCid = "initial";
        let lastMessageTime = 0;

        sortedMessages.forEach((msg) => {
          const cid = msg.conversation_id;
          const msgTime = dayjs(msg.created_at).unix();

          if (!cid) {
            if (lastMessageTime !== 0 && msgTime - lastMessageTime > 300) {
              currentVirtualCid = `v-${msgTime}`;
            }
            if (!groups[currentVirtualCid]) groups[currentVirtualCid] = [];
            groups[currentVirtualCid].push(msg);
          } else {
            if (!groups[cid]) groups[cid] = [];
            groups[cid].push(msg);
          }
          lastMessageTime = msgTime;
        });

        const conversationMessages = groups[urlConversationId] || [];
        const formattedMessages: Message[] = conversationMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));

        setMessages(
          formattedMessages.length > 0 ? formattedMessages : INITIAL_MESSAGES,
        );
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setMessages(INITIAL_MESSAGES);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [urlConversationId]);

  // Handle 'prompt' query param from other pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPrompt = params.get("prompt");
    if (initialPrompt) {
      setInputValue(initialPrompt);
      // Clean up URL without refreshing
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const userName = user.fullName;
  const accessCode = useMemo(
    () => user.accessCode || localStorage.getItem("accessCode") || "",
    [user.accessCode],
  );
  const avatarUrl = useMemo(
    () =>
      `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=3c83f6&color=fff&size=64')`,
    [userName],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(
    async (attachments?: FileEntry[], textOverride?: string) => {
      let content =
        textOverride !== undefined ? textOverride : inputValue.trim();

      if (attachments && attachments.length > 0) {
        const fileLinks = attachments
          .map((a) => `[File: ${a.file_name}, ID: ${a.id}](${a.file_url})`)
          .join(", ");
        const prefix = content ? `${content}\n\nAttached: ` : "I uploaded: ";
        content = `${prefix}${fileLinks}`;
      }

      if (!content) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMsg]);
      if (textOverride === undefined) {
        setInputValue("");
      }
      setIsTyping(true);

      try {
        const result = await apiChat(
          content,
          accessCode,
          sessionConversationId,
        );
        const aiReply: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: result.reply,
        };
        setMessages((prev) => [...prev, aiReply]);
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error
            ? err.message
            : "Failed to get response from Chief of AI";
        message.error(errMsg);
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, accessCode, sessionConversationId],
  );

  const handleOptionSelect = useCallback(
    (option: string) => {
      handleSend(undefined, option);
    },
    [handleSend],
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSetIsListening = useCallback((value: boolean) => {
    setIsListening(value);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-background-dark">
      <section
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 max-w-4xl mx-auto w-full"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#e2e8f0 transparent",
        }}
      >
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Spin size="large" />
            <p className="text-sm font-medium">Loading conversation...</p>
          </div>
        ) : (
          messages.map((msg) =>
            msg.role === "ai" ? (
              <AiMessage
                key={msg.id}
                content={msg.content}
                onOptionSelect={handleOptionSelect}
              />
            ) : (
              <UserMessage
                key={msg.id}
                content={msg.content}
                avatarUrl={avatarUrl}
              />
            ),
          )
        )}
        {isTyping && <AgentThinkingLog />}
        <div ref={chatEndRef} />
      </section>

      <ChatInput
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSend={handleSend}
        isListening={isListening}
        setIsListening={handleSetIsListening}
        disabled={isTyping}
      />
    </div>
  );
};

export default ChatArea;
