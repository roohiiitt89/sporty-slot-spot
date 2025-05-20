
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import AdminBookingForm from '@/components/AdminBookingForm';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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

  // Set up real-time subscription for bookings and blocked slots
  useEffect(() => {
    // Bookings channel subscription for real-time updates
    const bookingsChannel = supabase.channel('bookings_mobile_channel')
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
    const blockedSlotsChannel = supabase.channel('blocked_slots_mobile_channel')
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
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(blockedSlotsChannel);
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-800 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-black/90 to-navy-900/90 backdrop-blur-md shadow-md">
        <div className="flex items-center px-4 py-4">
          <button 
            onClick={() => navigate('/admin/mobile-home')}
            className="mr-3 p-1.5 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-white">Book for Customer</h1>
        </div>
      </header>
    
      <div className="p-4">
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50 mb-4">      
          {/* Venue Selection */}
          {adminVenues.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-1">
                Select Venue
              </label>
              <Select 
                value={selectedVenueId} 
                onValueChange={(e) => handleVenueChange(e)}
              >
                <SelectTrigger className="w-full bg-navy-900 border-navy-700 text-white">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-navy-700 text-white">
                  {adminVenues.map(venue => (
                    <SelectItem key={venue.venue_id} value={venue.venue_id}>
                      {venue.venue_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Date Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-white mb-1">
              Select Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start bg-navy-900 border-navy-700 text-white">
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
              <label className="block text-sm font-medium text-white mb-1">
                Select Court
              </label>
              <Select value={selectedCourtId} onValueChange={handleCourtSelect}>
                <SelectTrigger className="w-full bg-navy-900 border-navy-700 text-white">
                  <SelectValue placeholder="Select court" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-navy-700 text-white">
                  {courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
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
            className="mb-4 w-full bg-navy-700 hover:bg-navy-600 text-white"
          >
            Refresh Availability
          </Button>
        </div>
        
        {/* Availability Widget */}
        {selectedCourtId ? (
          <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50 mb-4">
            <h3 className="text-md font-medium mb-3 text-white">Available Time Slots</h3>
            <AvailabilityWidget
              courtId={selectedCourtId}
              date={format(selectedDate, 'yyyy-MM-dd')}
              onSelectSlot={handleSlotSelect}
              isAdmin={true}
              key={`availability-${selectedCourtId}-${format(selectedDate, 'yyyy-MM-dd')}-${lastRefresh}`}
            />
          </div>
        ) : (
          <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50 mb-4">
            <p className="text-gray-400 text-center py-4">Select a court to view availability</p>
          </div>
        )}
        
        {/* Booking Form */}
        {selectedCourtId && selectedSlot ? (
          <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
            <h3 className="text-md font-medium mb-3 text-white">Create Booking</h3>
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
          <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
            <p className="text-gray-400 text-center py-4">
              Select a time slot to create a booking
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookForCustomer_Mobile;
