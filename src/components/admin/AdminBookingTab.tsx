
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AdminBookingForm from '@/components/AdminBookingForm';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import { supabase } from '@/integrations/supabase/client';

interface AdminBookingTabProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

interface Venue {
  id: string;
  name: string;
  courts: {
    id: string;
    name: string;
    hourly_rate: number;
  }[];
  allow_cash_payments: boolean;
}

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
  venue_id: string;
}

const AdminBookingTab: React.FC<AdminBookingTabProps> = ({
  userRole,
  adminVenues
}) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedCourtName, setSelectedCourtName] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ start_time: string; end_time: string; is_available: boolean } | null>(null);
  const [courtDetails, setCourtDetails] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, [userRole, adminVenues]);

  useEffect(() => {
    if (selectedCourtId) {
      fetchCourtDetails(selectedCourtId);
    }
  }, [selectedCourtId]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      let query = supabase.from('venues').select(`
        id,
        name,
        allow_cash_payments,
        courts:courts(id, name, hourly_rate)
      `).eq('is_active', true);
      
      // If admin (not super admin), filter to only show their venues
      if (userRole === 'admin' && adminVenues.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        query = query.in('id', venueIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to match the Venue interface
      const transformedVenues = data?.map(venue => ({
        id: venue.id,
        name: venue.name,
        courts: venue.courts || [],
        allow_cash_payments: venue.allow_cash_payments !== false // Default to true if null
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

  const fetchCourtDetails = async (courtId: string) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, hourly_rate, venue_id')
        .eq('id', courtId)
        .single();

      if (error) throw error;
      setCourtDetails(data);
    } catch (err) {
      console.error('Error fetching court details:', err);
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
  const handleSlotSelect = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    if (slot.is_available) {
      setSelectedSlot(slot);
    }
  };

  const handleBookingComplete = () => {
    setSelectedSlot(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No venues available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Book for Customer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left panel - Venue and date selection */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-md shadow p-4 mb-6">
            <h3 className="text-md font-medium mb-3">Select Venue and Court</h3>
            
            {/* Venue Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <select
                value={selectedVenue?.id || ''}
                onChange={(e) => {
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
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Court Selection */}
            {selectedVenue && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedVenue.courts.map(court => (
                    <Button
                      key={court.id}
                      variant={selectedCourtId === court.id ? 'default' : 'outline'}
                      onClick={() => handleCourtSelect(court.id)}
                      className="text-xs h-9 justify-start overflow-hidden"
                    >
                      {court.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
          </div>
          
          {/* Availability View */}
          <div className="bg-white rounded-md shadow p-4">
            <h3 className="text-md font-medium mb-3">Available Time Slots</h3>
            {selectedCourtId ? (
              <AvailabilityWidget 
                courtId={selectedCourtId}
                date={format(selectedDate, 'yyyy-MM-dd')}
                onSelectSlot={handleSlotSelect}
                isAdmin={true}
              />
            ) : (
              <p className="text-gray-500 text-center py-4">Select a court to view availability</p>
            )}
          </div>
        </div>
        
        {/* Right panel - Booking form */}
        <div className="md:col-span-3">
          {selectedCourtId && courtDetails && selectedVenue ? (
            <AdminBookingForm
              courtId={selectedCourtId}
              courtName={selectedCourtName}
              venueName={selectedVenue.name}
              venueId={courtDetails.venue_id}
              date={format(selectedDate, 'yyyy-MM-dd')}
              selectedSlot={selectedSlot}
              hourlyRate={courtDetails.hourly_rate || 0}
              onBookingComplete={handleBookingComplete}
              allowCashPayments={selectedVenue.allow_cash_payments}
            />
          ) : (
            <div className="bg-white rounded-md shadow p-4">
              <p className="text-gray-500 text-center py-8">
                Select a venue, court, and time slot to create a booking
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookingTab;
