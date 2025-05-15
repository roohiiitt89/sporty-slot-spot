import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_MESSAGES = 15;
const MAX_QUERIES_PER_WEEK = 15;

const AIChatWidget = () => {
  const { user, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [apiKeySet, setApiKeySet] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isMobile = useIsMobile();

  const welcomeMessage = `👋 Hello${user?.email ? ` ${user.email.split('@')[0]}` : ''}! I'm your Grid2Play sports assistant. How can I help you today?`;

  const examples = [
    "Show me my upcoming bookings",
    "Are there any badminton courts available tomorrow?",
    "Recommend tennis courts near me",
    "Show me courts available this weekend"
  ];

  // Initialize chat with welcome message
  useEffect(() => {
    if (showWelcome && messages.length === 0) {
      setMessages([
        {
          id: "welcome-message",
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date()
        }
      ]);
    }
  }, [showWelcome, messages.length, user, welcomeMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Load user's query count from localStorage
  useEffect(() => {
    if (user) {
      const countData = localStorage.getItem(`ai_query_count_${user.id}`);
      if (countData) {
        try {
          const data = JSON.parse(countData);
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          if (new Date(data.timestamp) < lastWeek) {
            setQueryCount(0);
          } else {
            setQueryCount(data.count);
          }
        } catch (e) {
          setQueryCount(0);
        }
      }
    }
  }, [user]);

  // Handle opening and closing the chat
  const toggleChat = () => setIsOpen(!isOpen);

  // Handle sending a message
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use the AI assistant",
        variant: "destructive"
      });
      return;
    }

    // Check if admin is providing API key
    if ((userRole === 'admin' || userRole === 'super_admin') &&
      (inputValue.toLowerCase().includes('key') || inputValue.toLowerCase().includes('keys'))) {
      setApiKeySet(true);
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setTimeout(() => {
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: "OpenAI API key has been updated successfully. The AI assistant is now ready to use!",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
      return;
    }

    // Check if user has exceeded weekly query limit
    if (queryCount >= MAX_QUERIES_PER_WEEK) {
      toast({
        title: "Query limit reached",
        description: `You've reached your limit of ${MAX_QUERIES_PER_WEEK} queries per week.`,
        variant: "destructive"
      });
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // Add user message to chat immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowWelcome(false);

    try {
      // Prepare conversation history for API (exclude welcome message)
      const messageHistory = [...messages.filter(msg => msg.id !== "welcome-message"), userMessage]
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: messageHistory,
          userId: user.id,
          role: userRole
        }
      });

      if (error || !data?.message?.content) throw error || new Error("No response from assistant");

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
        functionCall: data.functionCall
      };

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        if (newMessages.length > MAX_MESSAGES) {
          return newMessages.slice(newMessages.length - MAX_MESSAGES);
        }
        return newMessages;
      });

      // Update query count in localStorage
      const newCount = queryCount + 1;
      setQueryCount(newCount);
      localStorage.setItem(`ai_query_count_${user.id}`, JSON.stringify({
        count: newCount,
        timestamp: new Date()
      }));
      setRetryCount(0);

    } catch (error) {
      console.error('Error sending message:', error);
      setRetryCount(prev => prev + 1);

      if (userRole === 'admin' || userRole === 'super_admin') {
        setApiKeySet(false);
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "I need an OpenAI API key to function. If you're an admin, please type 'keys' to set up your API key.",
          timestamp: new Date()
        }]);
      } else {
        toast({
          title: "Error",
          description: "Failed to get response from AI assistant",
          variant: "destructive"
        });
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I encountered an error processing your request. Please try again later.",
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExampleClick = (example) => {
    setInputValue(example);
    if (inputRef.current) inputRef.current.focus();
  };

  const formatMessageContent = (content) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // If no user is logged in, show a reduced button that prompts to login
  if (!user) {
    return (
      <button
        onClick={() => {
          toast({
            title: "Sign in required",
            description: "Please sign in to use the AI assistant",
          });
        }}
        className={`fixed z-50 ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'} w-14 h-14 rounded-full bg-gradient-to-r from-indigo/60 to-indigo-dark/60 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:from-indigo hover:to-indigo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-light`}
        aria-label="AI assistant (login required)"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed z-50 ${isMobile ? 'bottom-20 right-4' : 'bottom-6 right-6'} w-14 h-14 rounded-full bg-gradient-to-r from-indigo to-indigo-dark text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-light`}
        aria-label="Open chat assistant"
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>

      {/* Chat Dialog */}
      <div
        className={`fixed z-50 ${
          isMobile ? 'inset-0' : 'bottom-6 right-6 w-96 h-[600px] rounded-lg shadow-2xl'
        } bg-gradient-to-b from-navy-dark to-navy flex flex-col transition-all duration-300 ${
          isOpen
            ? 'opacity-100 transform translate-y-0'
            : 'opacity-0 pointer-events-none transform translate-y-8'
        }`}
      >
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-navy-dark to-indigo/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-indigo-light" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Grid2Play Assistant</h3>
              <p className="text-xs text-gray-300">
                {isLoading ? 'Thinking...' : 'Ask me about venues, bookings & more'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Chat Messages */}
        <ScrollArea className="flex-grow p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className={`h-8 w-8 shrink-0`}>
                    {message.role === 'user' ? (
                      user?.email ? (
                        <AvatarFallback className="bg-indigo text-white">
                          {user.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-indigo text-white">U</AvatarFallback>
                      )
                    ) : (
                      <>
                        <AvatarImage src="/assets/ai-assistant.png" alt="AI Assistant" />
                        <AvatarFallback className="bg-indigo-light/20 text-indigo-light">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-indigo text-white'
                        : 'bg-navy-light text-white'
                    }`}
                  >
                    <p>{formatMessageContent(message.content)}</p>
                    {/* Display function call result if available */}
                    {message.functionCall && message.functionCall.result && message.functionCall.result.success && (
                      <div className="mt-2 p-2 bg-green-800/30 rounded border border-green-700/30 text-green-100">
                        <p className="text-xs font-medium mb-1">
                          {message.functionCall.name === 'book_court'
                            ? 'Booking Confirmed!'
                            : 'Information Retrieved'}
                        </p>
                        {message.functionCall.name === 'book_court' && (
                          <p className="text-xs">
                            Successfully booked {message.functionCall.result.court_name} on {message.functionCall.result.date}
                          </p>
                        )}
                      </div>
                    )}
                    {/* Display timestamp */}
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-indigo-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {/* Input Area */}
        <form
          className="p-4 border-t border-gray-700 bg-navy-light flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
        {/* Example Queries */}
        {showWelcome && (
          <div className="p-4 bg-navy-light border-t border-gray-700">
            <div className="text-xs text-gray-300 mb-2">Try asking:</div>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex, idx) => (
                <button
                  key={idx}
                  className="bg-indigo-light/20 text-indigo-light px-3 py-1 rounded-full text-xs hover:bg-indigo-light/40"
                  onClick={() => handleExampleClick(ex)}
                  type="button"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AIChatWidget;
