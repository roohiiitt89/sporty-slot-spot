import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AdminHelpChatInterface } from '@/components/AdminHelpChatInterface';

interface HelpRequest {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  user_name?: string;
  user_email?: string;
}

const HelpRequestsManagement_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchHelpRequests = async () => {
      if (userRole !== 'super_admin') {
        setHelpRequests([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('get_help_requests');
      if (!error) setHelpRequests(data || []);
      setLoading(false);
    };
    fetchHelpRequests();
  }, [userRole]);

  if (userRole !== 'super_admin') {
    return <div className="text-center py-12 bg-gray-50 rounded-lg"><p className="text-gray-600">Only super admins can access help requests</p></div>;
  }
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-indigo" /></div>;
  }
  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-3 text-white">Help Requests</h2>
      <div className="flex flex-col gap-2">
        {helpRequests.length === 0 ? (
          <div className="bg-emerald-800 rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No help requests found</h3>
          </div>
        ) : helpRequests.map(request => (
          <button key={request.id} className={`flex flex-col items-start bg-navy-800 rounded-lg shadow px-2 py-2 gap-1 ${selectedRequest === request.id ? 'ring-2 ring-indigo-400' : ''}`} onClick={() => { setSelectedRequest(request.id); setShowChat(true); }}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm truncate">{request.subject}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${request.status === 'resolved' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{request.status}</span>
            </div>
            <div className="text-xs text-gray-300">{request.user_name} ({request.user_email})</div>
            <div className="flex items-center mt-1 text-xs">
              {request.status === 'pending' ? <Clock className="h-3 w-3 mr-1 text-yellow-500" /> : <CheckCircle className="h-3 w-3 mr-1 text-green-500" />}
              <span className="text-gray-500">Last activity: {new Date(request.last_message_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</span>
            </div>
          </button>
        ))}
      </div>
      {/* Chat Drawer/Modal */}
      {showChat && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-indigo-400" /><span className="font-semibold">{helpRequests.find(r => r.id === selectedRequest)?.subject}</span></div>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-red-500 text-lg">×</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminHelpChatInterface selectedRequestId={selectedRequest} onMarkResolved={() => setShowChat(false)} helpRequests={helpRequests} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpRequestsManagement_Mobile; 