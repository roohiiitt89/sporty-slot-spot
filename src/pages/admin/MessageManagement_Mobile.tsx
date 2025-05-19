import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MessageCircle, User } from 'lucide-react';
import AdminChatInterface from '@/components/AdminChatInterface';

interface Venue {
  id: string;
  name: string;
}

const MessageManagement_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      let query = supabase.from('venues').select('id, name').eq('is_active', true);
      if (userRole === 'admin') {
        const { data } = await supabase.rpc('get_admin_venues');
        setAdminVenues(data || []);
        const venueIds = (data || []).map((v: any) => v.venue_id);
        if (venueIds.length > 0) query = query.in('id', venueIds);
      }
      const { data: venuesData } = await query.order('name');
      setVenues(venuesData || []);
      if (venuesData && venuesData.length > 0) setSelectedVenueId(venuesData[0].id);
      setLoading(false);
    };
    fetchVenues();
  }, [userRole]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-indigo" /></div>;
  }

  if (venues.length === 0) {
    return <div className="text-center py-12"><h2 className="text-lg font-semibold mb-2 text-white">No venues available</h2><p className="text-gray-300">You don't have any venues to manage messages for.</p></div>;
  }

  return (
    <div className="p-2 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-3 text-white">Messages</h2>
      <div className="flex flex-col gap-2">
        {venues.map(venue => (
          <button key={venue.id} className={`flex items-center gap-2 bg-navy-800 rounded-lg shadow px-2 py-3 ${selectedVenueId === venue.id ? 'ring-2 ring-indigo-400' : ''}`} onClick={() => { setSelectedVenueId(venue.id); setShowChat(true); }}>
            <MessageCircle className="w-6 h-6 text-indigo-300" />
            <span className="font-semibold text-white text-sm truncate">{venue.name}</span>
          </button>
        ))}
      </div>
      {/* Chat Drawer/Modal */}
      {showChat && selectedVenueId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <div className="flex items-center gap-2"><User className="w-5 h-5 text-indigo-400" /><span className="font-semibold">{venues.find(v => v.id === selectedVenueId)?.name}</span></div>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-red-500 text-lg">×</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminChatInterface venueId={selectedVenueId} userRole={userRole} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManagement_Mobile; 