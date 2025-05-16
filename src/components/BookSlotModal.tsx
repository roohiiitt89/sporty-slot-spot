
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, User, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { getAvailableSlots } from '@/integrations/supabase/custom-types';
import { supabase } from '@/integrations/supabase/client';

interface BookSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedCourt: { id: string; name: string } | null;
  hourlyRate: number | null;
  onBookingComplete: () => void;
  allowCashPayments: boolean;
  // Add the new props required by the pages
  onClose?: () => void;
  sportId?: string;
  venueId?: string;
}

const BookSlotModal: React.FC<BookSlotModalProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedCourt,
  hourlyRate,
  onBookingComplete,
  allowCashPayments,
  onClose, // Add onClose prop
  sportId, // Add sportId prop
  venueId, // Add venueId prop
}) => {
  const [availableSlots, setAvailableSlots] = useState<
    { start_time: string; end_time: string; is_available: boolean }[]
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<
    { start_time: string; end_time: string; is_available: boolean } | null
  >(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedCourt?.id || !selectedDate) {
        return;
      }

      setLoading(true);
      setAvailabilityError(false);

      // Instead of:
      // const { data, error } = await supabase.rpc('get_available_slots', {
      //   p_court_id: selectedCourt?.id,
      //   p_date: format(selectedDate, 'yyyy-MM-dd')
      // });

      // Use:
      const { data, error } = await getAvailableSlots(
        selectedCourt?.id || '',
        format(selectedDate, 'yyyy-MM-dd')
      );

      // Then make sure to handle the data properly:
      if (error) {
        console.error('Error fetching availability:', error);
        setAvailabilityError(true);
        setLoading(false);
        return;
      }

      // Use data?.map instead of data.map to handle potential null
      const availableSlots = data?.map((slot) => ({
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available
      })) || [];

      setAvailableSlots(availableSlots);
      setLoading(false);
    };

    fetchAvailability();
  }, [selectedCourt, selectedDate]);

  const handleSlotSelect = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    setSelectedSlot(slot);
  };

  const calculateTotalPrice = () => {
    if (!selectedSlot || !hourlyRate) {
      return 0;
    }

    const startTime = new Date(`1970-01-01T${selectedSlot.start_time}`);
    const endTime = new Date(`1970-01-01T${selectedSlot.end_time}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Duration in hours

    return duration * hourlyRate;
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      toast({
        title: 'No Slot Selected',
        description: 'Please select a time slot to book.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setBookingError(null);
    setBookingSuccess(false);

    try {
      const totalPrice = calculateTotalPrice();

      const { data, error } = await supabase.from('bookings').insert([
        {
          court_id: selectedCourt?.id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          total_price: totalPrice,
          guest_name: guestName,
          guest_phone: guestPhone,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          payment_status: paymentStatus,
          status: 'confirmed',
        },
      ]);

      if (error) {
        console.error('Error creating booking:', error);
        setBookingError('Failed to create booking. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to create booking. Please try again.',
          variant: 'destructive',
        });
      } else {
        setBookingSuccess(true);
        toast({
          title: 'Booking Successful',
          description: 'Booking created successfully!',
        });
        onBookingComplete();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error during booking:', error);
      setBookingError('An unexpected error occurred. Please try again.');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Use either the provided onClose or onOpenChange
    if (onClose) {
      onClose();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book a Slot</DialogTitle>
          <DialogDescription>
            {selectedCourt ? `Book a time slot for ${selectedCourt.name} on ${format(selectedDate, 'PPP')}` : 'Select a court and date to book a slot.'}
          </DialogDescription>
        </DialogHeader>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guest-name">Guest Name</Label>
                <Input
                  type="text"
                  id="guest-name"
                  placeholder="Guest Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guest-phone">Guest Phone</Label>
                <Input
                  type="tel"
                  id="guest-phone"
                  placeholder="Guest Phone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Available Slots</Label>
              <div className="grid grid-cols-3 gap-2">
                {loading ? (
                  <div className="col-span-3 flex justify-center items-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : availabilityError ? (
                  <div className="col-span-3 text-red-500 text-center">
                    Failed to load available slots.
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="col-span-3 text-gray-500 text-center">
                    No slots available for the selected date.
                  </div>
                ) : (
                  availableSlots.map((slot) => (
                    <Button
                      key={`${slot.start_time}-${slot.end_time}`}
                      variant={selectedSlot === slot ? 'default' : 'outline'}
                      onClick={() => handleSlotSelect(slot)}
                      className="text-xs"
                    >
                      {format(new Date(`1970-01-01T${slot.start_time}`), 'h:mm a')} -{' '}
                      {format(new Date(`1970-01-01T${slot.end_time}`), 'h:mm a')}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div>
              <Label>Payment Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowCashPayments && (
                        <SelectItem value="cash">Cash</SelectItem>
                      )}
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-reference">Payment Reference</Label>
                  <Input
                    type="text"
                    id="payment-reference"
                    placeholder="Payment Reference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="payment-status">Payment Status</Label>
                  <Select onValueChange={(value) => setPaymentStatus(value as 'pending' | 'completed')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {selectedSlot && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <Clock className="inline-block h-4 w-4 mr-1" />
                      Time:{' '}
                      {format(new Date(`1970-01-01T${selectedSlot.start_time}`), 'h:mm a')} -{' '}
                      {format(new Date(`1970-01-01T${selectedSlot.end_time}`), 'h:mm a')}
                    </p>
                    <p>
                      <CalendarIcon className="inline-block h-4 w-4 mr-1" />
                      Date: {format(selectedDate, 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p>
                      <User className="inline-block h-4 w-4 mr-1" />
                      Guest Name: {guestName || 'N/A'}
                    </p>
                    <p>
                      <Phone className="inline-block h-4 w-4 mr-1" />
                      Guest Phone: {guestPhone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p>
                      <Badge variant="secondary">
                        Total Price: ${calculateTotalPrice().toFixed(2)}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleBooking} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookSlotModal;
