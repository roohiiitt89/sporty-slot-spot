
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Ban, 
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import AvailabilityWidget from '@/components/AvailabilityWidget';

interface BlockedSlot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}

const BlockTimeSlots_Mobile: React.FC = () => {
  const { user, userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string; venue_name: string }>>([]);
  const [selectedVenue, setSelectedVenue] = useState<{ id: string; name: string; } | null>(null);
  const [courts, setCourts] = useState<Array<{ id: string; name: string; court_group_id: string | null }>>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedCourtName, setSelectedCourtName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    start_time: string;
    end_time: string;
    is_available: boolean;
  } | null>(null);
  const [reason, setReason] = useState<string>('');
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  
  // Fetch admin venues
  useEffect(() => {
    const fetchAdminVenues = async () => {
      try {
        setLoading(true);
        
        // Get admin venues using RPC function
        const { data, error } = await supabase.rpc('get_admin_venues');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const venues = data.map(v => ({
            venue_id: v.venue_id,
            venue_name: v.venue_name
          }));
          
          setAdminVenues(venues);
          // Select first venue by default
          setSelectedVenue({
            id: venues[0].venue_id,
            name: venues[0].venue_name
          });
        } else {
          toast({
            title: "No venues",
            description: "You don't have access to any venues.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching admin venues:', error);
        toast({
          title: "Error",
          description: "Failed to load your venues. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'admin' || userRole === 'super_admin') {
      fetchAdminVenues();
    }
  }, [userRole]);

  // Fetch courts when venue is selected
  useEffect(() => {
    const fetchCourts = async () => {
      if (!selectedVenue?.id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('courts')
          .select('id, name, court_group_id')
          .eq('venue_id', selectedVenue.id)
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCourts(data);
          // Select first court by default
          setSelectedCourtId(data[0].id);
          setSelectedCourtName(data[0].name);
        } else {
          setCourts([]);
          setSelectedCourtId('');
          setSelectedCourtName('');
          toast({
            title: "No courts",
            description: "No active courts found for this venue.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast({
          title: "Error",
          description: "Failed to load courts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourts();
  }, [selectedVenue]);

  // Fetch blocked slots when court or date changes
  useEffect(() => {
    fetchBlockedSlots();
  }, [selectedCourtId, selectedDate]);

  // Set up real-time subscription for blocked slots
  useEffect(() => {
    // Blocked slots channel subscription for real-time updates
    const blockedSlotsChannel = supabase.channel('blocked_slots_realtime')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_slots'
        },
        () => {
          fetchBlockedSlots();
          setLastRefresh(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(blockedSlotsChannel);
    };
  }, []);

  // Add shared group logic for blocked slots
  const fetchBlockedSlots = async () => {
    if (!selectedCourtId || !selectedDate) return;
    
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
      
      const { data, error } = await supabase
        .from('blocked_slots')
        .select('*')
        .in('court_id', courtIdsToCheck)
        .eq('date', formattedDate);
        
      if (error) throw error;
      setBlockedSlots(data || []);
    } catch (err) {
      console.error('Error fetching blocked slots:', err);
    }
  };

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (court) {
      setSelectedCourtId(courtId);
      setSelectedCourtName(court.name);
      setSelectedSlot(null); // Reset selected slot when changing courts
    }
  };
  
  // Handle venue selection
  const handleVenueSelect = (venueId: string) => {
    const venue = adminVenues.find(v => v.venue_id === venueId);
    if (venue) {
      setSelectedVenue({
        id: venue.venue_id,
        name: venue.venue_name
      });
      setSelectedCourtId('');
      setSelectedCourtName('');
      setSelectedSlot(null);
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
  
  // Add padTime helper
  const padTime = (t: string) => t.length === 5 ? t + ':00' : t;
  
  // Handle blocking slot
  const handleBlockSlot = async () => {
    if (!user?.id || !selectedCourtId || !selectedSlot) {
      toast({
        title: "Error",
        description: "Missing required information to block slot.",
        variant: "destructive"
      });
      return;
    }
    
    setIsBlocking(true);
    
    try {
      // Fetch court details to check for court_group_id
      const { data: courtDetails, error: courtDetailsError } = await supabase
        .from('courts')
        .select('court_group_id')
        .eq('id', selectedCourtId)
        .single();
        
      if (courtDetailsError) throw courtDetailsError;
      
      let courtIdsToBlock = [selectedCourtId];
      if (courtDetails && courtDetails.court_group_id) {
        const { data: groupCourts, error: groupCourtsError } = await supabase
          .from('courts')
          .select('id')
          .eq('court_group_id', courtDetails.court_group_id)
          .eq('is_active', true);
          
        if (groupCourtsError) throw groupCourtsError;
        courtIdsToBlock = groupCourts.map((c: { id: string }) => c.id);
      }
      
      // Create blocked slot for each court in the group
      const inserts = courtIdsToBlock.map(cid => ({
        court_id: cid,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: padTime(selectedSlot.start_time),
        end_time: padTime(selectedSlot.end_time),
        reason: reason.trim() || 'Blocked by admin',
        created_by: user.id
      }));
      
      const { error } = await supabase.from('blocked_slots').insert(inserts);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Slot blocked successfully for all shared courts`,
      });
      
      // Reset form
      setReason('');
      setSelectedSlot(null);
      // Refresh data
      fetchBlockedSlots();
      setLastRefresh(Date.now());
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to block slot',
        variant: "destructive"
      });
    } finally {
      setIsBlocking(false);
    }
  };
  
  // Handle unblocking slot
  const handleUnblockSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Slot unblocked successfully'
      });
      
      // Refresh data
      fetchBlockedSlots();
      setLastRefresh(Date.now());
      
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
  
  // Handle refresh
  const handleManualRefresh = () => {
    fetchBlockedSlots();
    setLastRefresh(Date.now());
    toast({
      title: "Refreshed",
      description: "Availability data has been refreshed.",
    });
  };

  if (loading && adminVenues.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-navy-900 to-navy-800">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-navy-900/95 backdrop-blur-md shadow-md px-4 py-3">
        <div className="flex items-center">
          <Link to="/admin/mobile-home" className="p-1 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors mr-3">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Block Time Slots</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          className="flex items-center gap-1 bg-navy-800 border-navy-700 text-white hover:bg-navy-700"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="text-xs">Refresh</span>
        </Button>
      </header>
      
      <div className="p-4">
        {/* Venue Selection */}
        {adminVenues.length > 0 && (
          <div className="mb-4 bg-navy-800/80 p-4 rounded-lg border border-navy-700/50">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Select Venue
            </label>
            <select 
              value={selectedVenue?.id || ''} 
              onChange={(e) => handleVenueSelect(e.target.value)}
              className="w-full px-3 py-2 bg-navy-700 text-white border border-navy-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {adminVenues.map(venue => (
                <option key={venue.venue_id} value={venue.venue_id}>
                  {venue.venue_name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Date & Court Selection */}
        <div className="mb-4 bg-navy-800/80 p-4 rounded-lg border border-navy-700/50">
          {/* Date Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-indigo-400" />
              Select Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-navy-700 border-navy-600 text-white hover:bg-navy-600"
                >
                  <Calendar className="mr-2 h-4 w-4 text-indigo-400" />
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-navy-800 border-navy-700">
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
                  classNames={{
                    day_selected: "bg-indigo-600 text-white hover:bg-indigo-500",
                    day_today: "bg-navy-700 text-indigo-400 font-bold"
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Court Selection */}
          {courts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-indigo-400" />
                Select Court
              </label>
              <div className="grid grid-cols-2 gap-2">
                {courts.map(court => (
                  <Button
                    key={court.id}
                    variant={selectedCourtId === court.id ? 'default' : 'outline'}
                    onClick={() => handleCourtSelect(court.id)}
                    className={`text-xs h-10 justify-center ${
                      selectedCourtId === court.id 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-navy-700 text-white border-navy-600 hover:bg-navy-600'
                    }`}
                  >
                    {court.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Blocked Slots List */}
        <div className="mb-4 bg-navy-800/80 p-4 rounded-lg border border-navy-700/50">
          <h3 className="text-md font-medium mb-3 text-white flex items-center">
            <Ban className="mr-2 h-4 w-4 text-rose-400" />
            Currently Blocked Slots
          </h3>
          
          {blockedSlots.length > 0 ? (
            <div className="space-y-2">
              {blockedSlots.map(slot => (
                <div 
                  key={slot.id} 
                  className="flex justify-between items-center p-3 bg-red-900/30 border border-red-800/30 rounded-md"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                    {slot.reason && (
                      <div className="text-xs text-gray-300 mt-0.5">
                        Reason: {slot.reason}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblockSlot(slot.id)}
                    className="text-rose-300 hover:text-rose-100 hover:bg-rose-800/30 p-1 h-auto"
                  >
                    <Ban size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-3">
              No blocked slots for this date
            </p>
          )}
        </div>
        
        {/* Availability Widget */}
        {selectedCourtId ? (
          <div className="bg-navy-800/80 rounded-lg shadow p-4 mb-4 border border-navy-700/50">
            <h3 className="text-md font-medium mb-3 text-white flex items-center">
              <Clock className="mr-2 h-4 w-4 text-indigo-400" />
              Select a Time Slot to Block
            </h3>
            <AvailabilityWidget
              courtId={selectedCourtId}
              date={format(selectedDate, 'yyyy-MM-dd')}
              onSelectSlot={handleSlotSelect}
              isAdmin={true}
              key={`availability-${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
            />
            
            {courts.find(c => c.id === selectedCourtId && c.court_group_id) && (
              <div className="mt-3 flex items-start p-2 rounded-md bg-yellow-800/20 border border-yellow-700/20">
                <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-300">
                  This court is part of a group. Blocking a slot will block the same time for all courts in this group.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-navy-800/80 rounded-lg shadow p-4 mb-6 border border-navy-700/50">
            <p className="text-gray-400 text-center py-4 flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              Select a court to view availability
            </p>
          </div>
        )}
        
        {/* Block Slot Form */}
        {selectedSlot ? (
          <div className="bg-navy-800/80 rounded-lg shadow p-4 border border-navy-700/50">
            <h3 className="text-md font-medium mb-3 text-white flex items-center">
              <Ban className="mr-2 h-4 w-4 text-rose-400" />
              Block this Time Slot
            </h3>
            
            <div className="mb-4 p-3 bg-navy-900/80 rounded-md border border-navy-700/50">
              <p className="text-sm text-white mb-1">
                <span className="font-medium">Court:</span> {selectedCourtName}
              </p>
              <p className="text-sm text-white mb-1">
                <span className="font-medium">Date:</span> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-white">
                <span className="font-medium">Time:</span> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Reason for Blocking (Optional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Maintenance, Staff event, etc."
                className="bg-navy-700 border-navy-600 placeholder-gray-500 text-white"
                rows={3}
              />
            </div>
            
            <Button
              variant="destructive"
              onClick={handleBlockSlot}
              disabled={isBlocking}
              className="w-full"
            >
              {isBlocking ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                  Blocking...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" /> Block This Time Slot
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-400 text-center mt-2">
              This action will prevent users from booking this time slot
            </p>
          </div>
        ) : (
          <div className="bg-navy-800/80 rounded-lg shadow p-4 border border-navy-700/50">
            <p className="text-gray-400 text-center py-6 flex flex-col items-center justify-center">
              <Clock className="w-6 h-6 mb-2 text-gray-500" />
              Select a time slot above to block it
              <span className="text-xs text-gray-500 mt-1">Available slots are shown in green</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockTimeSlots_Mobile;
