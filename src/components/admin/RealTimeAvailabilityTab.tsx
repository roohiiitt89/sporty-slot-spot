
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminAvailabilityWidget from '@/components/AdminAvailabilityWidget';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Fetch court details including hourly rate
  useEffect(() => {
    if (selectedCourtId) {
      fetchCourtDetails(selectedCourtId);
    }
  }, [selectedCourtId]);

  // Fetch venue details to check cash payments setting
  useEffect(() => {
    if (venueId) {
      fetchVenueDetails(venueId);
    }
  }, [venueId]);

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

  const fetchVenueDetails = async (venueId: string) => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('allow_cash_payments')
        .eq('id', venueId)
        .single();

      if (error) throw error;
      setAllowCashPayments(data.allow_cash_payments !== false); // Default to true if null
    } catch (err) {
      console.error('Error fetching venue details:', err);
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

  // Handle slot selection
  const handleSlotSelect = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    setSelectedSlot(slot);
  };

  if (!courts || courts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No courts available for this venue</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Real-Time Availability</h2>
      
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
                  }
                }}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
          
          {/* Court Selector */}
          <div className="flex flex-wrap gap-2">
            {courts.map(court => (
              <Button
                key={court.id}
                variant={selectedCourtId === court.id ? 'default' : 'outline'}
                onClick={() => handleCourtSelect(court.id)}
                className="text-xs h-9"
              >
                {court.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Availability Widget */}
      {selectedCourtId ? (
        <AdminAvailabilityWidget 
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
