'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send, Mic, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  reactions?: {
    thumbsUp?: boolean;
    thumbsDown?: boolean;
  };
}

const EXAMPLE_QUERIES = [
  "Show my upcoming bookings",
  "Find available football courts tomorrow",
  "What sports can I play at Grid2Play?",
  "How do I cancel a booking?"
];

export default function NewAIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`ai_chat_history_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })));
        } catch (e) {
          console.error("Failed to load chat history", e);
        }
      }
    }
  }, [user]);

  // Save to localStorage
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(`ai_chat_history_${user.id}`, JSON.stringify(messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))));
    }
  }, [messages, user]);

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(prev => `${prev} ${transcript}`.trim());
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      toast({
        title: "Voice input failed",
        description: event.error,
        variant: "destructive"
      });
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  // Auto welcome message
  useEffect(() => {
    if (isOpen && isFirstInteraction && messages.length === 0) {
      const welcome: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: user ?
          `Hello${user.user_metadata?.name ? ` ${user.user_metadata.name}` : ''}! How can I help you with sports bookings today?` :
          'Please sign in to use the chat assistant.',
        timestamp: new Date()
      };
      setMessages([welcome]);
      setIsFirstInteraction(false);
    }
  }, [isOpen, isFirstInteraction, user, messages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !user) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg]
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({ role, content }));

      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: chatHistory,
          userId: user.id
        }
      });

      if (error) throw error;

      const response = data?.message?.content || 'Sorry, I didn’t understand that.';
      const botReply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botReply]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, something went wrong.",
        timestamp: new Date()
      }]);

      toast({
        title: "Error",
        description: err.message || "Assistant failed to respond.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, messages, user]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice not supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleReaction = (id: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reaction]: !msg.reactions?.[reaction],
                [reaction === 'thumbsUp' ? 'thumbsDown' : 'thumbsUp']: false
              }
            }
          : msg
      )
    );
  };

  const formatContent = (text: string) => {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\b(tennis|football|basketball|badminton)\b/gi, '<span class="text-emerald-300">$1</span>')
      .replace(/\n/g, '<br />');

    return { __html: formatted };
  };

  if (!user) return null;

  return (
    <>
      <button
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full border-2 shadow-xl transition-all duration-300",
          "bg-black border-emerald-800 hover:bg-gray-900",
          isOpen ? "rotate-90" : "rotate-0"
        )}
        onClick={() => setIsOpen(prev => !prev)}
      >
        {isOpen ? <X className="h-6 w-6 text-emerald-400" /> : <MessageCircle className="h-6 w-6 text-emerald-400" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md bg-black border border-emerald-800 rounded-xl p-4 z-50 shadow-lg">
          <div className="h-96 overflow-y-auto pr-2 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn("text-sm", {
                'text-right text-emerald-100': msg.role === 'user',
                'text-left text-emerald-300': msg.role === 'assistant'
              })}>
                <div dangerouslySetInnerHTML={formatContent(msg.content)} />
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-1 text-xs">
                    <button onClick={() => handleReaction(msg.id, 'thumbsUp')}>
                      <ThumbsUp className={cn("w-4 h-4", msg.reactions?.thumbsUp && 'text-green-500')} />
                    </button>
                    <button onClick={() => handleReaction(msg.id, 'thumbsDown')}>
                      <ThumbsDown className={cn("w-4 h-4", msg.reactions?.thumbsDown && 'text-red-500')} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && renderExampleQueries(setInputMessage, inputRef)}

          <div className="mt-3 flex gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 p-2 rounded bg-gray-800 text-white text-sm resize-none"
              rows={1}
              placeholder="Ask something..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={toggleVoiceInput}>
              <Mic className={cn("w-4 h-4", isListening && 'text-red-500')} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function renderExampleQueries(setInputMessage: (val: string) => void, inputRef: React.RefObject<HTMLTextAreaElement>) {
  return (
    <div className="mt-4">
      <p className="text-sm text-emerald-400 mb-2">Try asking:</p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((query, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInputMessage(query);
              inputRef.current?.focus();
            }}
            className="bg-emerald-900/50 text-emerald-100 px-3 py-1 text-xs rounded-full border border-emerald-800 hover:bg-emerald-800/80"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
