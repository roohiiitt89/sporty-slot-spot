
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Define message types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export function useChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Send a message to the chat assistant
  const sendMessage = async (content: string): Promise<ChatMessage | null> => {
    if (!content.trim() || !user) {
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to use the chat assistant",
          variant: "destructive"
        });
      }
      return null;
    }
    
    // Create the user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    // Add to messages
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Prepare the messages for the API call
      const messageHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({ role, content }));
      
      // Add the new user message
      messageHistory.push({ role: 'user', content: userMessage.content });
      
      console.log('Sending message to chat assistant:', {
        messages: messageHistory,
        userId: user.id
      });
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { 
          messages: messageHistory,
          userId: user.id
        }
      });
      
      console.log('Response from chat assistant:', data, error);
      
      if (error) {
        console.error("Error calling chat-assistant function:", error);
        throw new Error(error.message || "Failed to get response from assistant");
      }
      
      // Process the assistant's response
      if (data && data.message) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        return assistantMessage;
      } else {
        throw new Error("Invalid response format from assistant");
      }
    } catch (error: any) {
      console.error("Chat assistant error:", error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to communicate with the assistant",
        variant: "destructive"
      });
      
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    isAuthenticated: !!user
  };
}
