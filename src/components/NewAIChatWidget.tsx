import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send, Mic, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react';
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

const NewAIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const { user, userRole, isSessionExpired, logout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [windowHeight, setWindowHeight] = useState<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);



   // Add touch event handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (chatContainerRef.current) {
      setIsDragging(true);
      setStartY(e.touches[0].pageY);
      setScrollTop(chatContainerRef.current.scrollTop);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !chatContainerRef.current) return;
    const y = e.touches[0].pageY;
    const walk = (y - startY) * 1.5; // Adjust scroll speed
    chatContainerRef.current.scrollTop = scrollTop - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };




  // Track window height changes for mobile keyboard
  useEffect(() => {
    const updateWindowHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateWindowHeight);
    updateWindowHeight();

    return () => {
      window.removeEventListener('resize', updateWindowHeight);
    };
  }, []);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Request notification permission if needed
  const requestNotificationPermission = async () => {
    if ('Notification' in window && notificationPermission !== 'granted') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return notificationPermission === 'granted';
  };

  // Show notification when new message arrives and tab is not active
  const showNotification = (message: string) => {
    if (document.hidden && notificationPermission === 'granted') {
      new Notification('Grid2Play Assistant', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  // Check for session expiration
  useEffect(() => {
    if (isSessionExpired && isOpen) {
      setMessages(prev => [...prev, {
        id: 'session-expired-' + Date.now(),
        role: 'assistant',
        content: "Your session has expired. Please log in again to continue chatting.",
        timestamp: new Date()
      }]);
    }
  }, [isSessionExpired, isOpen]);

  // Load conversation history from localStorage and check for analytics consent
  useEffect(() => {
    if (user) {
      const savedChat = localStorage.getItem(`ai_chat_history_${user.id}`);
      const savedConsent = localStorage.getItem(`ai_chat_consent_${user.id}`);
      
      if (savedConsent !== null) {
        setConsentGiven(savedConsent === 'true');
      }

      if (savedChat) {
        try {
          const parsedChat = JSON.parse(savedChat);
          setMessages(parsedChat.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
  }, [user]);

  // Save conversation history to localStorage
  useEffect(() => {
    if (user && messages.length > 0) {
      localStorage.setItem(
        `ai_chat_history_${user.id}`,
        JSON.stringify(messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })))
      );

      // Send anonymized logs to backend if consent given
      if (consentGiven) {
        sendAnonymizedLogs();
      }
    }
  }, [messages, user, consentGiven]);

  // Send anonymized chat logs to backend
  const sendAnonymizedLogs = async () => {
    try {
      const logs = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        reactions: msg.reactions
      }));

      await supabase.functions.invoke('log-chat-analytics', {
        body: {
          userId: user?.id, // Still tracked but anonymized in backend processing
          messages: logs,
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error("Failed to send analytics", error);
    }
  };

  // Initialize voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(prev => prev + ' ' + transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast({
            title: "Voice input failed",
            description: event.error,
            variant: "destructive"
          });
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Welcome message setup
  useEffect(() => {
    if (isOpen && isFirstInteraction && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: user ? 
          `Hello${user.user_metadata?.name ? ' ' + user.user_metadata.name : ''}! How can I help you with sports bookings today?` : 
          'Please sign in to use the chat assistant.',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setIsFirstInteraction(false);

      // Show analytics consent prompt if not already set
      if (user && consentGiven === null) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'consent-prompt-' + Date.now(),
            role: 'assistant',
            content: "To help improve our service, may we use anonymized chat data for quality improvement? This won't include personal information.",
            timestamp: new Date()
          }]);
        }, 1500);
      }
    }
  }, [isOpen, isFirstInteraction, user, messages.length, consentGiven]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle tab visibility changes for notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && messages.length > 0) {
        document.title = "Grid2Play Assistant";
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [messages]);

  // Mobile keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Handle body scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }

    return () => {
      document.body.classList.remove('chat-open');
    };
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (isSessionExpired) {
      toast({
        title: "Session Expired",
        description: "Please log in again to continue chatting",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not Signed In",
        description: "Please sign in to use the chat assistant",
        variant: "destructive"
      });
      return;
    }
    
    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const messageHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({ role, content }));
      
      messageHistory.push({ role: 'user', content: userMessage.content });
      
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { 
          messages: messageHistory,
          userId: user.id,
          context: {
            userRole,
            previousMessages: messages.slice(-10) // Send last 10 messages for context
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.message) {
        const assistantMessage: ChatMessage = {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Show notification if tab is not active
        if (document.hidden) {
          const canNotify = await requestNotificationPermission();
          if (canNotify) {
            showNotification(data.message.content.substring(0, 100));
          } else {
            document.title = "New message! - Grid2Play Assistant";
          }
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date()
      }]);
      
      toast({
        title: "Chat Error",
        description: error.message || "Failed to communicate with assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition",
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

  const handleReaction = (messageId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          reactions: {
            ...msg.reactions,
            [reaction]: !msg.reactions?.[reaction],
            [reaction === 'thumbsUp' ? 'thumbsDown' : 'thumbsUp']: false
          }
        };
      }
      return msg;
    }));

    // Send feedback to backend
    supabase.functions.invoke('chat-feedback', {
      body: {
        messageId,
        reaction,
        userId: user?.id
      }
    }).catch(console.error);
  };

  const handleConsent = (given: boolean) => {
    setConsentGiven(given);
    if (user) {
      localStorage.setItem(`ai_chat_consent_${user.id}`, String(given));
    }
    setMessages(prev => [...prev, {
      id: 'consent-response-' + Date.now(),
      role: 'user',
      content: given ? "Yes, I agree" : "No, I don't agree",
      timestamp: new Date()
    }]);
  };

  const formatMessageContent = (content: string) => {
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-800/50 p-2 rounded my-1 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800/50 px-1 rounded">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">$1</a>')
      .replace(/\b(tennis|football|basketball|badminton)\b/gi, '<span class="text-emerald-300">$1</span>')
      .replace(/\n/g, '<br />');

    return { __html: formatted };
  };

  const renderExampleQueries = () => {
    const examples = [
      "Show my upcoming bookings",
      "Find available football courts tomorrow",
      "What sports can I play at Grid2Play?",
      "How do I cancel a booking?"
    ];

    return (
      <div className="flex flex-col gap-2 mb-4">
        <p className="text-sm text-emerald-300">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              className="text-xs bg-emerald-900/50 text-emerald-100 px-3 py-1 rounded-full hover:bg-emerald-800/80 transition-colors border border-emerald-800/30"
              onClick={() => {
                setInputMessage(example);
                inputRef.current?.focus();
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderConsentButtons = () => {
    return (
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => handleConsent(true)}
          className="text-xs bg-emerald-800/50 text-emerald-100 px-3 py-1 rounded hover:bg-emerald-700/80 transition-colors border border-emerald-700/30"
        >
          Yes, I agree
        </button>
        <button
          onClick={() => handleConsent(false)}
          className="text-xs bg-gray-800/50 text-gray-100 px-3 py-1 rounded hover:bg-gray-700/80 transition-colors border border-gray-700/30"
        >
          No, thanks
        </button>
      </div>
    );
  };

  if (!user) return null;

  return (
    <>
      <button
        className={cn(
          "fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-xl z-50 flex items-center justify-center",
          "bg-black border-2 border-emerald-800 hover:bg-gray-900 transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-black",
          isOpen ? "rotate-90" : "rotate-0"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-emerald-400" />
        ) : (
          <MessageCircle className="h-6 w-6 text-emerald-400" />
        )}
        {isLoading && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </button>

      <div 
        className={cn(
          "fixed bottom-24 right-6 w-[90vw] sm:w-[400px] rounded-lg shadow-2xl z-40 border overflow-hidden transition-all duration-300 ease-in-out",
          "bg-gray-900 border-emerald-800/30 backdrop-blur-sm",
          isOpen 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{
          maxHeight: `calc(${windowHeight}px - 180px)`,
          height: isOpen ? 'auto' : undefined,
          touchAction: 'manipulation'
        }}
      >
        <div className="p-4 border-b border-emerald-800/30 bg-gradient-to-r from-black to-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-900/30 border border-emerald-800/50">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Grid2Play Assistant</h3>
              <p className="text-xs text-emerald-300/80">Ask about bookings, venues, and sports</p>
            </div>
          </div>
        </div>

        <div 
          className="flex flex-col overflow-y-auto p-4 bg-gradient-to-b from-gray-900/80 to-gray-900"
          style={{
            maxHeight: 'calc(100% - 120px)',
            height: 'auto',
            overflowAnchor: 'none'
          }}
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-emerald-300/70">
              <div className="text-center">
                <p className="mb-4 text-lg font-medium">How can I help with your sports bookings?</p>
                {renderExampleQueries()}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "mb-4 max-w-[80%] animate-fade-in",
                  message.role === "user" 
                    ? "self-end ml-auto" 
                    : "self-start mr-auto"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.role === "user" ? (
                    <div className="flex-shrink-0 mt-1 p-1 rounded-full bg-emerald-800/50 border border-emerald-700/50">
                      <User className="h-3 w-3 text-emerald-300" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 mt-1 p-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                      <Bot className="h-3 w-3 text-gray-300" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3 shadow-sm relative group",
                      "transition-all duration-200",
                      message.role === "user" 
                        ? "bg-emerald-800/90 text-white border border-emerald-700/50" 
                        : "bg-gray-800/90 text-gray-100 border border-gray-700/50"
                    )}
                  >
                    <div 
                      className="whitespace-pre-wrap [&>strong]:font-bold [&>em]:italic [&>span]:font-medium [&>a]:underline [&>pre]:overflow-x-auto"
                      dangerouslySetInnerHTML={formatMessageContent(message.content)}
                    />
                    
                    {message.timestamp && (
                      <div className={cn(
                        "text-xs mt-1 text-right",
                        message.role === "user" ? "text-emerald-200/70" : "text-gray-400"
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    {message.role === 'assistant' && (
                      <div className="absolute -bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleReaction(message.id, 'thumbsUp')}
                          className={cn(
                            "p-1 rounded-full bg-gray-800/80 border border-gray-700/50",
                            "hover:bg-emerald-800/50 hover:border-emerald-700/50",
                            message.reactions?.thumbsUp ? "text-emerald-400" : "text-gray-400"
                          )}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleReaction(message.id, 'thumbsDown')}
                          className={cn(
                            "p-1 rounded-full bg-gray-800/80 border border-gray-700/50",
                            "hover:bg-red-800/50 hover:border-red-700/50",
                            message.reactions?.thumbsDown ? "text-red-400" : "text-gray-400"
                          )}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {message.id.includes('consent-prompt') && renderConsentButtons()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="self-start mr-auto mb-4">
              <div className="bg-gray-800/80 rounded-lg p-3 border border-gray-700/50 flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-emerald-300">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div 
          className="border-t border-emerald-800/30 p-4 bg-gray-900/80 backdrop-blur-sm sticky bottom-0"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
          }}
        >
          {messages.length === 0 && renderExampleQueries()}
          <div className="flex gap-2">
            <button
              onClick={toggleVoiceInput}
              className={cn(
                "h-[44px] w-[44px] rounded-lg flex items-center justify-center transition-all",
                "bg-gray-800/80 text-gray-400 border border-gray-700/50",
                "hover:bg-gray-700/80 hover:text-white",
                isListening ? "animate-pulse bg-red-800/50 text-red-400" : ""
              )}
            >
              <Mic className="h-5 w-5" />
            </button>
            <textarea
              ref={inputRef}
              className={cn(
                "flex-1 resize-none rounded-lg px-4 py-3 h-[44px] max-h-[120px] focus:outline-none",
                "bg-gray-800/80 text-white placeholder-gray-500 border border-gray-700/50",
                "focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/30 transition-all"
              )}
              placeholder={isListening ? "Listening..." : "Type your message..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={() => {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
              disabled={isLoading || !user || isSessionExpired}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !user || isSessionExpired}
              className={cn(
                "h-[44px] w-[44px] rounded-lg flex items-center justify-center transition-all",
                "bg-emerald-800/90 text-emerald-100 border border-emerald-700/50",
                "hover:bg-emerald-700/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-gray-900"
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {isSessionExpired && (
            <div className="mt-2 text-center">
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-emerald-400 hover:underline"
              >
                Session expired. Click here to refresh and log in again.
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NewAIChatWidget;
