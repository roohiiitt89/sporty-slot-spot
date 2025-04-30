
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Send, Loader2, User } from 'lucide-react';
import { Card } from "@/components/ui/card";

interface AdminChatInterfaceProps {
  venueId: string;
  userRole: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_read: boolean;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface Conversation {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  lastMessage: string;
  lastMessageTime: string;
}

const AdminChatInterface: React.FC<AdminChatInterfaceProps> = ({ venueId, userRole }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations for this venue
  useEffect(() => {
    const fetchConversations = async () => {
      if (!venueId) return;
      
      try {
        // Get all unique users that have sent messages to this venue
        const { data, error } = await supabase
          .from('messages')
          .select(`
            user_id,
            content,
            created_at,
            profiles (
              full_name,
              email
            )
          `)
          .eq('venue_id', venueId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          // Group by user_id and get the most recent message
          const userConversations = new Map<string, Conversation>();
          
          data.forEach(message => {
            if (!userConversations.has(message.user_id)) {
              userConversations.set(message.user_id, {
                userId: message.user_id,
                userName: message.profiles?.full_name || 'Guest User',
                userEmail: message.profiles?.email || 'No email',
                lastMessage: message.content,
                lastMessageTime: message.created_at,
              });
            }
          });
          
          setConversations(Array.from(userConversations.values()));
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
    
    // Subscribe to new messages to update conversations list
    const channel = supabase
      .channel('admin_messages')
      .on('postgres_changes', 
        {
          event: 'INSERT', 
          schema: 'public',
          table: 'messages',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          // Refetch conversations when a new message arrives
          fetchConversations();
          
          // If this is for the selected user, add it to the messages
          if (selectedUser === payload.new.user_id) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [venueId, selectedUser]);

  // Fetch messages when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !venueId) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .eq('venue_id', venueId)
          .eq('user_id', selectedUser)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark messages as read
        if (data && data.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('venue_id', venueId)
            .eq('user_id', selectedUser)
            .eq('is_read', false);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      }
    };
    
    fetchMessages();
  }, [selectedUser, venueId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUserSelect = (userId: string, userName: string | null) => {
    setSelectedUser(userId);
    setSelectedUserName(userName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser || !venueId) return;
    
    setSending(true);
    try {
      // For admin replies, we still store them as coming from the user
      // This allows the user to see their entire conversation history
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          user_id: selectedUser,
          venue_id: venueId,
          is_read: true // Admin messages are auto-read
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

  if (!venueId) {
    return <div>No venue selected</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
      {/* Conversations List */}
      <Card className="p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4">Conversations</h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-indigo" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <div 
                key={convo.userId}
                onClick={() => handleUserSelect(convo.userId, convo.userName)}
                className={`p-3 rounded-lg cursor-pointer ${
                  selectedUser === convo.userId 
                    ? 'bg-indigo text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className={`h-6 w-6 ${selectedUser === convo.userId ? 'text-white' : 'text-indigo'}`} />
                  <div>
                    <p className="font-medium">{convo.userName || 'Guest User'}</p>
                    <p className="text-xs opacity-80">{convo.userEmail}</p>
                  </div>
                </div>
                <p className={`text-sm mt-1 truncate ${
                  selectedUser === convo.userId ? 'text-white/80' : 'text-gray-600'
                }`}>
                  {convo.lastMessage}
                </p>
                <p className={`text-xs mt-1 ${
                  selectedUser === convo.userId ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {formatDate(convo.lastMessageTime)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Messages */}
      <Card className="md:col-span-2 flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-indigo/10">
              <h2 className="font-semibold">{selectedUserName || 'Guest User'}</h2>
            </div>
            
            {/* Messages List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className="bg-indigo-light/10 p-3 rounded-lg max-w-[85%] self-start">
                    <p className="text-gray-800">{message.content}</p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
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
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <p>Select a conversation to view messages</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminChatInterface;
