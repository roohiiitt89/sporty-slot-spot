import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AdminAvailabilityWidget from '@/components/AdminAvailabilityWidget';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface RealTimeAvailabilityTabProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
  venueId?: string;
  venueName?: string;
  courts?: Array<{ id: string; name: string }>;
}

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
  venue_id: string;
}

const RealTimeAvailabilityTab: React.FC<RealTimeAvailabilityTabProps> = ({
  userRole,
  adminVenues,
  venueId,
  venueName = 'Venue',
  courts = []
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourtId, setSelectedCourtId] = useState<string>(courts.length > 0 ? courts[0].id : '');
  const [selectedCourtName, setSelectedCourtName] = useState<string>(courts.length > 0 ? courts[0].name : '');
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string; is_available: boolean } | null>(null);
  const [courtDetails, setCourtDetails] = useState<Court | null>(null);
  const [allowCashPayments, setAllowCashPayments] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableCourts, setAvailableCourts] = useState<Array<{ id: string; name: string }>>(courts);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venueId || '');
  const [adminVenuesList, setAdminVenuesList] = useState<Array<{ venue_id: string; venue_name: string }>>([]);
  
  // Fetch admin venues if not provided
  useEffect(() => {
    const fetchAdminVenuesList = async () => {
      if (userRole !== 'admin' && userRole !== 'super_admin') return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_admin_venues');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setAdminVenuesList(data);
          
          // If venue not specified, use the first venue from the admin list
          if (!venueId && !selectedVenueId && data.length > 0) {
            setSelectedVenueId(data[0].venue_id);
          }
        }
      } catch (err) {
        console.error('Error fetching admin venues:', err);
        toast({
          title: "Error",
          description: "Failed to load venues. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if ((userRole === 'admin' || userRole === 'super_admin') && adminVenuesList.length === 0) {
      fetchAdminVenuesList();
    }
  }, [userRole, venueId, selectedVenueId, adminVenuesList.length]);
  
  // Fetch courts based on selected venue or provided venue ID
  useEffect(() => {
    const fetchCourts = async () => {
      const venueToUse = selectedVenueId || venueId;
      if (!venueToUse || courts.length > 0) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching courts for venue:", venueToUse);
        const { data, error } = await supabase
          .from('courts')
          .select('id, name, hourly_rate')
          .eq('venue_id', venueToUse)
          .eq('is_active', true);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("Courts fetched:", data);
          setAvailableCourts(data);
          
          // Select first court by default
          if (!selectedCourtId) {
            setSelectedCourtId(data[0].id);
            setSelectedCourtName(data[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching courts:', err);
        toast({
          title: "Error",
          description: "Failed to load courts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourts();
  }, [selectedVenueId, venueId, courts.length, selectedCourtId]);
  
  // Use useCallback to prevent recreation of these functions on each render
  const fetchCourtDetails = useCallback(async (courtId: string) => {
    if (!courtId) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching details for court:", courtId);
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, hourly_rate, venue_id')
        .eq('id', courtId)
        .single();

      if (error) throw error;
      console.log("Court details fetched:", data);
      setCourtDetails(data);
    } catch (err) {
      console.error('Error fetching court details:', err);
      toast({
        title: "Error",
        description: "Failed to load court details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVenueDetails = useCallback(async (venueId: string) => {
    if (!venueId) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching details for venue:", venueId);
      const { data, error } = await supabase
        .from('venues')
        .select('allow_cash_payments')
        .eq('id', venueId)
        .single();

      if (error) throw error;
      console.log("Venue details fetched:", data);
      setAllowCashPayments(data.allow_cash_payments !== false); // Default to true if null
    } catch (err) {
      console.error('Error fetching venue details:', err);
      toast({
        title: "Error",
        description: "Failed to load venue details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch court details immediately when selectedCourtId changes
  useEffect(() => {
    if (selectedCourtId) {
      fetchCourtDetails(selectedCourtId);
    }
  }, [selectedCourtId, fetchCourtDetails]);

  // Fetch venue details immediately when venueId changes
  useEffect(() => {
    if (venueId) {
      fetchVenueDetails(venueId);
    } else if (selectedVenueId) {
      fetchVenueDetails(selectedVenueId);
    } else if (courtDetails?.venue_id) {
      fetchVenueDetails(courtDetails.venue_id);
    }
  }, [venueId, selectedVenueId, courtDetails?.venue_id, fetchVenueDetails]);

  // Set up real-time subscription for courts and venues changes
  useEffect(() => {
    if (!selectedCourtId && !venueId && !selectedVenueId) return;

    // Courts channel subscription
    const courtsChannel = supabase.channel('courts_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'courts',
          filter: selectedCourtId ? `id=eq.${selectedCourtId}` : undefined
        }, 
        () => {
          if (selectedCourtId) {
            fetchCourtDetails(selectedCourtId);
          }
        }
      )
      .subscribe();

    // Venues channel subscription
    const venuesChannel = supabase.channel('venues_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'venues',
          filter: selectedVenueId ? `id=eq.${selectedVenueId}` : (venueId ? `id=eq.${venueId}` : undefined)
        }, 
        () => {
          if (selectedVenueId) {
            fetchVenueDetails(selectedVenueId);
          } else if (venueId) {
            fetchVenueDetails(venueId);
          }
        }
      )
      .subscribe();

    // Bookings channel subscription for real-time updates
    const bookingsChannel = supabase.channel('bookings_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Force refresh of the availability widget when bookings change
          setLastRefresh(Date.now());
        }
      )
      .subscribe();

    // Blocked slots channel subscription for real-time updates
    const blockedSlotsChannel = supabase.channel('blocked_slots_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_slots'
        },
        () => {
          // Force refresh of the availability widget when blocked slots change
          setLastRefresh(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(courtsChannel);
      supabase.removeChannel(venuesChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(blockedSlotsChannel);
    };
  }, [selectedCourtId, venueId, selectedVenueId, fetchCourtDetails, fetchVenueDetails]);

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    const courtsToUse = courts.length > 0 ? courts : availableCourts;
    const court = courtsToUse.find(c => c.id === courtId);
    if (court) {
      setSelectedCourtId(courtId);
      setSelectedCourtName(court.name);
      setSelectedSlot(null); // Reset selected slot when changing courts
    }
  };

  // Handle venue selection
  const handleVenueSelect = (venueId: string) => {
    setSelectedVenueId(venueId);
    setSelectedCourtId('');
    setSelectedCourtName('');
    setAvailableCourts([]);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    setSelectedSlot(slot);
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
  };

  const courtsToDisplay = courts.length > 0 ? courts : availableCourts;

  if (isLoading && courtsToDisplay.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green mx-auto mb-4"></div>
        <p className="text-gray-600">Loading courts...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Real-Time Availability</h2>
      
      {/* Show venue selector only if multiple venues available and not explicitly provided */}
      {!venueId && adminVenuesList.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Venue
          </label>
          <select 
            value={selectedVenueId} 
            onChange={(e) => handleVenueSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-4"
          >
            {adminVenuesList.map(venue => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.venue_name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Date Picker */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start">
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
                    setSelectedSlot(null); // Reset selected slot when changing date
                    // Force refresh when date changes
                    setLastRefresh(Date.now());
                  }
                }}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
          
          {/* Court Selector */}
          <div className="flex flex-wrap gap-2">
            {courtsToDisplay.map(court => (
              <Button
                key={court.id}
                variant={selectedCourtId === court.id ? 'default' : 'outline'}
                onClick={() => handleCourtSelect(court.id)}
                className="text-xs h-9"
                disabled={isLoading}
              >
                {court.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual refresh button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Availability Widget */}
      {selectedCourtId ? (
        <AdminAvailabilityWidget 
          key={`${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
          courtId={selectedCourtId}
          date={format(selectedDate, 'yyyy-MM-dd')}
          venueName={venueName}
          courtName={selectedCourtName}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Please select a court to view availability</p>
        </div>
      )}
    </div>
  );
};

export default RealTimeAvailabilityTab;
