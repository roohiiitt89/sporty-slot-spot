import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, MapPin, Calendar, User, CreditCard, Loader, ChevronRight, Check, ChevronLeft, Activity, RefreshCw, Info, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import SportDisplayName from './SportDisplayName';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId?: string;
  sportId?: string;
}

interface Venue {
  id: string;
  name: string;
  image_url?: string;
}

interface Sport {
  id: string;
  name: string;
  icon_name?: string;
}

interface Court {
  id: string;
  name: string;
  venue_id: string;
  sport_id: string;
  court_group_id: string | null;
  hourly_rate: number;
  description?: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: string;
}

const BookSlotModal: React.FC<BookSlotModalProps> = ({ isOpen, onClose, venueId, sportId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [venueSports, setVenueSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenue, setSelectedVenue] = useState(venueId || '');
  const [selectedSport, setSelectedSport] = useState(sportId || '');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedSlotPrices, setSelectedSlotPrices] = useState<Record<string, number>>({});
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState({
    venues: false,
    sports: false,
    courts: false,
    availability: false,
    booking: false,
    payment: false
  });
  const [courtRate, setCourtRate] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [venueDetails, setVenueDetails] = useState<Venue | null>(null);
  const [sportDetails, setSportDetails] = useState<Sport | null>(null);
  const [courtDetails, setCourtDetails] = useState<Court | null>(null);
  const [selectedCourtGroupId, setSelectedCourtGroupId] = useState<string | null>(null);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const pulse = {
    scale: [1, 1.05, 1],
    transition: { duration: 0.8, repeat: Infinity }
  };

  const padTime = (t: string) => t.length === 5 ? t + ':00' : t;

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a slot",
        variant: "destructive",
      });
      onClose();
      navigate('/login');
      return;
    }
    
    fetchVenues();
    fetchSports();
    
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);

    if (venueId) {
      setSelectedVenue(venueId);
      fetchVenueDetails(venueId);
    }
  }, []);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourt, selectedDate, refreshKey]);

  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      fetchVenueSports(selectedVenue);
      fetchVenueDetails(selectedVenue);
    } else {
      setVenueSports([]);
      setSelectedSport('');
      setVenueDetails(null);
    }
  }, [selectedVenue]);

  useEffect(() => {
    if (selectedVenue && selectedSport) {
      fetchCourts();
      fetchSportDetails(selectedSport);
    } else {
      setCourts([]);
      setSelectedCourt('');
      setSportDetails(null);
    }
  }, [selectedVenue, selectedSport]);

  useEffect(() => {
    if (selectedCourt) {
      fetchAvailability();
      fetchCourtDetails(selectedCourt);
    }
  }, [selectedCourt, refreshKey]);

  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setName(data.full_name || '');
            setPhone(data.phone || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    // Only set selectedDate to today on mount
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (courtDetails && 'court_group_id' in courtDetails) {
      setSelectedCourtGroupId(courtDetails.court_group_id || null);
    } else {
      setSelectedCourtGroupId(null);
    }
  }, [courtDetails, selectedCourt]);

  useEffect(() => {
    // Clear selected slots and prices when date, court, venue, or court group changes
    setSelectedSlots([]);
    setSelectedSlotPrices({});
  }, [selectedDate, selectedCourt, selectedVenue, selectedCourtGroupId]);

  useEffect(() => {
    // When user changes (login/logout), reset slot state and fetch fresh availability
    setSelectedSlots([]);
    setSelectedSlotPrices({});
    setAvailableTimeSlots([]);
    if (user && selectedCourt && selectedDate) {
      fetchAvailability();
    }
    // Optionally, reset other state if needed
    // setCurrentStep(1);
  }, [user]);

  const fetchVenueDetails = async (venueId: string) => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();
        
      if (error) throw error;
      
      setVenueDetails(data);
    } catch (error) {
      console.error('Error fetching venue details:', error);
    }
  };

  const fetchSportDetails = async (sportId: string) => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('*')
        .eq('id', sportId)
        .single();
        
      if (error) throw error;
      
      setSportDetails(data);
    } catch (error) {
      console.error('Error fetching sport details:', error);
    }
  };

  const fetchCourtDetails = async (courtId: string) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('id', courtId)
        .single();
        
      if (error) throw error;
      
      setCourtDetails(data);
    } catch (error) {
      console.error('Error fetching court details:', error);
    }
  };

  const fetchVenues = async () => {
    setLoading(prev => ({ ...prev, venues: true }));
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, image_url')
        .eq('is_active', true)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Error",
        description: "Failed to load venues",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, venues: false }));
    }
  };

  const fetchSports = async () => {
    setLoading(prev => ({ ...prev, sports: true }));
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast({
        title: "Error",
        description: "Failed to load sports",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, sports: false }));
    }
  };

  const fetchVenueSports = async (venueId: string) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select(`sport_id, sports:sport_id (id, name)`)
        .eq('venue_id', venueId)
        .eq('is_active', true);
        
      if (error) throw error;
      
      if (data) {
        const uniqueSportsMap = new Map<string, Sport>();
        data.forEach(item => {
          if (item.sports && !uniqueSportsMap.has(item.sports.id)) {
            uniqueSportsMap.set(item.sports.id, item.sports as Sport);
          }
        });
        
        const uniqueSports = Array.from(uniqueSportsMap.values());
        setVenueSports(uniqueSports);
        
        if (uniqueSports.length === 1) {
          setSelectedSport(uniqueSports[0].id);
        } 
        else if (sportId && uniqueSports.some(sport => sport.id === sportId)) {
          setSelectedSport(sportId);
        }
        else if (!sportId || !uniqueSports.some(sport => sport.id === sportId)) {
          setSelectedSport('');
        }
      }
    } catch (error) {
      console.error('Error fetching venue sports:', error);
      toast({
        title: "Error",
        description: "Failed to load sports for this venue",
        variant: "destructive",
      });
    }
  };

  const fetchCourts = async () => {
    setLoading(prev => ({ ...prev, courts: true }));
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, venue_id, sport_id, court_group_id, hourly_rate')
        .eq('venue_id', selectedVenue)
        .eq('sport_id', selectedSport)
        .eq('is_active', true)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      setCourts(data || []);
      if (data && data.length > 0) {
        setSelectedCourt(data[0].id);
        setCourtRate(data[0].hourly_rate);
      } else {
        setSelectedCourt('');
        setCourtRate(0);
        toast({
          title: "No Courts Available",
          description: "There are no available courts for this sport at the selected venue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: "Error",
        description: "Failed to load courts",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, courts: false }));
    }
  };

  const fetchAvailability = useCallback(async () => {
    if (!selectedCourt || !selectedDate) return;
    
    setLoading(prev => ({ ...prev, availability: true }));
    try {
      let courtIdsToCheck = [selectedCourt];
      // If shared court group, get all court IDs in the group
      if (selectedCourtGroupId) {
        const { data: groupCourts, error: groupCourtsError } = await supabase
          .from('courts')
          .select('id')
          .eq('court_group_id', selectedCourtGroupId)
          .eq('is_active', true);
        if (groupCourtsError) throw groupCourtsError;
        courtIdsToCheck = groupCourts.map((c: { id: string }) => c.id);
      }

      // Fetch slots for the selected court (for template/pricing)
      const { data, error } = await supabase
        .rpc('get_available_slots', {
          p_court_id: selectedCourt,
          p_date: selectedDate
        });
      if (error) throw error;

      // Fetch template slots for pricing
      const { data: templateSlots, error: templateError } = await supabase
        .from('template_slots')
        .select('start_time, end_time, price')
        .eq('court_id', selectedCourt);
      if (templateError) throw templateError;
      const priceMap: Record<string, string> = {};
      templateSlots?.forEach(slot => {
        const key = `${slot.start_time}-${slot.end_time}`;
        priceMap[key] = slot.price;
      });

      // Fetch bookings for all courts in the group (or just the selected court)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('court_id, start_time, end_time, booking_date')
        .in('court_id', courtIdsToCheck)
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'pending']);
      if (bookingsError) throw bookingsError;
      console.log('Fetched bookings for courts', courtIdsToCheck, 'on', selectedDate, bookings);

      // Mark slots as unavailable if booked in any court in the group
      const slotsWithPrice = data?.map(slot => {
        const key = `${slot.start_time}-${slot.end_time}`;
        // Normalize times to 'HH:mm:ss'
        const slotStart = padTime(slot.start_time);
        const slotEnd = padTime(slot.end_time);
        const isBooked = bookings?.some(b =>
          padTime(b.start_time) === slotStart &&
          padTime(b.end_time) === slotEnd
        );
        return {
          ...slot,
          is_available: slot.is_available && !isBooked,
          price: priceMap[key] || courtRate.toString()
        };
      }) || [];

      setAvailableTimeSlots(slotsWithPrice);

      const updatedSelectedSlots = selectedSlots.filter(slotDisplay => {
        const [startTime, endTime] = slotDisplay.split(' - ').map(t => padTime(t));
        const slotStillAvailable = slotsWithPrice.some(slot =>
          padTime(slot.start_time) === startTime &&
          padTime(slot.end_time) === endTime &&
          slot.is_available
        );
        if (!slotStillAvailable && selectedSlots.length > 0) {
          toast({
            title: "Slot no longer available",
            description: `The time slot ${slotDisplay} is no longer available`,
            variant: "destructive",
          });
          const updatedPrices = { ...selectedSlotPrices };
          delete updatedPrices[slotDisplay];
          setSelectedSlotPrices(updatedPrices);
        }
        return slotStillAvailable;
      });
      if (updatedSelectedSlots.length !== selectedSlots.length) {
        setSelectedSlots(updatedSelectedSlots);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, availability: false }));
    }
  }, [selectedCourt, selectedDate, courtRate, selectedSlots, selectedSlotPrices, selectedCourtGroupId]);

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(n => parseInt(n));
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    let hoursNum = parseInt(hours, 10);
    
    if (hours === '12') {
      hoursNum = modifier === 'PM' ? 12 : 0;
    } else if (modifier === 'PM') {
      hoursNum += 12;
    }
    
    return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.is_available) return;
    
    const slotDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
    const slotPrice = parseFloat(slot.price);
    
    if (selectedSlots.includes(slotDisplay)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotDisplay));
      
      const newSelectedSlotPrices = { ...selectedSlotPrices };
      delete newSelectedSlotPrices[slotDisplay];
      setSelectedSlotPrices(newSelectedSlotPrices);
    } else {
      const updatedSlots = [...selectedSlots, slotDisplay];
      
      const sortedSlots = updatedSlots.sort((a, b) => {
        const startTimeA = padTime(a.split(' - ')[0]);
        const startTimeB = padTime(b.split(' - ')[0]);
        return startTimeA.localeCompare(startTimeB);
      });
      
      setSelectedSlots(sortedSlots);
      
      setSelectedSlotPrices({
        ...selectedSlotPrices,
        [slotDisplay]: slotPrice
      });
    }
  };

  const calculateTotalPrice = () => {
    return Object.values(selectedSlotPrices).reduce((total, price) => total + price, 0);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedVenue || !selectedSport || !selectedCourt || !selectedDate) {
        toast({
          title: "Missing information",
          description: "Please select all required fields",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedSlots.length === 0) {
        toast({
          title: "No slots selected",
          description: "Please select at least one time slot",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    if (currentStep === 3 && selectedCourt && selectedDate) {
      fetchAvailability();
    }
  };

  const createRazorpayOrder = async () => {
    setLoading(prev => ({ ...prev, payment: true }));
    try {
      // Fix: Convert to paise without additional multiplication as createRazorpayOrder now handles it
      const totalAmountInPaise = Math.round(calculateTotalPrice() * 100); // Convert rupees to paise
      const receipt = `booking_${Date.now()}`;
      
      const response = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totalAmountInPaise, // Send amount already in paise
          receipt: receipt,
          notes: {
            court_id: selectedCourt,
            date: selectedDate,
            slots: selectedSlots.join(', '),
          }
        }
      });
      
      if (response.error) throw new Error(response.error);
      
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      toast({
        title: "Payment Error",
        description: "Could not initialize payment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(prev => ({ ...prev, payment: false }));
    }
  };

  const handlePayment = async () => {
    if (!user || !selectedCourt || !selectedDate || selectedSlots.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all booking details",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const orderData = await createRazorpayOrder();
      if (!orderData) return;
      
      const { order, key_id } = orderData;
      
      const options = {
        key: key_id, 
        amount: order.amount,
        currency: order.currency,
        name: venues.find(v => v.id === selectedVenue)?.name || "Sports Venue",
        description: `Court Booking for ${selectedDate}`,
        order_id: order.id,
        prefill: {
          name: name,
          email: user.email,
          contact: phone,
        },
        notes: {
          address: "Sports Venue Address"
        },
        theme: {
          color: "#047857" // Emerald-800
        },
        handler: function(response: any) {
          handleBooking(response.razorpay_payment_id, response.razorpay_order_id);
        },
        modal: {
          ondismiss: function() {
            toast({
              title: "Payment Cancelled",
              description: "Your booking was not completed",
              variant: "destructive",
            });
          }
        }
      };
      
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  const handleBooking = async (paymentId: string, orderId: string) => {
    if (!selectedCourt || !selectedDate || selectedSlots.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all booking details",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a slot",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (isSubmitting || bookingInProgress) {
      toast({
        title: "Booking in progress",
        description: "Please wait while we process your booking",
      });
      return;
    }
    
    setIsSubmitting(true);
    setBookingInProgress(true);
    setLoading(prev => ({ ...prev, booking: true }));
    
    try {
      await fetchAvailability();
      
      if (selectedSlots.length === 0) {
        toast({
          title: "Booking failed",
          description: "Your selected slots are no longer available",
          variant: "destructive",
        });
        setCurrentStep(2);
        setLoading(prev => ({ ...prev, booking: false }));
        setIsSubmitting(false);
        setBookingInProgress(false);
        return;
      }
      
      const sortedSlots = [...selectedSlots].sort((a, b) => {
        const startTimeA = padTime(a.split(' - ')[0]);
        const startTimeB = padTime(b.split(' - ')[0]);
        return startTimeA.localeCompare(startTimeB);
      });
      
      const bookingBlocks = [];
      let currentBlock = [sortedSlots[0]];
      
      for (let i = 1; i < sortedSlots.length; i++) {
        const currentSlotEnd = padTime(currentBlock[currentBlock.length - 1].split(' - ')[1]);
        const nextSlotStart = padTime(sortedSlots[i].split(' - ')[0]);
        
        if (currentSlotEnd === nextSlotStart) {
          currentBlock.push(sortedSlots[i]);
        } else {
          bookingBlocks.push([...currentBlock]);
          currentBlock = [sortedSlots[i]];
        }
      }
      
      bookingBlocks.push(currentBlock);
      
      const bookingResults = [];
      
      for (const block of bookingBlocks) {
        const startTime = padTime(block[0].split(' - ')[0]);
        const endTime = padTime(block[block.length - 1].split(' - ')[1]);
        
        const blockPrice = block.reduce((total, slot) => {
          return total + selectedSlotPrices[slot];
        }, 0);
        
        try {
          const { data, error } = await supabase.rpc('create_booking_with_lock', {
            p_court_id: selectedCourt,
            p_user_id: user.id,
            p_booking_date: selectedDate,
            p_start_time: startTime,
            p_end_time: endTime,
            p_total_price: blockPrice,
            p_payment_reference: paymentId,
            p_payment_status: 'completed'
          });
          
          if (error) throw new Error(error.message || 'Error creating booking');
          
          bookingResults.push(data);
        } catch (error: any) {
          if (error.message?.includes('conflicts with an existing reservation') || 
              error.message?.includes('already been booked') ||
              error.message?.includes('Another user is currently booking')) {
            throw new Error(error.message);
          }
          throw error;
        }
      }
      
      toast({
        title: "Booking successful!",
        description: `You have successfully booked ${bookingResults.length} slot(s)`,
      });
      
      navigate('/profile');
      onClose();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      if (error.message?.includes('conflicts with an existing reservation') || 
          error.message?.includes('already been booked')) {
        toast({
          title: "Booking unavailable",
          description: "Someone just booked one of your selected slots",
          variant: "destructive",
        });
      } else if (error.message?.includes('Another user is currently booking')) {
        toast({
          title: "Booking in progress",
          description: "Another user is currently booking this time slot",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Booking failed",
          description: error.message || "There was an issue creating your booking",
          variant: "destructive",
        });
      }
      
      setCurrentStep(2);
      setRefreshKey(prev => prev + 1);
    } finally {
      setLoading(prev => ({ ...prev, booking: false }));
      setIsSubmitting(false);
      setBookingInProgress(false);
    }
  };

  // In the real-time subscription, listen for bookings on all courts in the group
  useEffect(() => {
    if (!user) return;
    let bookingChannel;
    let courtIdsToCheck = [selectedCourt];
    const subscribe = async () => {
      if (selectedCourtGroupId) {
        const { data: groupCourts } = await supabase
          .from('courts')
          .select('id')
          .eq('court_group_id', selectedCourtGroupId)
          .eq('is_active', true);
        courtIdsToCheck = groupCourts.map((c: { id: string }) => c.id);
      }
      bookingChannel = supabase
        .channel('booking-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: courtIdsToCheck.length > 1
            ? `court_id=in.(${courtIdsToCheck.join(',')}),booking_date=eq.${selectedDate}`
            : `court_id=eq.${selectedCourt},booking_date=eq.${selectedDate}`
        }, (payload) => {
          // Always refresh on any relevant booking change
          fetchAvailability();
        })
        .subscribe();
    };
    subscribe();
    return () => {
      if (bookingChannel) supabase.removeChannel(bookingChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCourt, selectedDate, selectedCourtGroupId]);

  if (!user) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={
        `fixed inset-0 bg-black/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4 overflow-y-auto flex flex-col min-h-[60vh] sm:min-h-[70vh] md:min-h-[60vh] p-0 sm:p-0 md:p-0`
      }
    >
      {bookingInProgress && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black bg-opacity-800 min-h-screen w-full">
          <Loader className="animate-spin text-emerald-400" size={48} />
          <p className="mt-4 text-lg text-white font-semibold">Booking in progress...</p>
        </div>
      )}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-emerald-800/30 mb-24"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/90 z-10 p-6 border-b border-emerald-800/20 flex justify-between items-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-emerald-400" size={24} />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
              Book Your Slot
            </span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800/50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-6 pb-4 border-b border-emerald-800/20">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    Number(currentStep) === Number(step)
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-800/30' 
                      : Number(currentStep) > Number(step)
                        ? 'bg-emerald-800/80 text-emerald-200' 
                        : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {Number(currentStep) > Number(step) ? (
                    <Check size={18} className="text-emerald-200" />
                  ) : (
                    <span className="font-medium">{step}</span>
                  )}
                </motion.div>
                {step < 3 && (
                  <div className={`w-16 h-1 transition-all duration-300 ${
                    Number(currentStep) > Number(step) ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' : 'bg-gray-700'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className={currentStep === 1 ? 'text-emerald-400 font-medium' : 'text-gray-500'}>Details</span>
            <span className={currentStep === 2 ? 'text-emerald-400 font-medium' : 'text-gray-500'}>Slots</span>
            <span className={currentStep === 3 ? 'text-emerald-400 font-medium' : 'text-gray-500'}>Confirm</span>
          </div>
        </div>

        {/* Step 1: Venue/Sport Selection */}
        {currentStep === 1 && (
          <motion.div 
            initial="hidden"
            animate={"visible"}
            variants={staggerContainer}
            className="p-6 space-y-6"
          >
            <motion.div variants={fadeIn} className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" />
                Select Venue
              </label>
              <select
                value={selectedVenue}
                onChange={e => {
                  setSelectedVenue(e.target.value);
                  fetchVenueDetails(e.target.value);
                }}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400 transition-all"
                disabled={loading.venues || !!venueId}
              >
                <option value="" className="bg-gray-800">Select a venue</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id} className="bg-gray-800">{venue.name}</option>
                ))}
              </select>
              {loading.venues && (
                <motion.p 
                  animate={pulse}
                  className="mt-1 text-xs text-gray-500 flex items-center gap-1"
                >
                  <Loader size={14} className="animate-spin" />
                  Loading venues...
                </motion.p>
              )}
              {venueDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-emerald-800/20"
                >
                  <div className="flex items-start gap-3">
                    {venueDetails.image_url && (
                      <div className="w-16 h-16 rounded-md overflow-hidden">
                        <img 
                          src={venueDetails.image_url} 
                          alt={venueDetails.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-emerald-400">{venueDetails.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">Select a sport available at this venue</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            <motion.div variants={fadeIn} className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                Select Sport
              </label>
              
              {!selectedVenue ? (
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <Info size={14} />
                  Please select a venue first
                </p>
              ) : venueSports.length === 0 ? (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  No sports available for this venue
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {venueSports.map((sport) => (
                    <motion.div
                      key={sport.id}
                      whileHover={{ scale: 1.03 }}
                      className="flex items-center"
                    >
                      <input
                        type="radio"
                        id={`sport-${sport.id}`}
                        name="sport"
                        value={sport.id}
                        checked={selectedSport === sport.id}
                        onChange={() => {
                          setSelectedSport(sport.id);
                          fetchSportDetails(sport.id);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor={`sport-${sport.id}`}
                        className={`flex items-center justify-center gap-1 w-full p-2 rounded-lg border text-sm transition-all cursor-pointer ${
                          selectedSport === sport.id
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-800/20'
                            : 'bg-gray-800 border-gray-600 hover:border-emerald-500 hover:bg-gray-750 text-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedSport === sport.id 
                            ? 'border-white bg-white' 
                            : 'border-gray-400'
                        }`}>
                          {selectedSport === sport.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                          )}
                        </div>
                        {selectedVenue ? (
                          <SportDisplayName
                            venueId={selectedVenue}
                            sportId={sport.id}
                            defaultName={sport.name}
                          />
                        ) : (
                          sport.name
                        )}
                      </label>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {sportDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-emerald-800/20"
                >
                  <div className="flex items-center gap-3">
                    {sportDetails.icon_name && (
                      <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                        <span className="text-emerald-400">{sportDetails.icon_name}</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-emerald-400">
                        {selectedVenue ? (
                          <SportDisplayName
                            venueId={selectedVenue}
                            sportId={sportDetails.id}
                            defaultName={sportDetails.name}
                          />
                        ) : (
                          sportDetails.name
                        )}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">Select a court for this sport</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            <motion.div variants={fadeIn} className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" />
                Select Court
              </label>
              
              {loading.courts ? (
                <motion.p 
                  animate={pulse}
                  className="mt-1 text-xs text-gray-500 flex items-center gap-1"
                >
                  <Loader size={14} className="animate-spin" />
                  Loading courts...
                </motion.p>
              ) : !selectedVenue || !selectedSport ? (
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                  <Info size={14} />
                  Please select a venue and sport first
                </p>
              ) : courts.length === 0 ? (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={14} />
                  No courts available for this venue and sport combination.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {courts.map((court) => (
                    <motion.div
                      key={court.id}
                      whileHover={{ scale: 1.03 }}
                      className="flex items-center"
                    >
                      <input
                        type="radio"
                        id={`court-${court.id}`}
                        name="court"
                        value={court.id}
                        checked={selectedCourt === court.id}
                        onChange={() => {
                          setSelectedCourt(court.id);
                          setCourtRate(court.hourly_rate);
                          fetchCourtDetails(court.id);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor={`court-${court.id}`}
                        className={`flex items-center justify-center gap-1 w-full p-2 rounded-lg border text-sm transition-all cursor-pointer ${
                          selectedCourt === court.id
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-800/20'
                            : 'bg-gray-800 border-gray-600 hover:border-emerald-500 hover:bg-gray-750 text-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedCourt === court.id 
                            ? 'border-white bg-white' 
                            : 'border-gray-400'
                        }`}>
                          {selectedCourt === court.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{court.name}</span>
                          {court.court_group_id && (
                            <span className="text-xs">🏟️</span>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {selectedCourt && courtDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-emerald-800/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                      <span className="text-emerald-400">🏟️</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-emerald-400">{courtDetails.name}</h4>
                      {courtDetails.description && (
                        <p className="text-xs text-gray-400 mt-1">{courtDetails.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded-full">
                          
                        </span>
                        {courtDetails.court_group_id && (
                          <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded-full">
                            Shared Space
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            <motion.div variants={fadeIn} className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-400" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-gray-400 transition-all"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Time Slot Selection */}
        {currentStep === 2 && (
          <motion.div 
            initial="hidden"
            animate={"visible"}
            variants={staggerContainer}
            className="p-6"
          >
            <motion.div variants={fadeIn} className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock size={20} className="text-emerald-400" />
                Select Time Slots
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Available slots for {selectedDate} at {courts.find(c => c.id === selectedCourt)?.name}
              </p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mb-4 flex justify-between items-center">
              <p className="text-sm font-medium text-gray-300">
                Showing availability for: <span className="text-emerald-400">{format(new Date(selectedDate), 'PPP')}</span>
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLoading(prev => ({ ...prev, availability: true }));
                  setRefreshKey(prev => prev + 1);
                }}
                disabled={loading.availability}
                className={`text-sm flex items-center gap-1 transition-colors ${loading.availability ? 'text-gray-500 cursor-not-allowed' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                <RefreshCw size={14} className={loading.availability ? 'animate-spin' : ''} />
                Refresh
              </motion.button>
            </motion.div>
            
            {loading.availability ? (
              <motion.div 
                variants={fadeIn}
                className="flex flex-col items-center justify-center py-8"
              >
                <Loader className="animate-spin text-emerald-400" size={24} />
                <p className="mt-2 text-sm text-gray-400">Loading availability...</p>
              </motion.div>
            ) : (
              <>
                <motion.div 
                  variants={staggerContainer}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                >
                  {availableTimeSlots.map((slot) => {
                    const slotDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
                    const isSelected = selectedSlots.includes(slotDisplay);
                    return (
                      <motion.button
                        key={`${slot.start_time}-${slot.end_time}`}
                        variants={slideUp}
                        whileHover={{ scale: slot.is_available ? 1.03 : 1 }}
                        whileTap={{ scale: slot.is_available ? 0.98 : 1 }}
                        disabled={!slot.is_available}
                        onClick={() => handleSlotClick(slot)}
                        className={`
                          p-2 rounded-lg border transition-all text-center text-sm transform
                          ${slot.is_available 
                            ? isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-800/30'
                              : 'bg-gray-800 border-gray-600 hover:border-emerald-500 hover:bg-gray-750 text-gray-200'
                            : 'bg-red-900/60 border-red-800 text-red-200 cursor-not-allowed'}
                          ${isSelected ? 'ring-2 ring-emerald-400' : ''}
                        `}
                      >
                        <div className="font-medium">{slotDisplay}</div>
                        <div className="text-xs mt-1">₹{parseFloat(slot.price).toFixed(2)}</div>
                      </motion.button>
                    );
                  })}
                </motion.div>
                
                {availableTimeSlots.length === 0 && (
                  <motion.div 
                    variants={fadeIn}
                    className="text-center py-8 bg-gray-800/50 rounded-lg border border-emerald-800/20 mt-4"
                  >
                    <p className="text-gray-400">No available time slots found for this date.</p>
                  </motion.div>
                )}
                
                <motion.div 
                  variants={fadeIn}
                  className="mt-6 flex flex-wrap items-center gap-3 text-xs"
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-600 rounded-full mr-2"></div>
                    <span className="text-gray-300">Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-800 border border-gray-600 rounded-full mr-2"></div>
                    <span className="text-gray-300">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-900/60 rounded-full mr-2"></div>
                    <span className="text-gray-300">Booked</span>
                  </div>
                </motion.div>
                
                {selectedSlots.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-emerald-900/20 rounded-lg border border-emerald-800/30"
                  >
                    <h4 className="font-medium text-emerald-300 mb-2">Selected Slots</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.sort().map(slot => (
                        <motion.span 
                          key={slot} 
                          whileHover={{ scale: 1.05 }}
                          className="bg-emerald-800/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {slot.split(' - ')[0]} <ChevronRight size={14} /> {slot.split(' - ')[1]}
                          <span className="font-semibold ml-1">₹{selectedSlotPrices[slot]?.toFixed(2)}</span>
                        </motion.span>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-800/30 flex justify-between">
                      <span className="font-medium text-emerald-300">Total:</span>
                      <span className="text-lg font-bold text-emerald-400">₹{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <motion.div 
            initial="hidden"
            animate={"visible"}
            variants={staggerContainer}
            className="p-6"
          >
            <motion.div variants={fadeIn} className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Check size={20} className="text-emerald-400" />
                Confirm Your Booking
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Review your booking details before payment
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking Summary */}
              <motion.div 
                variants={slideUp}
                className="bg-gray-800/50 rounded-xl p-5 border border-emerald-800/30"
              >
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-400" />
                  Booking Summary
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Venue:</span>
                    <span className="text-sm font-medium text-white">
                      {venues.find(v => v.id === selectedVenue)?.name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Sport:</span>
                    <span className="text-sm font-medium text-white">
                      {selectedVenue && selectedSport && (
                        <SportDisplayName 
                          venueId={selectedVenue}
                          sportId={selectedSport}
                          defaultName={sports.find(s => s.id === selectedSport)?.name || ''}
                        />
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Court:</span>
                    <span className="text-sm font-medium text-white">
                      {courts.find(c => c.id === selectedCourt)?.name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Date:</span>
                    <span className="text-sm font-medium text-white">
                      {format(new Date(selectedDate), 'PPP')}
                    </span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-emerald-800/30">
                    <h5 className="text-sm font-medium text-emerald-300 mb-2">Selected Slots:</h5>
                    <ul className="space-y-2">
                      {selectedSlots.sort().map(slot => (
                        <li key={slot} className="flex justify-between text-sm">
                          <span className="text-gray-300">{slot}</span>
                          <span className="font-medium text-white">₹{selectedSlotPrices[slot]?.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-emerald-800/30 flex justify-between">
                    <span className="font-medium text-emerald-300">Total:</span>
                    <span className="font-bold text-emerald-400">₹{calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>

              {/* User Information */}
              <motion.div 
                variants={slideUp}
                className="bg-gray-800/50 rounded-xl p-5 border border-emerald-800/30"
              >
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <User size={18} className="text-emerald-400" />
                  Your Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Name:</span>
                    <span className="text-sm font-medium text-white">{name || user.email}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Email:</span>
                    <span className="text-sm font-medium text-white">{user.email}</span>
                  </div>
                  
                  {phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Phone:</span>
                      <span className="text-sm font-medium text-white">{phone}</span>
                    </div>
                  )}
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="mt-4 p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/30"
                  >
                    <h5 className="text-sm font-medium text-emerald-300 flex items-center gap-2 mb-1">
                      <CreditCard size={16} />
                      Payment Method
                    </h5>
                    <p className="text-xs text-emerald-200">
                      You'll be redirected to Razorpay's secure payment gateway to complete your booking.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 to-gray-900/80 border-t border-emerald-800/20 p-4 backdrop-blur-sm">
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <motion.div whileHover={{ scale: 1.03 }}>
                <Button
                  onClick={handlePreviousStep}
                  variant="outline"
                  disabled={isSubmitting || bookingInProgress}
                  className="gap-2 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-emerald-500 transition-all"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
              </motion.div>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <motion.div whileHover={{ scale: 1.03 }}>
                <Button
                  onClick={handleNextStep}
                  disabled={isSubmitting || bookingInProgress}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-800/30 transition-all"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.03 }}>
                <Button
                  onClick={handlePayment}
                  disabled={isSubmitting || bookingInProgress || loading.booking || loading.payment}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-800/30 transition-all"
                >
                  {loading.booking || loading.payment ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <CreditCard size={16} />
                  )}
                  Pay & Confirm Booking
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <style>
        {`
        .animate-spin-once {
          animation: spinOnce 0.5s ease-out;
        }
        @keyframes spinOnce {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        `}
      </style>
    </motion.div>
  );
};

export default BookSlotModal;

</edits_to_apply>
