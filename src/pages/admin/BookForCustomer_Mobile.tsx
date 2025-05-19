
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import AdminBookingForm from '@/components/AdminBookingForm';
import AvailabilityWidget from '@/components/AvailabilityWidget';

const BookForCustomer_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<{ venue_id: string, venue_name: string, allow_cash_payments: boolean }[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedVenueName, setSelectedVenueName] = useState<string>('');
  const [allowCashPayments, setAllowCashPayments] = useState<boolean>(true);
  const [courts, setCourts] = useState<{ id: string; name: string; hourly_rate: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedCourtName, setSelectedCourtName] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string; is_available: boolean } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Fetch admin venues on component mount
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
          console.log("Admin venues fetched:", data);
          setAdminVenues(data);
          // Select first venue by default
          setSelectedVenueId(data[0].venue_id);
          setSelectedVenueName(data[0].venue_name);
          setAllowCashPayments(data[0].allow_cash_payments !== false);
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
      if (!selectedVenueId) return;
      
      try {
        setLoading(true);
        console.log("Fetching courts for venue:", selectedVenueId);
        const { data, error } = await supabase
          .from('courts')
          .select('id, name, hourly_rate')
          .eq('venue_id', selectedVenueId)
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          console.log("Courts fetched:", data);
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
  }, [selectedVenueId]);

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
  const handleSlotSelect = (slot: {
    start_time: string;
    end_time: string;
    is_available: boolean;
  }) => {
    if (slot.is_available) {
      setSelectedSlot(slot);
    }
  };

  // Handle booking completion
  const handleBookingComplete = () => {
    setSelectedSlot(null);
    setLastRefresh(Date.now()); // Force refresh after booking
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
  };

  // Handle venue change
  const handleVenueChange = (venueId: string) => {
    const venue = adminVenues.find(v => v.venue_id === venueId);
    if (venue) {
      setSelectedVenueId(venue.venue_id);
      setSelectedVenueName(venue.venue_name);
      setAllowCashPayments(venue.allow_cash_payments !== false);
      setSelectedSlot(null);
      // Reset court selection when venue changes
      setSelectedCourtId('');
      setSelectedCourtName('');
    }
  };

  if (loading && adminVenues.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-6">Book for Customer</h2>
      
      {/* Venue Selection */}
      {adminVenues.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Venue
          </label>
          <select 
            value={selectedVenueId} 
            onChange={(e) => handleVenueChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {adminVenues.map(venue => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.venue_name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Date Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Court Selection */}
      {courts.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Court
          </label>
          <div className="grid grid-cols-2 gap-2">
            {courts.map(court => (
              <Button
                key={court.id}
                variant={selectedCourtId === court.id ? 'default' : 'outline'}
                onClick={() => handleCourtSelect(court.id)}
                className="text-xs h-9 justify-start overflow-hidden text-ellipsis"
              >
                {court.name}
              </Button>
            ))}
          </div>
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
      
      {/* Availability Widget */}
      {selectedCourtId ? (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-md font-medium mb-3">Available Time Slots</h3>
          <AvailabilityWidget
            courtId={selectedCourtId}
            date={format(selectedDate, 'yyyy-MM-dd')}
            onSelectSlot={handleSlotSelect}
            isAdmin={true}
            key={`availability-${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <p className="text-gray-500 text-center py-4">Select a court to view availability</p>
        </div>
      )}
      
      {/* Booking Form */}
      {selectedCourtId && selectedSlot ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-md font-medium mb-3">Create Booking</h3>
          <AdminBookingForm
            courtId={selectedCourtId}
            courtName={selectedCourtName}
            venueName={selectedVenueName}
            venueId={selectedVenueId}
            date={format(selectedDate, 'yyyy-MM-dd')}
            selectedSlot={selectedSlot}
            hourlyRate={courts.find(c => c.id === selectedCourtId)?.hourly_rate || 0}
            onBookingComplete={handleBookingComplete}
            allowCashPayments={allowCashPayments}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-center py-4">
            Select a time slot to create a booking
          </p>
        </div>
      )}
    </div>
  );
};

export default BookForCustomer_Mobile;
