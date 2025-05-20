
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import SlotBlockingForm from '@/components/admin/SlotBlockingForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SlotBlockingTabProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

interface BlockedSlot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
}

const SlotBlockingTab: React.FC<SlotBlockingTabProps> = ({ userRole, adminVenues }) => {
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedVenueName, setSelectedVenueName] = useState<string>('');
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedCourtName, setSelectedCourtName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string; is_available: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [showUnavailableMessage, setShowUnavailableMessage] = useState(false);

  // Fetch venues based on user role
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        let data;
        
        if (userRole === 'admin') {
          // For admin users, only show venues they manage
          if (adminVenues.length > 0) {
            const { data: venuesData, error: venuesError } = await supabase
              .from('venues')
              .select('id, name')
              .in('id', adminVenues.map(v => v.venue_id))
              .eq('is_active', true);
              
            if (venuesError) throw venuesError;
            data = venuesData;
          } else {
            data = [];
          }
        } else if (userRole === 'super_admin') {
          // For super_admin, show all venues
          const { data: venuesData, error: venuesError } = await supabase
            .from('venues')
            .select('id, name')
            .eq('is_active', true);
            
          if (venuesError) throw venuesError;
          data = venuesData;
        }
        
        if (data && data.length > 0) {
          setVenues(data);
          setSelectedVenueId(data[0].id);
          setSelectedVenueName(data[0].name);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch venues',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'admin' || userRole === 'super_admin') {
      fetchVenues();
    }
  }, [userRole, adminVenues]);

  // Fetch courts when venue is selected
  useEffect(() => {
    const fetchCourts = async () => {
      if (!selectedVenueId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('courts')
          .select('id, name')
          .eq('venue_id', selectedVenueId)
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCourts(data);
          setSelectedCourtId(data[0].id);
          setSelectedCourtName(data[0].name);
        } else {
          setCourts([]);
          setSelectedCourtId('');
          setSelectedCourtName('');
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch courts for this venue',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourts();
  }, [selectedVenueId]);

  // Set up subscriptions for real-time updates
  useEffect(() => {
    const channel = supabase.channel('blocks-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_slots' },
        () => {
          setLastRefresh(Date.now());
          fetchBlockedSlots();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCourtId, selectedDate]);

  // Fetch blocked slots for the selected court and date
  const fetchBlockedSlots = async () => {
    if (!selectedCourtId || !selectedDate) return;
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('blocked_slots')
        .select('id, court_id, date, start_time, end_time, reason')
        .eq('court_id', selectedCourtId)
        .eq('date', formattedDate);
        
      if (error) throw error;
      setBlockedSlots(data || []);
    } catch (error) {
      console.error('Error fetching blocked slots:', error);
    }
  };

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (court) {
      setSelectedCourtId(courtId);
      setSelectedCourtName(court.name);
      setSelectedSlot(null); // Reset selected slot when changing courts
      fetchBlockedSlots();
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: {
    start_time: string;
    end_time: string;
    is_available: boolean;
  }) => {
    if (!slot.is_available) {
      setShowUnavailableMessage(true);
      setTimeout(() => setShowUnavailableMessage(false), 3000); // Hide after 3 seconds
      return;
    }
    
    setShowUnavailableMessage(false);
    setSelectedSlot(slot);
  };

  // Handle unblock slot
  const handleUnblockSlot = async (blockId: string) => {
    try {
      setUnblockingId(blockId);
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', blockId);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Time slot unblocked successfully',
        variant: 'default'
      });
      
      fetchBlockedSlots();
      setLastRefresh(Date.now());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock slot',
        variant: 'destructive'
      });
    } finally {
      setUnblockingId(null);
    }
  };

  // Handle blocking completion
  const handleBlockComplete = () => {
    setSelectedSlot(null);
    setLastRefresh(Date.now()); // Force refresh after blocking
    fetchBlockedSlots();
    toast({
      title: 'Success',
      description: 'Time slot blocked successfully',
      variant: 'default'
    });
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
    fetchBlockedSlots();
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    if (selectedCourtId && selectedDate) {
      fetchBlockedSlots();
    }
  }, [selectedCourtId, selectedDate]);

  if (loading && venues.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Venue Selection */}
      {venues.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Select Venue
          </label>
          <Select value={selectedVenueId} onValueChange={(value) => {
            setSelectedVenueId(value);
            const venue = venues.find(v => v.id === value);
            if (venue) setSelectedVenueName(venue.name);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a venue" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Date Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Select Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Court Selection */}
      {courts.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Select Court
          </label>
          <Select value={selectedCourtId} onValueChange={handleCourtSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a court" />
            </SelectTrigger>
            <SelectContent>
              {courts.map((court) => (
                <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Manual refresh button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleManualRefresh}
        className="mb-4 w-full"
      >
        Refresh Availability
      </Button>
      
      {/* Unavailable slot message */}
      {showUnavailableMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This slot is already booked or blocked. Please select an available slot.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Currently blocked slots */}
      {blockedSlots.length > 0 && (
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-4 mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-white">Currently Blocked Slots</h3>
          <div className="space-y-2">
            {blockedSlots.map(slot => (
              <div 
                key={slot.id} 
                className="flex items-center justify-between bg-red-100 dark:bg-red-900/30 p-2 rounded-md border border-red-200 dark:border-red-900"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </p>
                  {slot.reason && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Reason: {slot.reason}
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                  onClick={() => handleUnblockSlot(slot.id)}
                  disabled={unblockingId === slot.id}
                >
                  {unblockingId === slot.id ? 'Unblocking...' : 'Unblock'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Availability Widget */}
      {selectedCourtId ? (
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-4 mb-6">
          <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-white">Available Time Slots</h3>
          <AvailabilityWidget
            courtId={selectedCourtId}
            date={format(selectedDate, 'yyyy-MM-dd')}
            onSelectSlot={handleSlotSelect}
            isAdmin={true}
            key={`availability-${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-4 mb-6">
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Select a court to view availability</p>
        </div>
      )}
      
      {/* Slot Blocking Form */}
      {selectedCourtId && selectedSlot ? (
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-4">
          <SlotBlockingForm
            courtId={selectedCourtId}
            courtName={selectedCourtName}
            date={format(selectedDate, 'yyyy-MM-dd')}
            selectedSlot={selectedSlot}
            onBlockComplete={handleBlockComplete}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Select an available time slot to block
          </p>
        </div>
      )}
    </div>
  );
};

export default SlotBlockingTab;
