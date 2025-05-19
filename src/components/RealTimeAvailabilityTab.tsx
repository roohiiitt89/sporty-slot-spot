
import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminAvailabilityWidget from './AdminAvailabilityWidget';
import AvailabilityWidget from './AvailabilityWidget';
import AdminBookingForm from './AdminBookingForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
  const [activeTab, setActiveTab] = useState<string>('view');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

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
    if (venueId && courtDetails?.venue_id) {
      fetchVenueDetails(courtDetails.venue_id);
    } else if (venueId) {
      fetchVenueDetails(venueId);
    }
  }, [venueId, courtDetails?.venue_id, fetchVenueDetails]);

  // Set up real-time subscription for courts and venues changes
  useEffect(() => {
    if (!selectedCourtId && !venueId) return;
    
    // Courts channel subscription
    const courtsChannel = supabase.channel('courts_realtime_channel')
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
    const venuesChannel = supabase.channel('venues_realtime_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'venues',
          filter: venueId ? `id=eq.${venueId}` : undefined
        }, 
        () => {
          if (venueId) {
            fetchVenueDetails(venueId);
          }
        }
      )
      .subscribe();
      
    // Bookings channel to refresh availability data
    const bookingsChannel = supabase.channel('bookings_refresh_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Trigger a refresh of availability data
          setLastRefresh(Date.now());
        }
      )
      .subscribe();
      
    // Blocked slots channel to refresh availability data
    const blockedSlotsChannel = supabase.channel('blocked_slots_refresh_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocked_slots'
        },
        () => {
          // Trigger a refresh of availability data
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
  }, [selectedCourtId, venueId, fetchCourtDetails, fetchVenueDetails]);

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (court) {
      setSelectedCourtId(courtId);
      setSelectedCourtName(court.name);
      setSelectedSlot(null); // Reset selected slot when changing courts
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    setSelectedSlot(slot);
    // If it's an admin user and the slot was clicked, switch to booking tab
    if (userRole === 'admin' || userRole === 'super_admin') {
      setActiveTab('book');
    }
  };

  const handleBookingComplete = () => {
    setSelectedSlot(null);
    setActiveTab('view');
    // Force refresh the availability view
    setLastRefresh(Date.now());
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold">Real-Time Availability</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start" disabled={isLoading}>
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
          {courts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {courts.map(court => (
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
          )}
          
          {/* Manual refresh button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            className="text-xs h-9"
          >
            Refresh
          </Button>
        </div>
      </div>

      {(userRole === 'admin' || userRole === 'super_admin') && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="view">View Availability</TabsTrigger>
            <TabsTrigger value="book" disabled={!selectedSlot}>Book for Customer</TabsTrigger>
          </TabsList>
          <TabsContent value="view" className="mt-4">
            {selectedCourtId ? (
              <AvailabilityWidget 
                courtId={selectedCourtId}
                date={format(selectedDate, 'yyyy-MM-dd')}
                onSelectSlot={handleSlotSelect}
                isAdmin={true}
                key={`availability-${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Please select a court to view availability</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="book" className="mt-4">
            {selectedCourtId && courtDetails ? (
              <AdminBookingForm
                courtId={selectedCourtId}
                courtName={selectedCourtName}
                venueName={venueName}
                venueId={courtDetails.venue_id}
                date={format(selectedDate, 'yyyy-MM-dd')}
                selectedSlot={selectedSlot}
                hourlyRate={courtDetails.hourly_rate}
                onBookingComplete={handleBookingComplete}
                allowCashPayments={allowCashPayments}
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Please select a court and time slot to create a booking</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* For non-admin users or when no tabs are shown */}
      {!(userRole === 'admin' || userRole === 'super_admin') && selectedCourtId && (
        <AdminAvailabilityWidget 
          courtId={selectedCourtId}
          date={format(selectedDate, 'yyyy-MM-dd')}
          venueName={venueName}
          courtName={selectedCourtName}
          key={`admin-availability-${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
        />
      )}
      
      {!(userRole === 'admin' || userRole === 'super_admin') && !selectedCourtId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Please select a court to view availability</p>
        </div>
      )}
    </div>
  );
};

export default RealTimeAvailabilityTab;
