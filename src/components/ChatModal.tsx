
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Send, X, Loader2 } from 'lucide-react';

interface ChatModalProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  sender_id: string;
  is_read: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ venueId, venueName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages on load and subscribe to new messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !venueId) return;

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('venue_id', venueId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          // Only add the message if it's for the current user
          if (payload.new.user_id === user?.id) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [venueId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !venueId) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          user_id: user.id,
          sender_id: user.id, // User is sending their own message
          venue_id: venueId,
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  // Helper function to check if a message is from the venue admin
  const isAdminMessage = (message: Message) => {
    return message.sender_id !== message.user_id;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-indigo text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">Chat with {venueName}</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin h-8 w-8 text-indigo" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div 
                  className={`p-3 rounded-lg max-w-[85%] ${
                    isAdminMessage(message) 
                      ? 'bg-indigo text-white self-start' 
                      : 'bg-indigo-light/10 self-end'
                  }`}
                >
                  <p className={isAdminMessage(message) ? 'text-white' : 'text-gray-800'}>
                    {message.content}
                  </p>
                  <span className={`text-xs mt-1 block ${
                    isAdminMessage(message) ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {isAdminMessage(message) ? venueName : 'You'} • {formatDate(message.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo"
              disabled={sending}
            />
            <Button 
              type="submit" 
              className="bg-indigo hover:bg-indigo-dark rounded-l-none"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
