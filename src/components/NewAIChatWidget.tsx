import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send, Mic, ThumbsUp, ThumbsDown, User, Bot, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

interface NewAIChatWidgetProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const NewAIChatWidget: React.FC<NewAIChatWidgetProps> = ({ isOpen: isOpenProp, setIsOpen: setIsOpenProp }) => {
  const [isOpenState, setIsOpenState] = useState(false);
  const isOpen = typeof isOpenProp === 'boolean' ? isOpenProp : isOpenState;
  const setIsOpen = setIsOpenProp || setIsOpenState;
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
  const navigate = useNavigate();

  // Detect mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile, isOpen]);

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

  // When user changes (logout/login), reset chat state and clear localStorage for previous user
  useEffect(() => {
    setMessages([]);
    setIsFirstInteraction(true);
    setInputMessage('');
    // Remove all ai_chat_history_* keys from localStorage if user logs out
    if (!user) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ai_chat_history_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [user]);

  // Load conversation history from localStorage and check for analytics consent
  useEffect(() => {
    if (user) {
      // Only load chat history for the current user, not previous users
      const savedChat = localStorage.getItem(`ai_chat_history_${user.id}`);
      const savedConsent = localStorage.getItem(`ai_chat_consent_${user.id}`);
      if (savedConsent !== null) {
        setConsentGiven(savedConsent === 'true');
      }
      // Always start with a fresh welcome message for new user session
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: user ? `Hello${user.user_metadata?.name ? ' ' + user.user_metadata.name : ''}! How can I help you with sports bookings today?` : 'Please sign in to use the chat assistant.',
          timestamp: new Date()
        }
      ]);
      setIsFirstInteraction(false);
      setInputMessage('');
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
      inputRef.current.focus();
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
    // Enhanced formatting with markdown support
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
      .replace(/```([^`]+)```/g, '<pre class="bg-gray-800/50 p-2 rounded my-1 overflow-x-auto"><code>$1</code></pre>') // Code blocks
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800/50 px-1 rounded">$1</code>') // Inline code
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline">$1</a>') // Links
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

  // Only render the chat widget on mobile if isOpen is true
  if (isMobile && !isOpen) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-xl z-50",
          "flex items-center justify-center group",
          "bg-gradient-to-r from-emerald-600 to-emerald-500",
          "border-2 border-emerald-400/20",
          "hover:shadow-emerald-500/20 hover:shadow-lg",
          "transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2",
          isOpen ? "rotate-90" : "rotate-0"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </motion.button>

      <motion.div
        initial={false}
        animate={isOpen ? {
          scale: 1,
          opacity: 1,
          y: 0,
        } : {
          scale: 0.95,
          opacity: 0,
          y: 20,
        }}
        className={cn(
          isMobile
            ? "fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-black border-emerald-500/20"
            : "fixed bottom-24 right-6 w-[90vw] sm:w-[400px] max-h-[600px] rounded-2xl shadow-2xl z-40 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black border border-emerald-500/20",
          !isOpen && "pointer-events-none"
        )}
        style={isMobile ? { maxHeight: "100dvh", height: "100dvh" } : {}}
      >
        {/* Mobile Back Button */}
        {isMobile && isOpen && (
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/');
            }}
            className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700/90 text-white font-semibold shadow-lg hover:bg-emerald-800 transition-all"
            style={{ fontSize: 16 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}

        <div className="p-4 border-b border-emerald-800/30 bg-gradient-to-r from-emerald-900/20 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2 rounded-full bg-emerald-900/30 border border-emerald-800/50">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-gray-900" />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Grid2Play Assistant
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-emerald-400">
                    Active
                  </span>
                </h3>
                <p className="text-xs text-emerald-300/80">Smart Booking Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-emerald-400"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-gray-900/50 to-black/50">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "mb-4 max-w-[80%] group",
                  message.role === "user" ? "self-end ml-auto" : "self-start mr-auto"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.role === "user" ? (
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-1.5 rounded-full bg-emerald-900/50 border border-emerald-700/50">
                        <User className="h-3 w-3 text-emerald-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-1.5 rounded-full bg-gray-800/50 border border-gray-700/50">
                        <Bot className="h-3 w-3 text-gray-300" />
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl p-4 shadow-lg relative group",
                      "transition-all duration-200",
                      message.role === "user"
                        ? "bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 text-white"
                        : "bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100",
                      "border border-opacity-20 hover:border-opacity-40",
                      message.role === "user"
                        ? "border-emerald-400"
                        : "border-gray-500"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.timestamp && (
                      <div className={cn(
                        "text-xs mt-2 opacity-60",
                        message.role === "user" ? "text-emerald-200" : "text-gray-400"
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    {message.role === 'assistant' && (
                      <div className="absolute -bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-gray-800/80 hover:bg-emerald-900/80"
                          onClick={() => handleReaction(message.id, 'thumbsUp')}
                        >
                          <ThumbsUp className={cn(
                            "h-3 w-3",
                            message.reactions?.thumbsUp ? "text-emerald-400" : "text-gray-400"
                          )} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-gray-800/80 hover:bg-red-900/80"
                          onClick={() => handleReaction(message.id, 'thumbsDown')}
                        >
                          <ThumbsDown className={cn(
                            "h-3 w-3",
                            message.reactions?.thumbsDown ? "text-red-400" : "text-gray-400"
                          )} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start mr-auto mb-4"
            >
              <div className="bg-gray-800/80 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-emerald-400"
                    />
                  </div>
                  <span className="text-sm text-emerald-400 font-medium">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-emerald-800/30 p-4 bg-gradient-to-t from-black to-gray-900/80 backdrop-blur-sm">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleVoiceInput}
              className={cn(
                "h-[44px] w-[44px] rounded-xl",
                "bg-gray-800/80 text-gray-400 border-gray-700/50",
                "hover:bg-emerald-900/50 hover:text-emerald-400 hover:border-emerald-700/50",
                isListening && "animate-pulse bg-red-900/50 text-red-400 border-red-700/50"
              )}
            >
              <Mic className="h-5 w-5" />
            </Button>

            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                className={cn(
                  "w-full resize-none rounded-xl px-4 py-3 h-[44px] max-h-[120px]",
                  "bg-gray-800/80 text-white placeholder-gray-500",
                  "border border-gray-700/50",
                  "focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none",
                  "transition-all duration-200"
                )}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading || !user || isSessionExpired}
                rows={1}
              />
              <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                {inputMessage.length}/500
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !user || isSessionExpired}
              className={cn(
                "h-[44px] w-[44px] rounded-xl",
                "bg-gradient-to-r from-emerald-600 to-emerald-500",
                "text-white border-none",
                "hover:opacity-90 disabled:opacity-50",
                "transition-all duration-200"
              )}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {isSessionExpired && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-center"
            >
              <Button
                variant="link"
                onClick={() => window.location.reload()}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Session expired. Click here to refresh and log in again.
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default NewAIChatWidget;
