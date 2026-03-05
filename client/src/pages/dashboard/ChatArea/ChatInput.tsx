import { useRef, useEffect } from 'react';
import { message } from 'antd';
import type { SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from './types';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isListening: boolean;
  setIsListening: (value: boolean) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSend,
  isListening,
  setIsListening,
  disabled
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(isListening);
  const inputValueRef = useRef(inputValue);

  // Keep refs in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    // We only want this effect to run when isListening changes
    if (isListening) {
      const win = window as any;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (!SpeechRecognitionClass) {
        message.error('Web Speech API is not supported in your browser.');
        setIsListening(false);
        return;
      }

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
          console.log('Speech recognition started');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            const current = inputValueRef.current;
            onInputChange(`${current}${current ? ' ' : ''}${finalTranscript}`);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            message.error('Microphone access denied');
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Restart failed, retrying in 1s...', e);
              setTimeout(() => {
                if (isListeningRef.current) {
                  try { recognition.start(); } catch { setIsListening(false); }
                }
              }, 1000);
            }
          }
        };

        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          console.error('Initial start failed:', e);
          setIsListening(false);
        }
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    }

    return () => {
      // Cleanup happens only on unmount or when listening stops
    };
  }, [isListening, setIsListening, onInputChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const toggleListening = () => {
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      message.error('Web Speech API is not supported in your browser.');
      return;
    }
    setIsListening(!isListening);
  };

  return (
    <footer className="p-4 sm:p-6 shrink-0 bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 lg:border-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        <div className="relative flex items-start bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
              onClick={onSend}
              disabled={!inputValue.trim() || disabled}
              className="size-8 sm:size-9 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send (Enter)"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] translate-x-[1px]">send</span>
            </button>
          </div>
        </div>

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
  );
};

export default ChatInput;
