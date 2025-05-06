import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Send, Loader2, CheckCircle, User, Mail } from 'lucide-react';
import { HelpRequest, UpdateHelpRequestStatusResult } from '@/types/help';

interface AdminHelpChatInterfaceProps {
  selectedRequestId: string;
  onMarkResolved: () => void;
  helpRequests: HelpRequest[];
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  sender_id: string;
  is_read: boolean;
}

export const AdminHelpChatInterface: React.FC<AdminHelpChatInterfaceProps> = ({ 
  selectedRequestId, 
  onMarkResolved,
  helpRequests
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the selected help request from the prop
  const selectedRequest = helpRequests.find(req => req.id === selectedRequestId);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedRequest) return;
      
      try {
        setLoading(true);
        
        // Fetch messages for this user (help messages have null venue_id)
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', selectedRequest.user_id)
          .is('venue_id', null)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark messages as read if they're not from the admin
        const unreadMessages = data?.filter(
          msg => !msg.is_read && msg.sender_id === msg.user_id
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id));
        }
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
    
    // Setup real-time subscription
    const channel = supabase
      .channel(`help_chat_${selectedRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${selectedRequest?.user_id}`,
        },
        (payload) => {
          // Only add messages with null venue_id (help messages)
          if (payload.new && !payload.new.venue_id) {
            setMessages(prev => [...prev, payload.new as Message]);
            
            // Mark message as read if it's from the user
            if (payload.new.sender_id === payload.new.user_id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', payload.new.id);
            }
            
            // Scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRequestId, selectedRequest]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !selectedRequest) return;
    
    setSending(true);
    try {
      // For admin replies, sender_id is admin's ID but user_id is the customer's ID
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          user_id: selectedRequest.user_id,  // This is the customer's ID
          sender_id: user.id,                // This is the admin's ID who is replying
          venue_id: null,                    // Help messages have null venue_id
          is_read: true                      // Admin messages are auto-read
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

  // Helper function to check if a message is from the admin
  const isAdminMessage = (message: Message) => {
    return message.sender_id !== message.user_id;
  };

  if (!selectedRequest) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>No help request selected</p>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="p-4 border-b bg-indigo/10 flex justify-between items-center">
        <div>
          <h2 className="font-semibold">{selectedRequest.subject}</h2>
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-3 w-3 mr-1" />
            <span>{selectedRequest.user_name}</span>
            {selectedRequest.user_email && (
              <>
                <span className="mx-1">•</span>
                <Mail className="h-3 w-3 mr-1" />
                <span>{selectedRequest.user_email}</span>
              </>
            )}
          </div>
        </div>
        
        {selectedRequest.status !== 'resolved' && (
          <Button
            onClick={onMarkResolved}
            variant="outline"
            className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark Resolved
          </Button>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-indigo" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet in this conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div 
                className={`p-3 rounded-lg max-w-[85%] ${
                  isAdminMessage(message) 
                    ? 'bg-indigo text-white self-end' 
                    : 'bg-indigo-light/10 self-start'
                }`}
              >
                <p className={isAdminMessage(message) ? 'text-white' : 'text-gray-800'}>
                  {message.content}
                </p>
                <span className={`text-xs mt-1 block ${
                  isAdminMessage(message) ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {isAdminMessage(message) ? 'You' : selectedRequest.user_name} • {formatDate(message.created_at)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-grow border rounded-l-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo"
            disabled={sending || selectedRequest.status === 'resolved'}
          />
          <Button 
            type="submit" 
            className="bg-indigo hover:bg-indigo-dark rounded-l-none"
            disabled={sending || !newMessage.trim() || selectedRequest.status === 'resolved'}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {selectedRequest.status === 'resolved' && (
          <p className="text-sm text-yellow-600 mt-2">
            This request is marked as resolved. To continue the conversation, mark it as pending.
          </p>
        )}
      </form>
    </>
  );
};
