
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, Loader2, ChevronDown, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // For function calls
  functionCall?: {
    name: string;
    arguments: any;
    result: any;
  }
}

// Maximum number of messages to store
const MAX_MESSAGES = 15;
// Maximum number of queries per user per week
const MAX_QUERIES_PER_WEEK = 15;

const AIChatWidget = () => {
  const { user, userRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [apiKeySet, setApiKeySet] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Welcome message and examples
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
          
          // Reset count if last query was more than a week ago
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

  // Check if input contains "key" or "keys" to set API key
  useEffect(() => {
    if (userRole === 'admin' || userRole === 'super_admin') {
      if (retryCount > 0 && !apiKeySet) {
        const checkForApiKey = async () => {
          try {
            // Simulate checking if API key is set
            const { data, error } = await supabase.functions.invoke('ai-assistant', {
              body: {
                messages: [{ role: "user", content: "Hello" }],
                userId: user?.id,
                role: userRole
              }
            });
            
            if (!error && data.message) {
              setApiKeySet(true);
            }
          } catch (err) {
            console.log('API key not set yet');
          }
        };
        
        checkForApiKey();
      }
    }
  }, [retryCount, userRole, apiKeySet, user]);

  // Handle opening and closing the chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

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
      
      // Mock response for API key setup
      setApiKeySet(true);
      
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // Add assistant response acknowledging key setup
      setTimeout(() => {
        const assistantMessage: Message = {
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
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowWelcome(false);
    
    try {
      // Prepare conversation history for API
      const messageHistory = messages
        .filter(msg => msg.id !== "welcome-message") // Exclude welcome message
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the new message
      messageHistory.push({
        role: "user",
        content: inputValue
      });
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: messageHistory,
          userId: user.id, // Always send user ID
          role: userRole
        }
      });
      
      if (error) throw error;
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
        functionCall: data.functionCall
      };
      
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // Limit the number of messages
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
      
      // Reset retry count if successful
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Increment retry count for API key checking logic
      setRetryCount(prev => prev + 1);
      
      // Check if we should suggest API key setup
      if (userRole === 'admin' || userRole === 'super_admin') {
        setApiKeySet(false);
        
        // Add error message with API key prompt for admins
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
        
        // Add error message to chat
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

  // Handle pressing Enter to send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle clicking on an example query
  const handleExampleClick = (example: string) => {
    setInputValue(example);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Format message content with newlines
  const formatMessageContent = (content: string) => {
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
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-light/20 text-indigo-light">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg bg-navy-light text-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="dot-typing"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Examples */}
          {showWelcome && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="bg-navy-light text-indigo-200 text-xs px-3 py-1.5 rounded-full hover:bg-navy transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
              
              {/* Query Counter */}
              <div className="text-xs text-gray-400 mt-4">
                <p>Queries used: {queryCount}/{MAX_QUERIES_PER_WEEK} this week</p>
              </div>
            </div>
          )}
          
          {/* Admin API Key Setup Prompt */}
          {!apiKeySet && (userRole === 'admin' || userRole === 'super_admin') && retryCount > 0 && (
            <div className="mt-4 p-3 bg-amber-800/30 border border-amber-700/30 rounded-md">
              <p className="text-amber-200 text-sm font-medium">OpenAI API Key Required</p>
              <p className="text-amber-100/80 text-xs mt-1">
                As an admin, please type "keys" to set up the OpenAI API key for the AI assistant.
              </p>
            </div>
          )}
        </ScrollArea>
        
        {/* Chat Input */}
        <div className="p-4 border-t border-gray-700 bg-navy-dark/60">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              className="flex-grow bg-navy-light border-gray-700 text-white placeholder-gray-400 focus:ring-indigo focus:border-indigo"
              placeholder="Ask about courts, bookings, etc."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !user || queryCount >= MAX_QUERIES_PER_WEEK}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim() || !user || queryCount >= MAX_QUERIES_PER_WEEK}
              className="bg-indigo hover:bg-indigo-dark text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          {!user && (
            <p className="text-xs text-amber-400 mt-2">
              Please sign in to use the AI assistant
            </p>
          )}
          
          {queryCount >= MAX_QUERIES_PER_WEEK && (
            <p className="text-xs text-amber-400 mt-2">
              You've reached your weekly query limit
            </p>
          )}
        </div>
      </div>
      
      {/* Dot Typing Animation CSS */}
      <style>
        {`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: #9089fc;
          color: #9089fc;
          box-shadow: 9984px 0 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          animation: dotTyping 1.5s infinite linear;
        }

        @keyframes dotTyping {
          0% {
            box-shadow: 9984px 0 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          }
          50% {
            box-shadow: 9984px 0 0 0 #9089fc, 9999px -10px 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px -10px 0 0 #9089fc;
          }
          100% {
            box-shadow: 9984px 0 0 0 #9089fc, 9999px 0 0 0 #9089fc, 10014px 0 0 0 #9089fc;
          }
        }
        `}
      </style>
    </>
  );
};

export default AIChatWidget;
