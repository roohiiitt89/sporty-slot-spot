import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TeamChat as TeamChatType } from '@/types/challenge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

interface TeamChatProps {
  teamId: string;
}

export const TeamChat = ({ teamId }: TeamChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<TeamChatType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      
      try {
        // Simpler query that doesn't rely on complex joins
        const { data, error } = await supabase
          .from('team_chats')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching team chats:', error);
          return;
        }

        // Fetch user profiles separately to avoid join issues
        const messagesWithSenderInfo = await Promise.all(
          data.map(async (message) => {
            // Get user profile info
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', message.user_id)
              .single();
              
            // Get player profile info  
            const { data: playerProfileData } = await supabase
              .from('player_profiles')
              .select('profile_name')
              .eq('id', message.user_id)
              .single();
              
            return {
              ...message,
              sender: {
                full_name: profileData?.full_name || null,
                profile_name: playerProfileData?.profile_name || null
              }
            } as TeamChatType;
          })
        );

        setMessages(messagesWithSenderInfo);
      } catch (error) {
        console.error('Error in fetchMessages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('team_chats')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'team_chats',
          filter: `team_id=eq.${teamId}` 
        }, 
        async (payload) => {
          // Fetch the new message with user details
          const { data: messageData } = await supabase
            .from('team_chats')
            .select('*')
            .eq('id', payload.new.id)
            .single();
            
          if (messageData) {
            // Get user profile info
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', messageData.user_id)
              .single();
              
            // Get player profile info  
            const { data: playerProfileData } = await supabase
              .from('player_profiles')
              .select('profile_name')
              .eq('id', messageData.user_id)
              .single();
              
            const newMessage: TeamChatType = {
              ...messageData,
              sender: {
                full_name: profileData?.full_name || null,
                profile_name: playerProfileData?.profile_name || null
              }
            };
            
            setMessages(prevMessages => [...prevMessages, newMessage]);
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('team_chats')
        .insert({
          team_id: teamId,
          user_id: user.id,
          content: newMessage.trim()
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Could not send message',
          variant: 'destructive'
        });
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden h-[400px] flex flex-col">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h3 className="text-sm font-medium">Team Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col space-y-2 animate-pulse">
            <div className="h-10 bg-gray-700 rounded-lg w-3/4"></div>
            <div className="h-10 bg-gray-700 rounded-lg w-1/2 self-end"></div>
            <div className="h-10 bg-gray-700 rounded-lg w-2/3"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(message => {
            const isCurrentUser = user?.id === message.user_id;
            const displayName = message.sender?.profile_name || message.sender?.full_name || 'Unknown User';
            
            return (
              <motion.div 
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${isCurrentUser 
                    ? 'bg-emerald-800/50 text-white ml-auto' 
                    : 'bg-gray-700 text-gray-200'}`}
                >
                  {!isCurrentUser && (
                    <div className="text-xs text-emerald-400 font-medium mb-1">{displayName}</div>
                  )}
                  <div>{message.content}</div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-700 bg-gray-800/70 flex">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="bg-gray-900 border-gray-700"
        />
        <Button 
          type="submit" 
          className="ml-2 bg-emerald-600 hover:bg-emerald-700"
          disabled={!newMessage.trim()}
        >
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
};
