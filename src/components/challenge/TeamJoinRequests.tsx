
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChallengeMode } from '@/hooks/use-challenge-mode';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { TeamJoinRequest } from '@/types/challenge';

interface TeamJoinRequestsProps {
  teamId: string;
}

export const TeamJoinRequests = ({ teamId }: TeamJoinRequestsProps) => {
  const { user } = useAuth();
  const { fetchTeamJoinRequests, handleJoinRequest } = useChallengeMode();
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJoinRequests = async () => {
      setLoading(true);
      const requests = await fetchTeamJoinRequests(teamId);
      setJoinRequests(requests);
      setLoading(false);
    };

    loadJoinRequests();
  }, [teamId, fetchTeamJoinRequests]);

  const handleAccept = async (requestId: string) => {
    const success = await handleJoinRequest(requestId, 'accepted');
    if (success) {
      toast.success('Request accepted');
      setJoinRequests(joinRequests.filter(req => req.id !== requestId));
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await handleJoinRequest(requestId, 'rejected');
    if (success) {
      toast.success('Request rejected');
      setJoinRequests(joinRequests.filter(req => req.id !== requestId));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col space-y-2 mt-6">
        <div className="h-4 w-28 bg-gray-700 rounded"></div>
        <div className="h-20 w-full bg-gray-700 rounded mt-2"></div>
      </div>
    );
  }

  if (joinRequests.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Join Requests</h3>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center text-gray-500">
          No pending join requests
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Join Requests ({joinRequests.length})</h3>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-700">
          {joinRequests.map(request => (
            <motion.div 
              key={request.id} 
              className="p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {request.user_profile?.full_name || 'Unknown User'}
                  </div>
                  {request.message && (
                    <div className="text-sm text-gray-400 mt-1">{request.message}</div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-600 hover:bg-green-900/30 hover:text-green-300"
                    onClick={() => handleAccept(request.id)}
                  >
                    <Check size={16} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-600 hover:bg-red-900/30 hover:text-red-300"
                    onClick={() => handleReject(request.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
