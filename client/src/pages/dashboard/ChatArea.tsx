import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { message } from 'antd';

// Web Speech API interfaces for TypeScript
interface SpeechRecognitionResult {
  isFinal: boolean;
  [key: number]: {
    transcript: string;
  };
}

interface SpeechRecognitionResultList {
  length: number;
  [key: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type Message = {
  id: string;
  role: 'ai' | 'user';
  content: string | React.ReactNode;
  timestamp?: string;
};



import { apiChat } from '../../services/api';

const AgentThinkingLog = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => setStep(3), 2400),
      setTimeout(() => setStep(4), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { label: "Initializing Agent Intelligence", icon: "memory" },
    { label: "Analyzing reasoning patterns", icon: "psychology" },
    { label: "Scanning tool capabilities", icon: "terminal" },
    { label: "Optimizing workflow strategy", icon: "account_tree" },
    { label: "Constructing final response", icon: "auto_awesome" }
  ];

  return (
    <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 mt-1 shadow-lg border border-slate-700">
        <span className="material-symbols-outlined text-primary text-lg animate-pulse">hub</span>
      </div>
      
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none max-w-[85%] relative overflow-hidden">
        {/* Progress Background */}
        <div className="absolute top-0 left-0 h-0.5 bg-primary/20 w-full">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-out" 
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="flex items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em] font-mono">Agent Reasoning Engine</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {steps.map((s, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-3 text-[11px] font-mono transition-all duration-500 ${
                idx <= step ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-700'
              }`}
            >
              <div className="relative">
                {idx < step ? (
                  <span className="material-symbols-outlined text-sm text-primary">done_all</span>
                ) : idx === step ? (
                  <span className="material-symbols-outlined text-sm text-primary animate-spin-slow">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-sm opacity-30">{s.icon}</span>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className={`${idx === step ? 'font-bold' : 'font-medium'}`}>
                  {s.label}
                  {idx === step && <span className="animate-pulse inline-block ml-1">_</span>}
                </span>
                {idx === step && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 animate-pulse transition-opacity">
                    {idx === 0 && "> mounting modules..."}
                    {idx === 1 && "> tokenizing intent vectors..."}
                    {idx === 2 && "> verifying middleware permissions..."}
                    {idx === 3 && "> selecting optimal response format..."}
                    {idx === 4 && "> finalizing cognitive stream..."}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AiMessage = ({ content }: { content: React.ReactNode }) => (
  <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
      <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
    </div>
    <div className="flex flex-col gap-1.5 max-w-[85%]">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chief of AI</p>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
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
  <div className="flex gap-4 justify-end group animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="flex flex-col gap-1.5 max-w-[85%] items-end">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">You</p>
      <div className="p-4 rounded-xl bg-primary text-white leading-relaxed shadow-sm">
        {content}
      </div>
    </div>
    <div
      className="size-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-1 border-2 border-white dark:border-slate-800 shadow-sm"
      style={{ backgroundImage: avatarUrl, backgroundSize: 'cover' }}
    />
  </div>
);

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  const toggleListening = () => {
    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

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
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputValue((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onend = () => {
      // If we're still supposed to be listening (user hasn't clicked stop), restart
      if (isListeningRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
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
      <footer className="p-4 sm:p-6 shrink-0 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 lg:border-none">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="relative flex items-start bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            {/* Attach button */}
            <button className="absolute left-3 sm:left-4 top-4 text-slate-400 hover:text-primary transition-colors" title="Attach file">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">attach_file</span>
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
              style={{ maxHeight: '160px' }}
            />

            {/* Action buttons */}
            <div className="absolute right-2 sm:right-3 inset-y-0 flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleListening}
                className={`size-7 sm:size-8 rounded-full flex items-center justify-center transition-all border ${
                  isListening
                    ? 'bg-red-500 text-white border-red-600 animate-pulse'
                    : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                }`}
                title={isListening ? 'Stop recording' : 'Voice input'}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">{isListening ? 'graphic_eq' : 'mic'}</span>
              </button>
              <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 mx-0.5 sm:mx-1" />
              <button
                id="send-button"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="size-8 sm:size-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send (Enter)"
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] translate-x-[1px]">send</span>
              </button>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              Supercharged by AI
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px]">shield_person</span>
              Enterprise Encryption
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ChatArea;
