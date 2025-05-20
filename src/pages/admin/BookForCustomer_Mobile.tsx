
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, RefreshCw, ChevronLeft, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import AdminBookingForm from '@/components/AdminBookingForm';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import { Link } from 'react-router-dom';

const BookForCustomer_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<{ venue_id: string, venue_name: string, allow_cash_payments: boolean }[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedVenueName, setSelectedVenueName] = useState<string>('');
  const [allowCashPayments, setAllowCashPayments] = useState<boolean>(true);
  const [courts, setCourts] = useState<{ id: string; name: string; hourly_rate: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
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
    toast({
      title: "Booking Created",
      description: "The booking has been successfully created.",
    });
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
    toast({
      title: "Refreshed",
      description: "Availability has been refreshed.",
    });
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
    <div className="min-h-screen pb-20 bg-gradient-to-br from-navy-900 to-navy-800">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-navy-900/95 backdrop-blur-md shadow-md px-4 py-3">
        <div className="flex items-center">
          <Link to="/admin/mobile-home" className="p-1 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors mr-3">
            <ChevronLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white">Book for Customer</h1>
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
              value={selectedVenueId} 
              onChange={(e) => handleVenueChange(e.target.value)}
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
            <Popover 
              open={isCalendarOpen}
              onOpenChange={setIsCalendarOpen}
            >
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
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
        
        {/* Availability Widget */}
        {selectedCourtId ? (
          <div className="bg-navy-800/80 rounded-lg shadow p-4 mb-6 border border-navy-700/50">
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
          <div className="bg-navy-800/80 rounded-lg shadow p-4 mb-6 border border-navy-700/50">
            <p className="text-gray-400 text-center py-4 flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              Select a court to view availability
            </p>
          </div>
        )}
        
        {/* Booking Form */}
        {selectedCourtId && selectedSlot ? (
          <div className="bg-navy-800/80 rounded-lg shadow p-4 border border-navy-700/50">
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
          <div className="bg-navy-800/80 rounded-lg shadow p-4 border border-navy-700/50">
            <p className="text-gray-400 text-center py-6 flex flex-col items-center justify-center">
              <Calendar className="w-6 h-6 mb-2 text-gray-500" />
              Select a time slot to create a booking
              <span className="text-xs text-gray-500 mt-1">Available slots will appear in green</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookForCustomer_Mobile;
