import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { message } from 'antd';

// Web Speech API interfaces for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
}

type Message = {
  id: string;
  role: 'ai' | 'user';
  content: string | React.ReactNode;
  timestamp?: string;
};



const TypingIndicator = () => (
  <div className="flex gap-4 group">
    <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
      <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
    </div>
    <div className="flex items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <div className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="size-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const AiMessage = ({ content }: { content: React.ReactNode }) => (
  <div className="flex gap-4 group">
    <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
      <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
    </div>
    <div className="flex flex-col gap-1.5 max-w-[85%]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chief of AI</p>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800">
        {content}
      </div>
      <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Helpful">
          <span className="material-symbols-outlined text-sm">thumb_up</span>
        </button>
        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Not helpful">
          <span className="material-symbols-outlined text-sm">thumb_down</span>
        </button>
        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Copy">
          <span className="material-symbols-outlined text-sm">content_copy</span>
        </button>
      </div>
    </div>
  </div>
);

const UserMessage = ({ content, avatarUrl }: { content: React.ReactNode, avatarUrl: string }) => (
  <div className="flex gap-4 justify-end group">
    <div className="flex flex-col gap-1.5 max-w-[85%] items-end">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">You</p>
      <div className="p-4 rounded-xl bg-primary text-white leading-relaxed shadow-sm">
        {content}
      </div>
    </div>
    <div
      className="size-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-1"
      style={{ backgroundImage: avatarUrl, backgroundSize: 'cover' }}
    />
  </div>
);

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'ai',
    content:
      "Hello Alex. I'm ready to assist you. I have access to your calendar, emails, and shared documents. How can I help you optimize your workflow today?",
  },
  {
    id: '2',
    role: 'user',
    content:
      'Set a reminder in 15 minutes to check the quarterly report. Also, can you remind me what my office wifi password is?',
  },
  {
    id: '3',
    role: 'ai',
    content: (
      <>
        I've scheduled a reminder for you at{' '}
        <span className="font-bold text-primary">10:45 AM</span> to check the{' '}
        <span className="italic">Q3 Quarterly Report.pdf</span>.
        <br />
        <br />
        Regarding your Wi-Fi credentials: Your office password is{' '}
        <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono text-sm">
          12345
        </code>
        . For security, I recommend updating this to a stronger passphrase soon.
      </>
    ),
  },
  {
    id: '4',
    role: 'user',
    content: 'Thanks. Remind me to update that next Monday.',
  },
];

const ChatArea = () => {
  const userName = useSelector((state: RootState) => state.user.fullName);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const avatarUrl = `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=137fec&color=fff&size=64')`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setTimeout(() => {
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Got it! I've noted: "${trimmed}". Is there anything else I can help you with?`,
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 1800);
  };

  const startListening = () => {
    const win = window as unknown as {
      SpeechRecognition?: { new (): SpeechRecognition };
      webkitSpeechRecognition?: { new (): SpeechRecognition };
    };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      message.error('Web Speech API is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <>
      {/* Chat History */}
      <section
        className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full"
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
        {isTyping && <TypingIndicator />}
        <div ref={chatEndRef} />
      </section>

      {/* Input Area */}
      <footer className="p-6 shrink-0 bg-white dark:bg-background-dark">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="relative flex items-start bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            {/* Attach button */}
            <button className="absolute left-4 top-4 text-slate-400 hover:text-primary transition-colors" title="Attach file">
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>

            <textarea
              ref={textareaRef}
              id="chat-input"
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask Chief of AI to do anything…"
              rows={1}
              className="w-full bg-transparent border-none rounded-xl py-4 pl-14 pr-32 text-sm placeholder-slate-500 resize-none outline-none transition-all"
              style={{ maxHeight: '160px' }}
            />

            {/* Action buttons */}
            <div className="absolute right-3 inset-y-0 flex items-center gap-2">
              <button
                id="send-button"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="size-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send (Enter)"
              >
                <span className="material-symbols-outlined text-[20px] translate-x-[1px]">send</span>
              </button>
              <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1" />
              <button
                onClick={startListening}
                className={`size-10 rounded-full flex items-center justify-center transition-all border ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse'
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                }`}
                title={isListening ? 'Listening...' : 'Voice input'}
              >
                <span className="material-symbols-outlined">{isListening ? 'graphic_eq' : 'mic'}</span>
              </button>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex justify-center gap-6">
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              GPT-4 Omni Powered
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              Enterprise Encryption Enabled
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ChatArea;
