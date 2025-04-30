
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AdminChatInterface from '@/components/AdminChatInterface';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface MessageManagementProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

interface Venue {
  id: string;
  name: string;
}

const MessageManagement: React.FC<MessageManagementProps> = ({ userRole, adminVenues }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        let query = supabase.from('venues').select('id, name').eq('is_active', true);
        
        // If not a super_admin, only show their venues
        if (userRole === 'admin') {
          const venueIds = adminVenues.map(v => v.venue_id);
          query = query.in('id', venueIds);
        }
        
        const { data, error } = await query.order('name');
        
        if (error) throw error;
        setVenues(data || []);
        
        // Set the first venue as selected if available
        if (data && data.length > 0) {
          setSelectedVenueId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast({
          title: 'Error',
          description: 'Failed to load venues',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenues();
  }, [userRole, adminVenues]);
  
  const handleVenueChange = (venueId: string) => {
    setSelectedVenueId(venueId);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
      </div>
    );
  }
  
  if (venues.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No venues available</h2>
        <p className="text-gray-600">You don't have any venues to manage messages for.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Message Management</h2>
        
        {venues.length > 1 && (
          <div className="w-64">
            <Select value={selectedVenueId} onValueChange={handleVenueChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map(venue => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {selectedVenueId ? (
        <AdminChatInterface venueId={selectedVenueId} userRole={userRole} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Please select a venue to manage messages</p>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;
