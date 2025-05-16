
import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Clock, User, Phone, Mail, CheckCircle, XCircle, Building, Dumbbell } from 'lucide-react';
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
  selectedDate?: Date;
  selectedCourt?: { id: string; name: string } | null;
  hourlyRate?: number | null;
  onBookingComplete?: () => void;
  allowCashPayments?: boolean;
  // Added props required by pages
  onClose?: () => void;
  sportId?: string;
  venueId?: string;
}

interface Venue {
  id: string;
  name: string;
  allow_cash_payments: boolean;
}

interface Sport {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  hourly_rate: number;
}

const BookSlotModal: React.FC<BookSlotModalProps> = ({
  open,
  onOpenChange,
  selectedDate: initialSelectedDate,
  selectedCourt: initialSelectedCourt,
  hourlyRate: initialHourlyRate,
  onBookingComplete,
  allowCashPayments = true,
  onClose,
  sportId: initialSportId,
  venueId: initialVenueId,
}) => {
  // Selection states
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(initialVenueId || null);
  const [selectedSportId, setSelectedSportId] = useState<string | null>(initialSportId || null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate || new Date());

  // Available slots and booking states
  const [availableSlots, setAvailableSlots] = useState<
    { start_time: string; end_time: string; is_available: boolean }[]
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<
    { start_time: string; end_time: string; is_available: boolean } | null
  >(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingSports, setLoadingSports] = useState(false);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed'>('pending');
  const [venueAllowsCash, setVenueAllowsCash] = useState<boolean>(allowCashPayments);

  // Fetch venues on modal open
  useEffect(() => {
    if (open) {
      fetchVenues();
      
      // If we have initial values, use them
      if (initialSelectedCourt && initialSelectedCourt.id) {
        fetchCourtDetails(initialSelectedCourt.id);
      }
    } else {
      // Reset states when modal closes
      resetForm();
    }
  }, [open]);

  // Fetch sports when venue changes
  useEffect(() => {
    if (selectedVenueId) {
      fetchSports(selectedVenueId);
      
      // Check if the venue allows cash payments
      fetchVenueDetails(selectedVenueId);
    }
  }, [selectedVenueId]);

  // Fetch courts when sport changes
  useEffect(() => {
    if (selectedVenueId && selectedSportId) {
      fetchCourts(selectedVenueId, selectedSportId);
    }
  }, [selectedVenueId, selectedSportId]);

  // Fetch availability when court and date change
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchAvailability();
    }
  }, [selectedCourt, selectedDate]);

  const resetForm = () => {
    setSelectedVenueId(initialVenueId || null);
    setSelectedSportId(initialSportId || null);
    setSelectedCourt(null);
    setSelectedDate(initialSelectedDate || new Date());
    setSelectedSlot(null);
    setGuestName('');
    setGuestPhone('');
    setPaymentMethod('cash');
    setPaymentReference('');
    setPaymentStatus('pending');
    setAvailableSlots([]);
    setBookingError(null);
    setBookingSuccess(false);
    setAvailabilityError(false);
  };

  const fetchVenues = async () => {
    try {
      setLoadingVenues(true);
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, allow_cash_payments')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVenues(data || []);
      
      // If we already have a venueId, select it
      if (initialVenueId) {
        setSelectedVenueId(initialVenueId);
      } else if (data && data.length > 0) {
        // Otherwise select the first venue
        setSelectedVenueId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues.',
        variant: 'destructive',
      });
    } finally {
      setLoadingVenues(false);
    }
  };

  const fetchSports = async (venueId: string) => {
    try {
      setLoadingSports(true);
      
      // Get sports available at the selected venue
      const { data, error } = await supabase
        .from('courts')
        .select('sports:sport_id(id, name)')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      if (error) throw error;

      // Extract unique sports from the results
      const uniqueSports = new Map();
      data?.forEach(item => {
        const sport = item.sports;
        if (sport) {
          uniqueSports.set(sport.id, sport);
        }
      });

      const sportsArray = Array.from(uniqueSports.values()) as Sport[];
      setSports(sportsArray);

      // If we already have a sportId, select it
      if (initialSportId && sportsArray.find(s => s.id === initialSportId)) {
        setSelectedSportId(initialSportId);
      } else if (sportsArray.length > 0) {
        // Otherwise select the first sport
        setSelectedSportId(sportsArray[0].id);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sports.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSports(false);
    }
  };

  const fetchCourts = async (venueId: string, sportId: string) => {
    try {
      setLoadingCourts(true);
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, hourly_rate')
        .eq('venue_id', venueId)
        .eq('sport_id', sportId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCourts(data || []);

      // If we have courts, select the first one
      if (data && data.length > 0) {
        setSelectedCourt(data[0]);
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courts.',
        variant: 'destructive',
      });
    } finally {
      setLoadingCourts(false);
    }
  };

  const fetchCourtDetails = async (courtId: string) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, hourly_rate, venue_id, sports:sport_id(id)')
        .eq('id', courtId)
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedCourt({
          id: data.id,
          name: data.name,
          hourly_rate: data.hourly_rate
        });
        setSelectedVenueId(data.venue_id);
        if (data.sports) {
          setSelectedSportId(data.sports.id);
        }
      }
    } catch (error) {
      console.error('Error fetching court details:', error);
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
      // Default to true if not specified
      setVenueAllowsCash(data.allow_cash_payments !== false);
    } catch (err) {
      console.error('Error fetching venue details:', err);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedCourt?.id || !selectedDate) {
      return;
    }

    setLoadingSlots(true);
    setAvailabilityError(false);

    try {
      // Use the getAvailableSlots helper instead of direct RPC call
      const { data, error } = await getAvailableSlots(
        selectedCourt.id,
        format(selectedDate, 'yyyy-MM-dd')
      );
      
      if (error) {
        console.error('Error fetching availability:', error);
        setAvailabilityError(true);
        setAvailableSlots([]);
        return;
      }

      // The function already returns the proper format
      setAvailableSlots(data || []);
    } catch (error) {
      console.error('Error in fetchAvailability:', error);
      setAvailabilityError(true);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: { start_time: string; end_time: string; is_available: boolean }) => {
    setSelectedSlot(slot);
  };

  const calculateTotalPrice = () => {
    if (!selectedSlot || !selectedCourt?.hourly_rate) {
      return 0;
    }

    const startTime = new Date(`1970-01-01T${selectedSlot.start_time}`);
    const endTime = new Date(`1970-01-01T${selectedSlot.end_time}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Duration in hours

    return duration * selectedCourt.hourly_rate;
  };

  const handleBooking = async () => {
    if (!selectedSlot || !selectedCourt) {
      toast({
        title: 'No Slot Selected',
        description: 'Please select a time slot to book.',
        variant: 'destructive',
      });
      return;
    }

    if (!guestName || !guestPhone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide guest name and phone number.',
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
          court_id: selectedCourt.id,
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
          description: error.message || 'Failed to create booking. Please try again.',
          variant: 'destructive',
        });
      } else {
        setBookingSuccess(true);
        toast({
          title: 'Booking Successful',
          description: 'Booking created successfully!',
        });
        if (onBookingComplete) {
          onBookingComplete();
        }
        onOpenChange(false);
      }
    } catch (error: any) {
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

  const disabledDates = (date: Date) => {
    return date < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book a Slot</DialogTitle>
          <DialogDescription>
            Select a venue, sport, court, and date to book a time slot
          </DialogDescription>
        </DialogHeader>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="grid gap-4 py-4">
            {/* Step 1: Select Venue */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="flex items-center gap-2" htmlFor="venue-select">
                  <Building className="h-4 w-4" /> Venue
                </Label>
                <Select 
                  value={selectedVenueId || ''} 
                  onValueChange={(value) => setSelectedVenueId(value)}
                  disabled={loadingVenues}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingVenues ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : venues.length === 0 ? (
                      <div className="p-2 text-center text-sm text-gray-500">No venues found</div>
                    ) : (
                      venues.map(venue => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Sport */}
              {selectedVenueId && (
                <div>
                  <Label className="flex items-center gap-2" htmlFor="sport-select">
                    <Dumbbell className="h-4 w-4" /> Sport
                  </Label>
                  <Select 
                    value={selectedSportId || ''} 
                    onValueChange={(value) => setSelectedSportId(value)}
                    disabled={loadingSports}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingSports ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : sports.length === 0 ? (
                        <div className="p-2 text-center text-sm text-gray-500">No sports found for this venue</div>
                      ) : (
                        sports.map(sport => (
                          <SelectItem key={sport.id} value={sport.id}>
                            {sport.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 3: Select Court */}
              {selectedVenueId && selectedSportId && (
                <div>
                  <Label className="flex items-center gap-2" htmlFor="court-select">
                    Court
                  </Label>
                  <Select 
                    value={selectedCourt?.id || ''} 
                    onValueChange={(value) => {
                      const court = courts.find(c => c.id === value);
                      if (court) setSelectedCourt(court);
                    }}
                    disabled={loadingCourts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a court" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCourts ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : courts.length === 0 ? (
                        <div className="p-2 text-center text-sm text-gray-500">No courts found for this sport</div>
                      ) : (
                        courts.map(court => (
                          <SelectItem key={court.id} value={court.id}>
                            {court.name} - ${court.hourly_rate}/hr
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 4: Select Date */}
              {selectedCourt && (
                <div>
                  <Label className="flex items-center gap-2" htmlFor="date-select">
                    <CalendarIcon className="h-4 w-4" /> Date
                  </Label>
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
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        disabled={disabledDates}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <Separator />

            {/* Step 5: Select Available Time Slot */}
            {selectedCourt && (
              <div>
                <Label>Available Slots</Label>
                <div className="grid grid-cols-3 gap-2">
                  {loadingSlots ? (
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
                    availableSlots.map((slot, index) => (
                      <Button
                        key={`${slot.start_time}-${slot.end_time}-${index}`}
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        onClick={() => handleSlotSelect(slot)}
                        className="text-xs"
                        disabled={!slot.is_available}
                      >
                        {format(new Date(`1970-01-01T${slot.start_time}`), 'h:mm a')} -{' '}
                        {format(new Date(`1970-01-01T${slot.end_time}`), 'h:mm a')}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            )}
            
            <Separator />

            {/* Guest Information */}
            {selectedSlot && (
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
            )}

            {/* Payment Information */}
            {selectedSlot && (
              <div>
                <Label>Payment Information</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select 
                      value={paymentMethod} 
                      onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {venueAllowsCash && (
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
                    <Select 
                      value={paymentStatus} 
                      onValueChange={(value) => setPaymentStatus(value as 'pending' | 'completed')}
                    >
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
            )}

            {/* Booking Summary */}
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
          <Button 
            type="button" 
            onClick={handleBooking} 
            disabled={loading || !selectedSlot || !guestName || !guestPhone}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookSlotModal;
