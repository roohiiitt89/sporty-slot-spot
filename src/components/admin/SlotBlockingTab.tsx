import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import SlotBlockingForm from './SlotBlockingForm';
import { toast } from '@/components/ui/use-toast';
interface SlotBlockingTabProps {
  userRole: string | null;
  adminVenues: {
    venue_id: string;
  }[];
}
interface Venue {
  id: string;
  name: string;
  courts: {
    id: string;
    name: string;
  }[];
}
interface BlockedSlot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}
const SlotBlockingTab: React.FC<SlotBlockingTabProps> = ({
  userRole,
  adminVenues
}) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedCourtName, setSelectedCourtName] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{
    start_time: string;
    end_time: string;
    is_available: boolean;
  } | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchVenues();
  }, [userRole, adminVenues]);
  useEffect(() => {
    if (selectedCourtId && selectedDate) {
      fetchBlockedSlots();
    }
  }, [selectedCourtId, selectedDate]);
  const fetchVenues = async () => {
    try {
      setLoading(true);
      let query = supabase.from('venues').select(`
        id,
        name,
        courts:courts(id, name)
      `).eq('is_active', true);

      // If admin (not super admin), filter to only show their venues
      if (userRole === 'admin' && adminVenues.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        query = query.in('id', venueIds);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;

      // Transform data to match the Venue interface
      const transformedVenues = data?.map(venue => ({
        id: venue.id,
        name: venue.name,
        courts: venue.courts || []
      })) || [];
      setVenues(transformedVenues);

      // Set the first venue as selected by default
      if (transformedVenues.length > 0 && !selectedVenue) {
        setSelectedVenue(transformedVenues[0]);
        // Also select the first court
        if (transformedVenues[0].courts.length > 0) {
          const firstCourt = transformedVenues[0].courts[0];
          setSelectedCourtId(firstCourt.id);
          setSelectedCourtName(firstCourt.name);
        }
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };
  // Add padTime helper
  const padTime = (t: string) => t.length === 5 ? t + ':00' : t;

  // Add shared group logic for blocked slots
  const fetchBlockedSlots = async () => {
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      // Fetch court details to check for court_group_id
      const { data: courtDetails, error: courtDetailsError } = await supabase
        .from('courts')
        .select('court_group_id')
        .eq('id', selectedCourtId)
        .single();
      if (courtDetailsError) throw courtDetailsError;
      let courtIdsToCheck = [selectedCourtId];
      if (courtDetails && courtDetails.court_group_id) {
        const { data: groupCourts, error: groupCourtsError } = await supabase
          .from('courts')
          .select('id')
          .eq('court_group_id', courtDetails.court_group_id)
          .eq('is_active', true);
        if (groupCourtsError) throw groupCourtsError;
        courtIdsToCheck = groupCourts.map((c: { id: string }) => c.id);
      }
      const { data, error } = await supabase.from('blocked_slots').select('*').in('court_id', courtIdsToCheck).eq('date', formattedDate);
      if (error) throw error;
      setBlockedSlots(data || []);
    } catch (err) {
      console.error('Error fetching blocked slots:', err);
    }
  };

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    const venue = selectedVenue;
    if (venue) {
      const court = venue.courts.find(c => c.id === courtId);
      if (court) {
        setSelectedCourtId(courtId);
        setSelectedCourtName(court.name);
        setSelectedSlot(null); // Reset selected slot when changing courts
      }
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: {
    start_time: string;
    end_time: string;
    is_available: boolean;
  }) => {
    setSelectedSlot(slot);
  };
  const handleBlockComplete = () => {
    setSelectedSlot(null);
    fetchBlockedSlots(); // Refresh the list of blocked slots
  };
  const handleUnblockSlot = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('blocked_slots').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Slot unblocked successfully'
      });
      fetchBlockedSlots(); // Refresh the list
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to unblock slot',
        variant: 'destructive'
      });
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
      </div>;
  }
  if (venues.length === 0) {
    return <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No venues available</p>
      </div>;
  }
  return <div>
      <h2 className="text-xl font-semibold mb-6">Block Time Slots</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left panel - Venue and date selection */}
        <div className="md:col-span-2">
          <div className="bg-emerald-800 rounded-md shadow p-4 mb-6">
            <h3 className="text-md font-medium mb-3">Select Venue and Court</h3>
            
            {/* Venue Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-1">
                Venue
              </label>
              <select value={selectedVenue?.id || ''} onChange={e => {
              const venueId = e.target.value;
              const venue = venues.find(v => v.id === venueId);
              if (venue) {
                setSelectedVenue(venue);
                // Select first court of the new venue
                if (venue.courts.length > 0) {
                  const firstCourt = venue.courts[0];
                  setSelectedCourtId(firstCourt.id);
                  setSelectedCourtName(firstCourt.name);
                  setSelectedSlot(null);
                }
              }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {venues.map(venue => <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>)}
              </select>
            </div>
            
            {/* Court Selection */}
            {selectedVenue && <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-1">
                  Court
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedVenue.courts.map(court => <Button key={court.id} variant={selectedCourtId === court.id ? 'default' : 'outline'} onClick={() => handleCourtSelect(court.id)} className="text-xs h-9 justify-start overflow-hidden">
                      {court.name}
                    </Button>)}
                </div>
              </div>}
            
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={date => {
                  if (date) {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }
                }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Already Blocked Slots */}
          <div className="bg-emerald-800 rounded-md shadow p-4">
            <h3 className="text-md font-medium mb-3">Currently Blocked Slots</h3>
            
            {blockedSlots.length > 0 ? <ul className="space-y-2">
                {blockedSlots.map(slot => <li key={slot.id} className="flex justify-between items-center p-2 bg-red-50 border border-red-100 rounded-md">
                    <div>
                      <span className="text-sm font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                      {slot.reason && <p className="text-xs text-gray-600 mt-1">
                          Reason: {slot.reason}
                        </p>}
                    </div>
                    <button onClick={() => handleUnblockSlot(slot.id)} className="text-red-600 hover:text-red-800" title="Unblock slot">
                      <X size={16} />
                    </button>
                  </li>)}
              </ul> : <p className="text-gray-500 text-center py-2">No blocked slots for this date</p>}
          </div>
          
          {/* Availability View */}
          <div className="bg-emerald-800 rounded-md shadow p-4 mt-6">
            <h3 className="text-md font-medium mb-3">Select a Time Slot to Block</h3>
            {selectedCourtId ? <AvailabilityWidget courtId={selectedCourtId} date={format(selectedDate, 'yyyy-MM-dd')} onSelectSlot={handleSlotSelect} isAdmin={true} /> : <p className="text-gray-500 text-center py-4">Select a court to view availability</p>}
          </div>
        </div>
        
        {/* Right panel - Blocking form */}
        <div className="md:col-span-3">
          {selectedCourtId ? <SlotBlockingForm courtId={selectedCourtId} courtName={selectedCourtName} date={format(selectedDate, 'yyyy-MM-dd')} selectedSlot={selectedSlot} onBlockComplete={handleBlockComplete} /> : <div className="bg-white rounded-md shadow p-4">
              <p className="text-gray-500 text-center py-8">
                Select a venue, court, and time slot to block
              </p>
            </div>}
        </div>
      </div>
    </div>;
};
export default SlotBlockingTab;
