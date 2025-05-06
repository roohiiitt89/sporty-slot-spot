
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  MessageCircle, 
  Search, 
  CheckCircle, 
  Clock,
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminHelpChatInterface } from '@/components/AdminHelpChatInterface';
import { HelpRequest, GetHelpRequestsResult, UpdateHelpRequestStatusResult } from '@/types/help';

interface HelpRequestsManagementProps {
  userRole: string | null;
}

const HelpRequestsManagement: React.FC<HelpRequestsManagementProps> = ({ userRole }) => {
  const { user } = useAuth();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchHelpRequests();
    
    // Set up real-time subscription for help requests
    const helpRequestsChannel = supabase
      .channel('help_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'help_requests' },
        (payload) => {
          console.log('Help request change:', payload);
          fetchHelpRequests();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel('help_messages_channel')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: 'venue_id=is.null' // Help request messages have null venue_id
        },
        (payload) => {
          console.log('New help message:', payload);
          fetchHelpRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(helpRequestsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userRole]);

  const fetchHelpRequests = async () => {
    try {
      setLoading(true);
      
      // Only super_admin can see help requests
      if (userRole !== 'super_admin') {
        setHelpRequests([]);
        setLoading(false);
        return;
      }
      
      // Fetch help requests using RPC call
      let { data, error } = await supabase
        .rpc<GetHelpRequestsResult, { p_status: string | null }>('get_help_requests', { 
          p_status: statusFilter === 'all' ? null : statusFilter 
        });
        
      if (error) throw error;
      
      // Apply search filter if provided
      const filteredRequests = searchQuery && data
        ? data.filter((req: HelpRequest) => 
            req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.user_name && req.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (req.user_email && req.user_email.toLowerCase().includes(searchQuery.toLowerCase())))
        : data;
      
      setHelpRequests(filteredRequests || []);
    } catch (error) {
      console.error('Error fetching help requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load help requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setTimeout(() => {
      fetchHelpRequests();
    }, 100);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHelpRequests();
  };

  const markAsResolved = async (requestId: string) => {
    try {
      const { error } = await supabase
        .rpc<UpdateHelpRequestStatusResult, { p_help_request_id: string, p_status: string }>('update_help_request_status', {
          p_help_request_id: requestId,
          p_status: 'resolved'
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Help request marked as resolved',
      });
      
      fetchHelpRequests();
    } catch (error) {
      console.error('Error updating help request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update help request',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  if (userRole !== 'super_admin') {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Only super admins can access help requests</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Help Requests Management</h2>
        
        <div className="flex space-x-2">
          <form onSubmit={handleSearch} className="relative w-64">
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
        {/* Requests List */}
        <div className="overflow-y-auto border rounded-lg bg-white p-4">
          <h3 className="font-bold text-lg mb-4">Help Requests</h3>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-indigo" />
            </div>
          ) : helpRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No help requests found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {helpRequests.map((request) => (
                <div 
                  key={request.id}
                  onClick={() => setSelectedRequest(request.id)}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedRequest === request.id 
                      ? 'bg-indigo text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className={`font-medium ${selectedRequest === request.id ? 'text-white' : 'text-slate-800'}`}>
                      {request.subject}
                    </p>
                    <Badge className={`ml-2 ${
                      request.status === 'resolved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </Badge>
                  </div>
                  
                  <p className={`text-sm ${
                    selectedRequest === request.id ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {request.user_name} ({request.user_email})
                  </p>
                  
                  <div className="flex items-center mt-1 text-xs">
                    {request.status === 'pending' ? (
                      <Clock className={`h-3 w-3 mr-1 ${
                        selectedRequest === request.id ? 'text-white/70' : 'text-yellow-500'
                      }`} />
                    ) : (
                      <CheckCircle className={`h-3 w-3 mr-1 ${
                        selectedRequest === request.id ? 'text-white/70' : 'text-green-500'
                      }`} />
                    )}
                    <span className={selectedRequest === request.id ? 'text-white/70' : 'text-gray-500'}>
                      Last activity: {formatDate(request.last_message_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Chat Interface */}
        <div className="col-span-2 border rounded-lg bg-white flex flex-col overflow-hidden">
          {selectedRequest ? (
            <AdminHelpChatInterface 
              selectedRequestId={selectedRequest}
              onMarkResolved={() => markAsResolved(selectedRequest)}
              helpRequests={helpRequests}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>Select a help request to view the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpRequestsManagement;
