
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Send, X, Loader2, HelpCircle, MessageSquare } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HelpRequest, GetUserHelpRequestsResult, CreateHelpRequestResult, UpdateHelpRequestStatusResult } from '@/types/help';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  sender_id: string;
  is_read: boolean;
}

const HelpChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'form' | 'chat'>('form');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for existing help requests
  useEffect(() => {
    const checkExistingRequests = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Using PostgreSQL function to get user help requests
        const { data, error } = await supabase
          .rpc<GetUserHelpRequestsResult>('get_user_help_requests', { p_user_id: user.id });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setHelpRequest(data[0]);
          setStep('chat');
          
          // Fetch messages for this help request
          await fetchMessages();
        }
      } catch (error) {
        console.error('Error checking help requests:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      checkExistingRequests();
    }
  }, [user, open]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      // We're using the central messages table with super_admin as destination
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .is('venue_id', null) // Messages without venue_id are help requests
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Setup real-time listener for messages
  useEffect(() => {
    if (!user || !open) return;
    
    // Set up real-time subscription for messages
    const channel = supabase
      .channel('help_messages_changes')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Check if this is a message without venue_id (help message)
          if (payload.new && !payload.new.venue_id) {
            setMessages(prev => [...prev, payload.new as Message]);
            
            // Scroll to bottom after new message
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
  }, [user, open]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !subject.trim()) return;
    
    setSending(true);
    try {
      // Create a new help request using RPC call
      const { data: requestData, error: requestError } = await supabase
        .rpc<CreateHelpRequestResult>('create_help_request', { 
          p_user_id: user.id, 
          p_subject: subject.trim() 
        });
        
      if (requestError) throw requestError;
      
      if (requestData) {
        setHelpRequest(requestData);
      
        // Create initial message
        if (newMessage.trim()) {
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              content: newMessage.trim(),
              user_id: user.id,
              sender_id: user.id,
              venue_id: null, // No venue_id means this is a help request message
            });
            
          if (messageError) throw messageError;
        }
        
        setStep('chat');
        setNewMessage('');
        setSubject('');
        toast({
          title: 'Help Request Submitted',
          description: 'We have received your request and will respond soon.',
        });
        
        // Fetch messages to make sure we have the latest
        fetchMessages();
      }
    } catch (error) {
      console.error('Error submitting help request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit help request',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newMessage.trim()) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          user_id: user.id,
          sender_id: user.id,
          venue_id: null, // No venue_id means this is a help request message
        });
        
      if (error) throw error;
      
      // Update the last_message_at field in the help_request
      if (helpRequest) {
        await supabase
          .rpc<UpdateHelpRequestStatusResult>('update_help_request_status', {
            p_help_request_id: helpRequest.id,
            p_status: 'pending'
          });
      }
      
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

  // Helper function to check if a message is from admin
  const isAdminMessage = (message: Message) => {
    return message.sender_id !== message.user_id;
  };

  if (!user) {
    return null; // Don't show the widget for non-authenticated users
  }

  return (
    <>
      {/* Fixed button at the bottom right */}
      <Button 
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 rounded-full w-12 h-12 p-0 bg-indigo hover:bg-indigo-dark shadow-lg z-50"
        aria-label="Help"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
      
      {/* Help Chat Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {step === 'form' ? 'Need Help?' : 'Support Chat'}
            </DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex justify-center items-center flex-grow">
              <Loader2 className="h-8 w-8 animate-spin text-indigo" />
            </div>
          ) : step === 'form' ? (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <Label htmlFor="subject">What do you need help with?</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Booking issues, payment problems, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Your message</Label>
                <Textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  rows={5}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sending || !subject.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <>
              {/* Chat interface */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {helpRequest && (
                  <div className="bg-slate-100 p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium">Subject: {helpRequest.subject}</p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-slate-500 mr-2">Status:</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        helpRequest.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {helpRequest.status.charAt(0).toUpperCase() + helpRequest.status.slice(1)}
                      </span>
                    </div>
                  </div>
                )}
                
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
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
                          {isAdminMessage(message) ? 'Support' : 'You'} • {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t mt-auto">
                <div className="flex">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow mr-2 focus-visible:ring-indigo"
                    disabled={sending}
                  />
                  <Button 
                    type="submit" 
                    className="bg-indigo hover:bg-indigo-dark"
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpChatWidget;
