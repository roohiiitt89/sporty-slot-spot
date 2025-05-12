import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import SportDisplayName from './SportDisplayName';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Declare Razorpay types based on their SDK
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookSlotModalProps {
  onClose: () => void;
  venueId?: string;
  sportId?: string;
}

interface Venue {
  id: string;
  name: string;
}

interface Sport {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  venue_id: string;
  sport_id: string;
  court_group_id: string | null;
  hourly_rate: number;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: string;
}

const ImprovedBookSlotModal: React.FC<BookSlotModalProps> = ({ onClose, venueId, sportId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [venueSports, setVenueSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenue, setSelectedVenue] = useState(venueId || '');
  const [selectedSport, setSelectedSport] = useState(sportId || '');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  useEffect(() => {
    // Check if user is logged in, if not redirect to login
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
    
    // If a venue ID was passed, ensure it's selected
    if (venueId) {
      setSelectedVenue(venueId);
    }
    
    // Setup real-time subscription for bookings
    const bookingChannel = supabase
      .channel('booking-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        // Refresh availability data when a booking is created/updated/deleted
        if (selectedCourt && selectedDate) {
          setRefreshKey(prev => prev + 1);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(bookingChannel);
    };
  }, [venueId, user, navigate, onClose]);

  // Dynamic Razorpay script loading
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
    } else {
      setVenueSports([]);
      setSelectedSport('');
    }
  }, [selectedVenue]);

  useEffect(() => {
    if (selectedVenue && selectedSport) {
      fetchCourts();
    } else {
      setCourts([]);
      setSelectedCourt('');
    }
  }, [selectedVenue, selectedSport]);

  // Effect for fetching availability with the refresh key
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      fetchAvailability(dateString);
    }
  }, [selectedCourt, selectedDate, refreshKey]);

  // Add periodic refresh of availability data
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      // Refresh availability data every 15 seconds
      const intervalId = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 15000);
      
      return () => clearInterval(intervalId);
    }
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();
            
          if (error) {
            throw error;
          }
          
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

  const fetchVenues = async () => {
    setLoading(prev => ({ ...prev, venues: true }));
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('is_active', true);
        
      if (error) {
        throw error;
      }
      
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Error",
        description: "Failed to load venues. Please try again.",
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
        .eq('is_active', true);
        
      if (error) {
        throw error;
      }
      
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast({
        title: "Error",
        description: "Failed to load sports. Please try again.",
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
        .select(`
          sport_id,
          sports:sport_id (id, name)
        `)
        .eq('venue_id', venueId)
        .eq('is_active', true);
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Extract unique sports from courts
        const uniqueSportsMap = new Map();
        data.forEach(item => {
          if (item.sports && !uniqueSportsMap.has(item.sports.id)) {
            uniqueSportsMap.set(item.sports.id, item.sports);
          }
        });
        
        const uniqueSports = Array.from(uniqueSportsMap.values()) as Sport[];
        setVenueSports(uniqueSports);
        
        // If there's only one sport, select it automatically
        if (uniqueSports.length === 1) {
          setSelectedSport(uniqueSports[0].id);
        } 
        // If sportId is provided and exists in the venue sports, select it
        else if (sportId && uniqueSports.some(sport => sport.id === sportId)) {
          setSelectedSport(sportId);
        }
        // Otherwise clear the selection
        else if (!sportId || !uniqueSports.some(sport => sport.id === sportId)) {
          setSelectedSport('');
        }
      }
    } catch (error) {
      console.error('Error fetching venue sports:', error);
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
        .eq('is_active', true);
        
      if (error) {
        throw error;
      }
      
      setCourts(data || []);
      if (data && data.length > 0) {
        setSelectedCourt(data[0].id);
        setCourtRate(data[0].hourly_rate);
      } else {
        setSelectedCourt('');
        setCourtRate(0);
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: "Error",
        description: "Failed to load courts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, courts: false }));
    }
  };

  const fetchAvailability = useCallback(async (dateString: string) => {
    if (!selectedCourt) return;
    
    setLoading(prev => ({ ...prev, availability: true }));
    try {
      // This function automatically checks for conflicts with other courts in the same group
      const { data, error } = await supabase
        .rpc('get_available_slots', { 
          p_court_id: selectedCourt, 
          p_date: dateString
        });
      
      if (error) {
        throw error;
      }
      
      const { data: templateSlots, error: templateError } = await supabase
        .from('template_slots')
        .select('start_time, end_time, price')
        .eq('court_id', selectedCourt);
        
      if (templateError) {
        throw templateError;
      }
      
      const priceMap: Record<string, string> = {};
      templateSlots?.forEach(slot => {
        const key = `${slot.start_time}-${slot.end_time}`;
        priceMap[key] = slot.price;
      });
      
      const slotsWithPrice = data?.map(slot => {
        const key = `${slot.start_time}-${slot.end_time}`;
        return {
          ...slot,
          price: priceMap[key] || courtRate.toString()
        };
      }) || [];
      
      setAvailableTimeSlots(slotsWithPrice);
      
      // Check if any previously selected slots are no longer available
      const updatedSelectedSlots = selectedSlots.filter(slotDisplay => {
        const [startTime, endTime] = slotDisplay.split(' - ').map(t => convertTo24Hour(t));
        const slotStillAvailable = slotsWithPrice.some(slot => 
          slot.start_time === startTime && 
          slot.end_time === endTime && 
          slot.is_available
        );
        
        // If a slot is no longer available, show a toast
        if (!slotStillAvailable && selectedSlots.length > 0) {
          toast({
            title: "Slot no longer available",
            description: `The time slot ${slotDisplay} is no longer available and has been removed from your selection.`,
            variant: "destructive",
          });
          
          // Remove from prices as well
          const updatedPrices = { ...selectedSlotPrices };
          delete updatedPrices[slotDisplay];
          setSelectedSlotPrices(updatedPrices);
        }
        
        return slotStillAvailable;
      });
      
      // Update selected slots if any were removed
      if (updatedSelectedSlots.length !== selectedSlots.length) {
        setSelectedSlots(updatedSelectedSlots);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, availability: false }));
    }
  }, [selectedCourt, courtRate, selectedSlots, selectedSlotPrices]);

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
      // Add the slot without checking for continuity
      const updatedSlots = [...selectedSlots, slotDisplay];
      
      const sortedSlots = updatedSlots.sort((a, b) => {
        const startTimeA = convertTo24Hour(a.split(' - ')[0]);
        const startTimeB = convertTo24Hour(b.split(' - ')[0]);
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
          description: "Please select all required fields to continue.",
          variant: "destructive",
        });
        return;
      }
      if (selectedSlots.length === 0) {
        toast({
          title: "No slots selected",
          description: "Please select at least one time slot to continue.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const createRazorpayOrder = async () => {
    setLoading(prev => ({ ...prev, payment: true }));
    try {
      const totalAmount = calculateTotalPrice();
      const receipt = `booking_${Date.now()}`;
      
      const response = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: totalAmount,
          receipt: receipt,
          notes: {
            court_id: selectedCourt,
            date: format(selectedDate, 'yyyy-MM-dd'),
            slots: selectedSlots.join(', '),
          }
        }
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      toast({
        title: "Payment Error",
        description: "Could not initialize payment. Please try again.",
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
        description: "Please complete all booking details.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create Razorpay order
      const orderData = await createRazorpayOrder();
      if (!orderData) return;
      
      const { order, key_id } = orderData;
      
      // Initialize Razorpay options
      const options = {
        key: key_id, 
        amount: order.amount,
        currency: order.currency,
        name: venues.find(v => v.id === selectedVenue)?.name || "Sports Venue",
        description: `Court Booking for ${format(selectedDate, 'yyyy-MM-dd')}`,
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
          color: "#4f46e5"
        },
        handler: function(response: any) {
          // On successful payment, call the booking function
          handleBooking(response.razorpay_payment_id, response.razorpay_order_id);
        }
      };
      
      // Open Razorpay checkout
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBooking = async (paymentId: string, orderId: string) => {
    if (!selectedCourt || !selectedDate || selectedSlots.length === 0) {
      toast({
        title: "Missing information",
        description: "Please complete all booking details.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a slot",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    // Prevent double submissions
    if (isSubmitting || bookingInProgress) {
      toast({
        title: "Booking in progress",
        description: "Please wait while we process your booking.",
      });
      return;
    }
    
    setIsSubmitting(true);
    setBookingInProgress(true);
    setLoading(prev => ({ ...prev, booking: true }));
    
    try {
      // First refresh availability to ensure selected slots are still available
      await fetchAvailability(format(selectedDate, 'yyyy-MM-dd'));
      
      // If any selected slots were removed during the refresh, stop the booking process
      if (selectedSlots.length === 0) {
        toast({
          title: "Booking failed",
          description: "Your selected slots are no longer available. Please select new time slots.",
          variant: "destructive",
        });
        setLoading(prev => ({ ...prev, booking: false }));
        setIsSubmitting(false);
        setBookingInProgress(false);
        return;
      }
      
      const sortedSlots = [...selectedSlots].sort((a, b) => {
        const startTimeA = convertTo24Hour(a.split(' - ')[0]);
        const startTimeB = convertTo24Hour(b.split(' - ')[0]);
        return startTimeA.localeCompare(startTimeB);
      });
      
      // Identify continuous blocks to minimize the number of bookings
      const bookingBlocks = [];
      let currentBlock = [sortedSlots[0]];
      
      for (let i = 1; i < sortedSlots.length; i++) {
        const currentSlotEnd = convertTo24Hour(currentBlock[currentBlock.length - 1].split(' - ')[1]);
        const nextSlotStart = convertTo24Hour(sortedSlots[i].split(' - ')[0]);
        
        if (currentSlotEnd === nextSlotStart) {
          // Continuous slot, add to current block
          currentBlock.push(sortedSlots[i]);
        } else {
          // Non-continuous, start a new block
          bookingBlocks.push([...currentBlock]);
          currentBlock = [sortedSlots[i]];
        }
      }
      
      // Add the last block
      bookingBlocks.push(currentBlock);
      
      // Use a transaction to ensure all bookings succeed or fail together
      const bookingResults = [];
      
      for (const block of bookingBlocks) {
        const startTime = convertTo24Hour(block[0].split(' - ')[0]);
        const endTime = convertTo24Hour(block[block.length - 1].split(' - ')[1]);
        
        // Calculate price for this block
        const blockPrice = block.reduce((total, slot) => {
          return total + selectedSlotPrices[slot];
        }, 0);
        
        try {
          // Use our enhanced create_booking_with_lock function for concurrency safety
          const { data, error } = await supabase.rpc('create_booking_with_lock', {
            p_court_id: selectedCourt,
            p_user_id: user.id,
            p_booking_date: format(selectedDate, 'yyyy-MM-dd'),
            p_start_time: startTime,
            p_end_time: endTime,
            p_total_price: blockPrice,
            p_payment_reference: paymentId,
            p_payment_status: 'completed'
          });
          
          if (error) {
            throw new Error(error.message || 'Error creating booking');
          }
          
          bookingResults.push(data);
        } catch (error: any) {
          // If there's a conflict or lock issue, propagate the error
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
        description: `You have successfully booked ${bookingResults.length} slot(s).`,
      });
      
      navigate('/profile');
      onClose();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      // Special handling for conflict errors
      if (error.message?.includes('conflicts with an existing reservation') || 
          error.message?.includes('already been booked')) {
        toast({
          title: "Booking unavailable",
          description: "Someone just booked one of your selected slots. Please refresh and select available times.",
          variant: "destructive",
        });
      } else if (error.message?.includes('Another user is currently booking')) {
        toast({
          title: "Booking in progress",
          description: "Another user is currently booking this time slot. Please wait a moment and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Booking failed",
          description: error.message || "There was an issue creating your booking. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(prev => ({ ...prev, booking: false }));
      setIsSubmitting(false);
      setBookingInProgress(false);
    }
  };

  // If user is not logged in, return nothing
  if (!user) {
    return null;
  }

  const formIsComplete = selectedVenue && selectedSport && selectedCourt;
  const canBook = formIsComplete && selectedSlots.length > 0;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="modal-header">Book Your Slot</h2>
          <button 
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {currentStep === 1 ? (
          /* Combined Step 1 & 2 - Venue, Sport, Court, Date and Time Selection */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Select Venue</label>
                <select
                  value={selectedVenue}
                  onChange={e => setSelectedVenue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo bg-white"
                  disabled={loading.venues || !!venueId}
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                  ))}
                </select>
                {loading.venues && <p className="mt-1 text-xs text-gray-500">Loading venues...</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Select Sport</label>
                <select
                  value={selectedSport}
                  onChange={e => setSelectedSport(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo bg-white"
                  disabled={!selectedVenue || venueSports.length === 0}
                >
                  <option value="">Select a sport</option>
                  {venueSports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {selectedVenue && (
                        <SportDisplayName
                          venueId={selectedVenue}
                          sportId={sport.id}
                          defaultName={sport.name}
                        />
                      )}
                    </option>
                  ))}
                </select>
                {!selectedVenue && <p className="mt-1 text-xs text-gray-500">Please select a venue first</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Select Court</label>
                <select
                  value={selectedCourt}
                  onChange={e => {
                    setSelectedCourt(e.target.value);
                    const court = courts.find(c => c.id === e.target.value);
                    if (court) {
                      setCourtRate(court.hourly_rate);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo bg-white"
                  disabled={loading.courts || !selectedVenue || !selectedSport}
                >
                  <option value="">Select a court</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
                {loading.courts && <p className="mt-1 text-xs text-gray-500">Loading courts...</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Select Date</label>
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
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Slots */}
            {formIsComplete && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Select Time Slots</h3>
                
                {loading.availability ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading availability...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableTimeSlots.map((slot) => {
                        const slotDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
                        return (
                          <div
                            key={`${slot.start_time}-${slot.end_time}`}
                            className={`
                              p-3 rounded-md cursor-pointer transition-all text-center
                              ${slot.is_available 
                                ? selectedSlots.includes(slotDisplay) 
                                  ? 'bg-indigo text-white border border-indigo' 
                                  : 'bg-white border border-indigo-light hover:bg-indigo-light/10' 
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'}
                            `}
                            onClick={() => handleSlotClick(slot)}
                          >
                            <div>{slotDisplay}</div>
                            <div className="font-semibold">₹{parseFloat(slot.price).toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {availableTimeSlots.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-md">
                        <p className="text-gray-600">No available time slots found for this date.</p>
                      </div>
                    )}
                  </>
                )}

                {/* Selected slots summary */}
                {selectedSlots.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h4 className="font-medium mb-2">Selected Slots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.sort().map(slot => (
                        <span key={slot} className="bg-indigo text-white px-2 py-1 rounded text-sm">
                          {slot} - ₹{selectedSlotPrices[slot]?.toFixed(2)}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 font-medium">Total Price: ₹{calculateTotalPrice().toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment and Booking Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleNextStep}
                disabled={!canBook || isSubmitting || bookingInProgress}
                variant="default"
                className="py-3 px-6 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors flex items-center font-medium"
              >
                Review & Pay
              </Button>
            </div>
          </div>
        ) : (
          /* Step 3 - Review and Payment */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Booking Details</h3>
