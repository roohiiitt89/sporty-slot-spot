import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { PaymentMethod, BookingInfo } from '@/types/help';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
interface AdminBookingFormProps {
  courtId: string;
  courtName: string;
  venueName: string;
  venueId: string;
  date: string;
  selectedSlot: {
    start_time: string;
    end_time: string;
    is_available: boolean;
  } | null;
  hourlyRate: number;
  onBookingComplete?: () => void;
  allowCashPayments?: boolean;
}
const AdminBookingForm: React.FC<AdminBookingFormProps> = ({
  courtId,
  courtName,
  venueName,
  venueId,
  date,
  selectedSlot,
  hourlyRate,
  onBookingComplete,
  allowCashPayments = true
}) => {
  const {
    user
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountCollected, setAmountCollected] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Calculate total price based on time difference
  const calculatePrice = (): number => {
    if (!selectedSlot) return 0;
    const startParts = selectedSlot.start_time.split(':').map(Number);
    const endParts = selectedSlot.end_time.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    // Calculate hours (might be fractional)
    const hours = (endMinutes - startMinutes) / 60;
    return hourlyRate * hours;
  };
  const totalPrice = calculatePrice();
  useEffect(() => {
    if (totalPrice > 0) {
      setAmountCollected(totalPrice);
    }
  }, [totalPrice]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedSlot) {
      setError('Missing required information');
      return;
    }
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Create the booking
      const {
        data: bookingData,
        error: bookingError
      } = await supabase.from('bookings').insert({
        court_id: courtId,
        booking_date: date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        total_price: totalPrice,
        guest_name: customerName,
        guest_phone: customerPhone || null,
        status: 'confirmed',
        payment_method: paymentMethod,
        booked_by_admin_id: user.id,
        payment_status: paymentMethod === 'cash' || paymentMethod === 'free' ? 'completed' : 'pending'
      }).select('id').single();
      if (bookingError) throw bookingError;

      // 2. Create the admin booking record
      const {
        error: adminBookingError
      } = await supabase.from('admin_bookings').insert({
        booking_id: bookingData.id,
        admin_id: user.id,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' || paymentMethod === 'free' ? 'completed' : 'pending',
        amount_collected: paymentMethod === 'cash' && amountCollected !== '' ? Number(amountCollected) : null,
        notes: notes || null
      });
      if (adminBookingError) throw adminBookingError;

      // Show success and reset form
      setSuccess(true);
      toast({
        title: 'Booking successful',
        description: `Booked ${courtName} for ${customerName}`,
        variant: 'default'
      });

      // Reset form
      setTimeout(() => {
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMethod('cash');
        setAmountCollected('');
        setNotes('');
        setSuccess(false);
        if (onBookingComplete) {
          onBookingComplete();
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the booking');
      toast({
        title: 'Booking failed',
        description: err.message || 'An error occurred while creating the booking',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  if (!selectedSlot) {
    return <div className="p-4 bg-gray-100 rounded-md">
        <p className="text-center text-gray-600">Please select a time slot to create a booking</p>
      </div>;
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  return <div className="bg-emerald-800 rounded-md shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Create Booking for Customer</h3>
      
      <div className="mb-4 p-3 bg-indigo-50 rounded-md">
        <p className="font-medium">Slot Summary:</p>
        <p>Venue: {venueName}</p>
        <p>Court: {courtName}</p>
        <p>Date: {new Date(date).toLocaleDateString()}</p>
        <p>Time: {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
        <p className="font-semibold mt-1">Total Price: ₹{totalPrice.toFixed(2)}</p>
      </div>
      
      {success && <Alert className="mb-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            The booking has been created successfully.
          </AlertDescription>
        </Alert>}
      
      {error && <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" required />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Enter customer phone" />
            </div>
          </div>
          
          <div>
            <Label className="">Payment Method</Label>
            <RadioGroup defaultValue="cash" value={paymentMethod} onValueChange={value => setPaymentMethod(value as PaymentMethod)} className="flex flex-wrap gap-4 mt-2">
              {allowCashPayments && <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer">Cash</Label>
                </div>}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer">Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="cursor-pointer">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free" className="cursor-pointer">Free / Complimentary</Label>
              </div>
            </RadioGroup>
          </div>
          
          {paymentMethod === 'cash' && <div>
              <Label htmlFor="amountCollected">Amount Collected (₹)</Label>
              <Input id="amountCollected" type="number" value={amountCollected} onChange={e => setAmountCollected(e.target.value === '' ? '' : Number(e.target.value))} placeholder={`Default: ${totalPrice}`} />
            </div>}
          
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any additional information about this booking" rows={3} />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || !customerName.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Booking
          </Button>
        </div>
      </form>
    </div>;
};
export default AdminBookingForm;