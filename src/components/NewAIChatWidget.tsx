
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Define message types
type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

const NewAIChatWidget = () => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  
  // Authentication and user context
  const { user, userRole } = useAuth();
  
  // Refs for managing scroll and focus
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Welcome message setup
  useEffect(() => {
    if (isOpen && isFirstInteraction && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: user ? 
            `Hello${user ? ' ' + (user.user_metadata?.name || '') : ''}! How can I help you with sports bookings today?` : 
            'Please sign in to use the chat assistant.',
          timestamp: new Date()
        }
      ]);
      setIsFirstInteraction(false);
    }
  }, [isOpen, isFirstInteraction, user, messages.length]);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle sending messages
  const handleSendMessage = async () => {
    // Validate input and authentication
    if (!inputMessage.trim() || !user) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Prepare the messages for the API call
      const messageHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({ role, content }));
      
      // Add the new user message
      messageHistory.push({ role: 'user', content: userMessage.content });
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { 
          messages: messageHistory,
          userId: user.id
        }
      });
      
      if (error) {
        console.error("Error calling chat-assistant function:", error);
        throw new Error(error.message || "Failed to get response from assistant");
      }
      
      // Add assistant response to chat
      if (data && data.message) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response format from assistant");
      }
    } catch (error: any) {
      console.error("Chat assistant error:", error);
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date()
      }]);
      
      // Show error toast
      toast({
        title: "Chat Error",
        description: error.message || "Failed to communicate with the assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input keypress for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render example queries for first-time users
  const renderExampleQueries = () => {
    const examples = [
      "Show my upcoming bookings",
      "Find available football courts tomorrow",
      "What sports can I play at Grid2Play?",
      "How do I cancel a booking?"
    ];

    return (
      <div className="flex flex-col gap-2 mb-4">
        <p className="text-sm text-muted-foreground">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              className="text-xs bg-accent px-3 py-1 rounded-full hover:bg-accent/80 transition-colors"
              onClick={() => {
                setInputMessage(example);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // If user is not logged in, don't render the widget
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Chat toggle button */}
      <Button
        className={cn(
          "fixed bottom-4 right-4 rounded-full size-14 p-0 shadow-lg z-50",
          isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </Button>

      {/* Chat dialog */}
      <div 
        className={cn(
          "fixed bottom-24 right-4 w-[90vw] sm:w-[400px] max-h-[600px] bg-background rounded-lg shadow-xl z-40 border overflow-hidden transition-all duration-300 ease-in-out",
          isOpen 
            ? "scale-100 opacity-100 translate-y-0" 
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Chat header */}
        <div className="p-4 border-b bg-primary text-primary-foreground">
          <h3 className="font-semibold">Grid2Play Assistant</h3>
          <p className="text-xs opacity-80">Ask about bookings, venues, and sports</p>
        </div>

        {/* Messages container */}
        <div className="flex flex-col h-[400px] overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="mb-4">How can I help with your sports bookings?</p>
                {renderExampleQueries()}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4 max-w-[80%]",
                  message.role === "user" 
                    ? "self-end ml-auto" 
                    : "self-start mr-auto"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg p-3",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
                {message.timestamp && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="self-start mr-auto mb-4">
              <div className="bg-muted rounded-lg p-3 flex items-center">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '600ms' }}></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input area */}
        <div className="border-t p-4 bg-background">
          {messages.length === 0 && renderExampleQueries()}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              className="flex-1 resize-none border rounded-md px-3 py-2 h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || !user}
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !user}
              className="h-[40px] px-3"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewAIChatWidget;
