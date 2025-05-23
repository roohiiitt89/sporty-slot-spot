
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Clock, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

interface Venue {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  venue_id: string;
}

const HomepageAvailabilityWidget: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [today] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const padTime = (t: string) => t.length === 5 ? t + ':00' : t;

  const fetchAvailability = async (courtId: string, date: string) => {
    try {
      setSlotsLoading(true);
      setSlotsError(null);
      
      // 1. Fetch court details to check for court_group_id
      const { data: courtDetails, error: courtDetailsError } = await supabase
        .from('courts')
        .select('court_group_id')
        .eq('id', courtId)
        .single();
      if (courtDetailsError) throw courtDetailsError;
      
      let courtIdsToCheck = [courtId];
      if (courtDetails && courtDetails.court_group_id) {
        // 2. If in a group, fetch all court IDs in the group
        const { data: groupCourts, error: groupCourtsError } = await supabase
          .from('courts')
          .select('id')
          .eq('court_group_id', courtDetails.court_group_id)
          .eq('is_active', true);
        if (groupCourtsError) throw groupCourtsError;
        courtIdsToCheck = groupCourts.map((c: { id: string }) => c.id);
      }

      // 3. Fetch available slots for the selected court (for template/pricing)
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_court_id: courtId,
        p_date: date
      });
      if (error) throw error;

      // 4. Fetch bookings for all courts in the group (or just the selected court)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('court_id, start_time, end_time, booking_date')
        .in('court_id', courtIdsToCheck)
        .eq('booking_date', date)
        .in('status', ['confirmed', 'pending']);
      if (bookingsError) throw bookingsError;
      
      // 5. Fetch blocked slots for all courts in the group
      const { data: blockedSlots, error: blockedSlotsError } = await supabase
        .from('blocked_slots')
        .select('court_id, start_time, end_time, date')
        .in('court_id', courtIdsToCheck)
        .eq('date', date);
      if (blockedSlotsError) throw blockedSlotsError;

      console.log('HomepageAvailabilityWidget - Fetched blocked slots:', blockedSlots);
      console.log('HomepageAvailabilityWidget - Fetched bookings:', bookings);

      // 6. Mark slots as unavailable if booked or blocked in any court in the group
      const slotsWithStatus = data?.map(slot => {
        const slotStart = padTime(slot.start_time);
        const slotEnd = padTime(slot.end_time);
        
        // Check if slot is booked in any court in the group
        const isBooked = bookings?.some(b =>
          padTime(b.start_time) === slotStart &&
          padTime(b.end_time) === slotEnd
        );
        
        // Check if slot is blocked in any court in the group
        const isBlocked = blockedSlots?.some(bs =>
          padTime(bs.start_time) === slotStart &&
          padTime(bs.end_time) === slotEnd
        );
        
        return {
          ...slot,
          is_available: slot.is_available && !isBooked && !isBlocked
        };
      }) || [];
      
      setSlots(slotsWithStatus);
    } catch (error: any) {
      setSlotsError(error.message || 'Failed to load availability');
      setSlots([]);
      console.error('Error fetching availability in HomepageAvailabilityWidget:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Set up real-time subscription for bookings and blocked slots
  useEffect(() => {
    if (!selectedCourtId || !isExpanded) return;
    
    console.log('Setting up realtime subscription for HomepageAvailabilityWidget');
    
    // Create a unique channel name based on the component
    const channelId = `homepage_availability_${Date.now()}`;
    
    // Set up realtime subscription for bookings changes
    const bookingsChannel = supabase.channel(`homepage_bookings_${channelId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `booking_date=eq.${today}`
        },
        (payload) => {
          console.log('Booking change detected on homepage:', payload);
          if (selectedCourtId && today) {
            fetchAvailability(selectedCourtId, today);
          }
        }
      )
      .subscribe();
      
    // Set up realtime subscription for blocked slots changes
    const blockedSlotsChannel = supabase.channel(`homepage_blocked_slots_${channelId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_slots',
          filter: `date=eq.${today}`
        },
        (payload) => {
          console.log('Blocked slot change detected on homepage:', payload);
          if (selectedCourtId && today) {
            fetchAvailability(selectedCourtId, today);
          }
        }
      )
      .subscribe();
      
    // Clean up subscriptions when component unmounts
    return () => {
      console.log('Cleaning up realtime subscriptions for HomepageAvailabilityWidget');
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(blockedSlotsChannel);
    };
  }, [selectedCourtId, today, isExpanded]);

  // Fetch availability when component mounts or when refresh is triggered
  useEffect(() => {
    if (selectedCourtId && today && isExpanded) {
      fetchAvailability(selectedCourtId, today);
    }
  }, [selectedCourtId, today, isExpanded, lastRefresh]);

  // Fetch venues when component mounts
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('venues')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
          .limit(10);

        if (error) throw error;
        
        setVenues(data || []);
        // Auto-select first venue if available
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
  }, []);

  // When venue is selected, fetch its courts
  useEffect(() => {
    if (!selectedVenueId) return;
    
    const fetchCourts = async () => {
      try {
        const { data, error } = await supabase
          .from('courts')
          .select('id, name, venue_id')
          .eq('venue_id', selectedVenueId)
          .eq('is_active', true)
          .order('name');
          
        if (error) throw error;
        
        // Now the data properly includes venue_id to match the Court interface
        setCourts(data || []);
        // Auto-select first court if available
        if (data && data.length > 0) {
          setSelectedCourtId(data[0].id);
        } else {
          setSelectedCourtId('');
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load courts for this venue',
          variant: 'destructive',
        });
      }
    };
    
    fetchCourts();
  }, [selectedVenueId]);

  const handleVenueChange = (venueId: string) => {
    setSelectedVenueId(venueId);
    setSelectedCourtId(''); // Reset court selection
    setIsExpanded(false); // Collapse availability view when changing venue
  };

  const handleCourtChange = (courtId: string) => {
    setSelectedCourtId(courtId);
    setIsExpanded(false); // Collapse availability view when changing court
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && selectedCourtId) {
      // Refresh availability when expanding
      setLastRefresh(Date.now());
    }
  };

  const handleRefresh = () => {
    setLastRefresh(Date.now());
  };

  return (
    <Card className="w-full bg-navy/50 border-indigo/20 backdrop-blur-sm text-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center text-white">
          <Calendar className="mr-2 h-5 w-5 text-indigo-light" />
          Check Available Courts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-indigo" />
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-4 mb-4`}>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Select Venue</label>
                <Select value={selectedVenueId} onValueChange={handleVenueChange}>
                  <SelectTrigger className="bg-navy-dark border-indigo/30 text-white">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-dark border-indigo/30 text-white">
                    {venues.map(venue => (
                      <SelectItem key={venue.id} value={venue.id} className="hover:bg-indigo/20">
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Select Court</label>
                <Select value={selectedCourtId} onValueChange={handleCourtChange} disabled={courts.length === 0}>
                  <SelectTrigger className="bg-navy-dark border-indigo/30 text-white">
                    <SelectValue placeholder={courts.length === 0 ? "No courts available" : "Select a court"} />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-dark border-indigo/30 text-white">
                    {courts.map(court => (
                      <SelectItem key={court.id} value={court.id} className="hover:bg-indigo/20">
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedCourtId && (
              <div className="mt-4">
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={toggleExpanded} 
                    variant="outline" 
                    className="flex-1 border-indigo-light text-indigo-light hover:bg-indigo/20 flex justify-between items-center"
                  >
                    <span>{isExpanded ? 'Hide Availability' : 'View Availability'}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    className="border-indigo-light text-indigo-light hover:bg-indigo/20"
                    size="icon"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
                
                {isExpanded && (
                  <div className="animate-fade-in">
                    {slotsLoading ? (
                      <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo" />
                      </div>
                    ) : slotsError ? (
                      <div className="text-center text-red-400 py-4">{slotsError}</div>
                    ) : slots.length === 0 ? (
                      <p className="text-center text-gray-400 py-4">No time slots available for this date</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {slots.map((slot, index) => (
                          <div
                            key={`${slot.start_time}-${slot.end_time}-${index}`}
                            className={`
                              border rounded-md p-2 text-center transition-all cursor-pointer
                              hover:transform hover:scale-105
                              ${slot.is_available
                                ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                                : 'border-red-500/30 bg-red-500/10'}
                              ${!slot.is_available ? 'cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <p className="text-sm font-medium text-white">
                              {slot.start_time?.slice(0,5)} - {slot.end_time?.slice(0,5)}
                            </p>
                            <Badge
                              className={`mt-1 ${slot.is_available
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                            >
                              {slot.is_available ? 'Available' : 'Booked'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HomepageAvailabilityWidget;
