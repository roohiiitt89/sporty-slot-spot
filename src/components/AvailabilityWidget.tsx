
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GetAvailableSlotsResult } from '@/types/help';

interface AvailabilityWidgetProps {
  courtId: string;
  date: string;
}

const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({ courtId, date }) => {
  const [slots, setSlots] = useState<GetAvailableSlotsResult>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        
        // Fetch available slots from the database function
        const { data, error } = await supabase
          .rpc('get_available_slots', {
            p_court_id: courtId,
            p_date: date,
          })
          .returns<GetAvailableSlotsResult>();

        if (error) throw error;
        
        setSlots(data || []);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();

    // Set up real-time subscription for bookings changes
    const channel = supabase
      .channel('bookings_changes')
      .on('postgres_changes', 
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          // When booking changes, refetch availability
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courtId, date]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Clock className="mr-2 h-5 w-5 text-indigo" />
          Real-Time Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-indigo" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No time slots available for this date</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot, index) => (
              <div 
                key={index} 
                className={`border rounded-md p-2 text-center ${
                  slot.is_available 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-red-300 bg-red-50'
                }`}
              >
                <p className="text-sm font-medium">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                <Badge className={`mt-1 ${
                  slot.is_available 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                }`}>
                  {slot.is_available ? 'Available' : 'Booked'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityWidget;
