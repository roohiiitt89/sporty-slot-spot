import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Court, Venue, TemplateSlot, Booking, Profile } from '@/types';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

interface BookSlotModalProps {
  court: Court;
  venue: Venue;
  selectedDate: Date;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

const BookSlotModal: React.FC<BookSlotModalProps> = ({
  court,
  venue,
  selectedDate,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TemplateSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TemplateSlot | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [notes, setNotes] = useState('');

  // Fetch available slots for the selected date
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        setLoading(true);
        
        // Get day of week (0-6, Sunday-Saturday)
        const dayOfWeek = selectedDate.getDay();
        
        // Fetch template slots for this court and day of week
        const { data: templateSlots, error: slotsError } = await supabase
          .from('template_slots')
          .select('*')
          .eq('court_id', court.id)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true)
          .order('start_time', { ascending: true });

        if (slotsError) throw slotsError;

        // Fetch existing bookings for this court and date
        const { data: existingBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('court_id', court.id)
          .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'));

        if (bookingsError) throw bookingsError;

        // Fetch blocked slots for this court and date
        const { data: blockedSlots, error: blockedError } = await supabase
          .from('blocked_slots')
          .select('*')
          .eq('court_id', court.id)
          .eq('date', format(selectedDate, 'yyyy-MM-dd'));

        if (blockedError) throw blockedError;

        // Filter out slots that are already booked or blocked
        const available = templateSlots?.filter(templateSlot => {
          const isBooked = existingBookings?.some(booking => 
            booking.start_time === templateSlot.start_time && 
            booking.end_time === templateSlot.end_time
          );
          
          const isBlocked = blockedSlots?.some(blocked => 
            blocked.start_time === templateSlot.start_time && 
            blocked.end_time === templateSlot.end_time
          );
          
          return !isBooked && !isBlocked;
        }) || [];

        setAvailableSlots(available);
      } catch (err) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load available time slots');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [court.id, selectedDate]);

  // Fetch user profile if logged in
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setUserProfile(data);
          setGuestName(data.full_name || '');
          setGuestPhone(data.phone || '');
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSlotSelect = (slot: TemplateSlot) => {
    setSelectedSlot(slot);
  };

  const handleBookingSubmit = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    if (!guestName) {
      setError('Please provide your name');
      return;
    }

    if (!guestPhone) {
      setError('Please provide your phone number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate total price (simple calculation, can be enhanced)
      const start = new Date(`1970-01-01T${selectedSlot.start_time}`);
      const end = new Date(`1970-01-01T${selectedSlot.end_time}`);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const totalPrice = durationHours * (court.hourly_rate || 25);

      // Create the booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([
          {
            court_id: court.id,
            user_id: user?.id || null,
            booking_date: format(selectedDate, 'yyyy-MM-dd'),
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time,
            total_price: totalPrice,
            guest_name: guestName,
            guest_phone: guestPhone,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // If booked by admin (optional feature)
      if (user?.user_metadata?.is_admin) {
        await supabase.from('admin_bookings').insert([
          {
            booking_id: booking.id,
            admin_id: user.id,
            customer_name: guestName,
            customer_phone: guestPhone,
            payment_method: paymentMethod,
            payment_status: 'pending',
            amount_collected: paymentMethod === 'cash' ? totalPrice : null,
            notes: notes,
          },
        ]);
      }

      setSuccess(true);
      onBookingSuccess(booking);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-gray-900 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Book Court</h2>
              <p className="text-emerald-400">{court.name}</p>
              <p className="text-gray-400">{venue.name}</p>
              <p className="text-gray-300 mt-2">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading && !availableSlots.length ? (
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="mt-4 p-3 bg-red-900/30 text-red-300 rounded-md">
              {error}
            </div>
          ) : success ? (
            <div className="mt-4 p-3 bg-emerald-900/30 text-emerald-300 rounded-md">
              Booking successful! This modal will close shortly.
            </div>
          ) : (
            <>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Available Time Slots</h3>
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <button
                        key={`${slot.start_time}-${slot.end_time}`}
                        onClick={() => handleSlotSelect(slot)}
                        className={`p-3 rounded-md transition-colors ${
                          selectedSlot?.id === slot.id
                            ? 'bg-emerald-800 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                        }`}
                      >
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        <div className="text-xs mt-1">
                          ${(court.hourly_rate || 25).toFixed(2)}/hour
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center text-gray-400">
                      No available slots for this date
                    </div>
                  )}
                </div>
              </div>

              {selectedSlot && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Booking Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="online">Online Payment</option>
                        <option value="cash">Pay at Venue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        rows={2}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleBookingSubmit}
                        disabled={loading}
                        className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Processing...' : 'Confirm Booking'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookSlotModal;
