
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export interface BookSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedCourt: any;
  hourlyRate: number | null;
  onBookingComplete: () => void;
  allowCashPayments: boolean;
  onClose: () => void;
  venueId?: string;
  sportId?: string;
}

const BookSlotModal: React.FC<BookSlotModalProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedCourt,
  hourlyRate,
  onBookingComplete,
  allowCashPayments,
  onClose,
  venueId,
  sportId
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [guestName, setGuestName] = React.useState('');
  const [guestPhone, setGuestPhone] = React.useState('');
  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt) return;
    
    try {
      setLoading(true);
      
      if (!user) {
        // Redirect to login if no user
        navigate('/login');
        return;
      }
      
      // Calculate total price based on hourly rate
      const startTime = new Date(`1970-01-01T${selectedCourt.start_time}Z`);
      const endTime = new Date(`1970-01-01T${selectedCourt.end_time}Z`);
      const durationHours = (endTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
      const totalPrice = Math.round((hourlyRate || 0) * durationHours);
      
      const { data, error } = await supabase.rpc('create_booking_with_lock', {
        p_court_id: selectedCourt.court_id,
        p_user_id: user.id,
        p_booking_date: format(selectedDate, 'yyyy-MM-dd'),
        p_start_time: selectedCourt.start_time,
        p_end_time: selectedCourt.end_time,
        p_total_price: totalPrice,
        p_guest_name: guestName || null,
        p_guest_phone: guestPhone || null
      });
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your booking has been confirmed",
      });
      
      onBookingComplete();
      onClose();
      
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: error.message || "There was a problem with your booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format the time from "14:00:00" to "2:00 PM"
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-navy-dark text-white border-navy-light">
        <h3 className="text-lg font-semibold mb-4">Book Court</h3>
        
        {selectedCourt && (
          <div className="mb-4 p-3 bg-navy rounded-md">
            <p className="mb-1"><span className="font-semibold">Date:</span> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
            <p className="mb-1"><span className="font-semibold">Time:</span> {formatTime(selectedCourt.start_time)} - {formatTime(selectedCourt.end_time)}</p>
            <p className="mb-1"><span className="font-semibold">Court:</span> {selectedCourt.court_name}</p>
            {hourlyRate && (
              <p className="mb-0"><span className="font-semibold">Rate:</span> ₹{hourlyRate}/hour</p>
            )}
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-name">Guest Name (optional)</Label>
            <Input 
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name" 
              className="bg-navy border-navy-light text-white placeholder:text-gray-500"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guest-phone">Guest Phone (optional)</Label>
            <Input 
              id="guest-phone"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Enter guest phone" 
              className="bg-navy border-navy-light text-white placeholder:text-gray-500"
            />
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-sport-green hover:bg-sport-green/80 text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookSlotModal;
