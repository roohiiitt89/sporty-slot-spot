
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GetAvailableSlotsResult } from '@/types/help';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/use-toast';

interface AvailabilityWidgetProps {
  courtId: string;
  date: string;
  onSelectSlot?: (slot: { start_time: string; end_time: string; is_available: boolean }) => void;
  isAdmin?: boolean;
}

const AvailabilityWidget: React.FC<AvailabilityWidgetProps> = ({
  courtId,
  date,
  onSelectSlot,
  isAdmin = false
}) => {
  const [slots, setSlots] = useState<GetAvailableSlotsResult>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate inputs
        if (!courtId || !date) {
          setError("Invalid court or date information");
          setLoading(false);
          return;
        }

        // Fetch available slots from the database function
        const {
          data,
          error
        } = await supabase.rpc('get_available_slots', {
          p_court_id: courtId,
          p_date: date
        }).returns<GetAvailableSlotsResult>();
        
        if (error) throw error;
        setSlots(data || []);
      } catch (error: any) {
        console.error('Error fetching availability:', error);
        setError(`Error fetching availability: ${error.message}`);
        toast({
          title: "Failed to load availability",
          description: "Please try again or contact support if the problem persists.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();

    // Set up real-time subscription for bookings changes
    const channel = supabase.channel('bookings_changes')
      .on('postgres_changes', {
        event: '*',
        // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'bookings',
        filter: `court_id=eq.${courtId}`
      }, () => {
        // When booking changes, refetch availability
        fetchAvailability();
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.log('Subscription status:', status);
        }
      });
    
    // Set up real-time subscription for blocked slots changes
    const blockedSlotsChannel = supabase.channel('blocked_slots_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocked_slots',
        filter: `court_id=eq.${courtId}`
      }, () => {
        // When blocked slots change, refetch availability
        fetchAvailability();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(blockedSlotsChannel);
    };
  }, [courtId, date]);

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleSlotClick = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    if (onSelectSlot && (slot.is_available || isAdmin)) {
      onSelectSlot(slot);
    }
  };

  return (
    <Card className="w-full border border-indigo/20 bg-navy-light/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center text-white">
          <Clock className="mr-2 h-5 w-5 text-indigo-light" />
          Real-Time Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-indigo" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-red-400">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-3 bg-indigo hover:bg-indigo-dark text-white"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No time slots available for this date</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {slots.map((slot, index) => (
              <div 
                key={index} 
                className={`
                  border rounded-md p-2 text-center transition-all cursor-pointer
                  hover:transform hover:scale-105
                  ${(slot.is_available || isAdmin) 
                    ? 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20' 
                    : 'border-red-500/30 bg-red-500/10'}
                  ${(!slot.is_available && isAdmin) ? 'cursor-pointer opacity-70 hover:opacity-100' : ''}
                  ${!slot.is_available && !isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => handleSlotClick(slot)}
              >
                <p className="text-sm font-medium text-white">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </p>
                <Badge 
                  className={`
                    mt-1
                    ${slot.is_available 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}
                  `}
                >
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
