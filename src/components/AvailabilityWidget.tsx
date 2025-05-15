
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [lastRefetch, setLastRefetch] = useState<number>(Date.now());

  const fetchAvailability = async () => {
    try {
      console.log(`Fetching availability for court ${courtId} on date ${date}`);
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
      
      console.log('Availability data received:', data);
      
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

  useEffect(() => {
    // When courtId or date changes, we need to refetch availability
    fetchAvailability();
    
    // Reset state when key props change
    return () => {
      setSlots([]);
      setError(null);
      setLoading(true);
    };
  }, [courtId, date, lastRefetch]);

  useEffect(() => {
    // Set up real-time subscription for bookings changes
    const bookingsChannel = supabase.channel('bookings_changes_' + courtId + '_' + date)
      .on('postgres_changes', {
        event: '*',  // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'bookings',
        filter: `court_id=eq.${courtId}`
      }, (payload) => {
        console.log('Booking change detected:', payload);
        // Trigger a refetch when booking changes
        setLastRefetch(Date.now());
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to bookings changes');
        } else {
          console.log('Subscription status for bookings:', status);
        }
      });
    
    // Set up real-time subscription for blocked slots changes
    const blockedSlotsChannel = supabase.channel('blocked_slots_changes_' + courtId + '_' + date)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocked_slots',
        filter: `court_id=eq.${courtId}`
      }, (payload) => {
        console.log('Blocked slot change detected:', payload);
        // Trigger a refetch when blocked slots change
        setLastRefetch(Date.now());
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to blocked slots changes');
        }
      });
    
    return () => {
      console.log('Removing realtime channels for court', courtId);
      supabase.removeChannel(bookingsChannel);
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
      console.log('Slot selected:', slot);
      onSelectSlot(slot);
    }
  };

  // Add a manual refresh button
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    setLastRefetch(Date.now());
  };

  return (
    <Card className="w-full border border-indigo/20 bg-navy-light/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center text-white">
            <Clock className="mr-2 h-5 w-5 text-indigo-light" />
            Real-Time Availability
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleManualRefresh}
            className="text-indigo-light hover:text-white hover:bg-indigo/20"
          >
            Refresh
          </Button>
        </div>
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
              onClick={handleManualRefresh} 
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
                key={`${slot.start_time}-${slot.end_time}-${index}`}
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
