import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../store';
import { message } from 'antd';
import { apiChat } from '../../../services/api';

import type { Message } from './types';
import AiMessage from './AiMessage';
import UserMessage from './UserMessage';
import AgentThinkingLog from './AgentThinkingLog';
import ChatInput from './ChatInput';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'ai',
    content:
      "Hello! I'm Chief of AI. I'm ready to assist you by orchestrating your tasks and tools. How can I help you optimize your workflow today?",
  },
];

const ChatArea = () => {
  const user = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const userName = user.fullName;
  const accessCode = user.accessCode || localStorage.getItem('accessCode') || '';

  const avatarUrl = `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=137fec&color=fff&size=64')`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await apiChat(trimmed, accessCode);
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result.reply,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to get response from Chief of AI";
      message.error(errMsg);
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-background-dark">
      {/* Chat History */}
      <section
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 max-w-4xl mx-auto w-full"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#e2e8f0 transparent',
        }}
      >
        {messages.map((msg) =>
          msg.role === 'ai' ? (
            <AiMessage key={msg.id} content={msg.content} />
          ) : (
            <UserMessage key={msg.id} content={msg.content} avatarUrl={avatarUrl} />
          )
        )}
        {isTyping && <AgentThinkingLog />}
        <div ref={chatEndRef} />
      </section>

      {/* Input Area */}
      <ChatInput 
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        isListening={isListening}
        setIsListening={setIsListening}
        disabled={isTyping}
      />
    </div>
  );
};

export default ChatArea;
