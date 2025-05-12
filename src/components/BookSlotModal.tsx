import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, MapPin, Calendar, User, CreditCard, Loader, ChevronRight, Check, ChevronLeft, Activity, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import SportDisplayName from './SportDisplayName';
import { Button } from '@/components/ui/button';

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

const BookSlotModal: React.FC<BookSlotModalProps> = ({ onClose, venueId, sportId }) => {
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
    }
    
    const bookingChannel = supabase
      .channel('booking-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, (payload) => {
        console.log('Booking change detected:', payload);
        if (selectedCourt && selectedDate) {
          setRefreshKey(prev => prev + 1);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(bookingChannel);
    };
  }, [venueId, user, navigate, onClose]);

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

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchAvailability();
    }
  }, [selectedCourt, selectedDate, refreshKey]);

  useEffect(() => {
    if (currentStep === 2 && selectedCourt && selectedDate) {
      const intervalId = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 15000);
      
      return () => clearInterval(intervalId);
    }
  }, [currentStep, selectedCourt, selectedDate]);

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

  const fetchVenues = async () => {
    setLoading(prev => ({ ...prev, venues: true }));
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('is_active', true);
        
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
        .eq('is_active', true);
        
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
        const uniqueSportsMap = new Map();
        data.forEach(item => {
          if (item.sports && !uniqueSportsMap.has(item.sports.id)) {
            uniqueSportsMap.set(item.sports.id, item.sports);
          }
        });
        
        const uniqueSports = Array.from(uniqueSportsMap.values()) as Sport[];
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
        
      if (error) throw error;
      
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
      const { data, error } = await supabase
        .rpc('get_available_slots', { 
          p_court_id: selectedCourt, 
          p_date: selectedDate 
        });
      
      if (error) throw error;
      
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
      
      const slotsWithPrice = data?.map(slot => {
        const key = `${slot.start_time}-${slot.end_time}`;
        return {
          ...slot,
          price: priceMap[key] || courtRate.toString()
        };
      }) || [];
      
      setAvailableTimeSlots(slotsWithPrice);
      
      const updatedSelectedSlots = selectedSlots.filter(slotDisplay => {
        const [startTime, endTime] = slotDisplay.split(' - ').map(t => convertTo24Hour(t));
        const slotStillAvailable = slotsWithPrice.some(slot => 
          slot.start_time === startTime && 
          slot.end_time === endTime && 
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
  }, [selectedCourt, selectedDate, courtRate, selectedSlots, selectedSlotPrices]);

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
          color: "#10b981"
        },
        handler: function(response: any) {
          handleBooking(response.razorpay_payment_id, response.razorpay_order_id);
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
        const startTimeA = convertTo24Hour(a.split(' - ')[0]);
        const startTimeB = convertTo24Hour(b.split(' - ')[0]);
        return startTimeA.localeCompare(startTimeB);
      });
      
      const bookingBlocks = [];
      let currentBlock = [sortedSlots[0]];
      
      for (let i = 1; i < sortedSlots.length; i++) {
        const currentSlotEnd = convertTo24Hour(currentBlock[currentBlock.length - 1].split(' - ')[1]);
        const nextSlotStart = convertTo24Hour(sortedSlots[i].split(' - ')[0]);
        
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
        const startTime = convertTo24Hour(block[0].split(' - ')[0]);
        const endTime = convertTo24Hour(block[block.length - 1].split(' - ')[1]);
        
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

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-indigo-600" size={24} />
            Book Your Slot
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'} transition-colors`}>
                  {currentStep > step ? (
                    <Check size={18} />
                  ) : (
                    <span className="font-medium">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 ${currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'} transition-colors`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span className={currentStep === 1 ? 'text-indigo-600 font-medium' : ''}>Details</span>
            <span className={currentStep === 2 ? 'text-indigo-600 font-medium' : ''}>Slots</span>
            <span className={currentStep === 3 ? 'text-indigo-600 font-medium' : ''}>Confirm</span>
          </div>
        </div>

        {/* Step 1: Venue/Sport Selection */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                Select Venue
              </label>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                disabled={loading.venues || !!venueId}
              >
                <option value="">Select a venue</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
              {loading.venues && <p className="mt-1 text-xs text-gray-500">Loading venues...</p>}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" />
                Select Sport
              </label>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                disabled={!selectedVenue || venueSports.length === 0}
              >
                <option value="">Select a sport</option>
                {venueSports.map(sport => (
                  <option key={sport.id} value={sport.id}>
                    {selectedVenue ? (
                      <SportDisplayName
                        venueId={selectedVenue}
                        sportId={sport.id}
                        defaultName={sport.name}
                      />
                    ) : (
                      sport.name
                    )}
                  </option>
                ))}
              </select>
              {!selectedVenue && <p className="mt-1 text-xs text-gray-500">Please select a venue first</p>}
              {selectedVenue && venueSports.length === 0 && <p className="mt-1 text-xs text-gray-500">No sports available for this venue</p>}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-500" />
                Select Court
              </label>
              <select
                value={selectedCourt}
                onChange={e => {
                  setSelectedCourt(e.target.value);
                  const court = courts.find(c => c.id === e.target.value);
                  if (court) {
                    setCourtRate(court.hourly_rate);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                disabled={loading.courts || !selectedVenue || !selectedSport}
              >
                <option value="">Select a court</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
              {loading.courts && <p className="mt-1 text-xs text-gray-500">Loading courts...</p>}
              {!loading.courts && courts.length === 0 && selectedVenue && selectedSport && (
                <p className="mt-1 text-xs text-red-500">No courts available for this venue and sport combination.</p>
              )}
              {selectedCourt && courts.find(c => c.id === selectedCourt)?.court_group_id && (
                <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  Note: This court shares physical space with other sports. Bookings on one will affect availability on others.
                </p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" />
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Step 2: Time Slot Selection */}
        {currentStep === 2 && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={20} className="text-indigo-500" />
                Select Time Slots
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Available slots for {selectedDate} at {courts.find(c => c.id === selectedCourt)?.name}
              </p>
            </div>
            
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">
                Showing availability for: <span className="text-indigo-600">{format(new Date(selectedDate), 'PPP')}</span>
              </p>
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
            
            {loading.availability ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader className="animate-spin text-indigo-500" size={24} />
                <p className="mt-2 text-sm text-gray-500">Loading availability...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableTimeSlots.map((slot) => {
                    const slotDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
                    const isSelected = selectedSlots.includes(slotDisplay);
                    return (
                      <button
                        key={`${slot.start_time}-${slot.end_time}`}
                        disabled={!slot.is_available}
                        onClick={() => handleSlotClick(slot)}
                        className={`
                          p-3 rounded-lg border transition-all text-center
                          ${slot.is_available 
                            ? isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                              : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}
                          ${isSelected ? 'ring-2 ring-indigo-400' : ''}
                        `}
                      >
                        <div className="font-medium">{slotDisplay}</div>
                        <div className="text-sm mt-1">₹{parseFloat(slot.price).toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
                
                {availableTimeSlots.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                    <p className="text-gray-500">No available time slots found for this date.</p>
                  </div>
                )}
                
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-white border border-gray-300 rounded-full mr-2"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
                
                {selectedSlots.length > 0 && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h4 className="font-medium text-indigo-800 mb-2">Selected Slots</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.sort().map(slot => (
                        <span 
                          key={slot} 
                          className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {slot.split(' - ')[0]} <ChevronRight size={14} /> {slot.split(' - ')[1]}
                          <span className="font-semibold ml-1">₹{selectedSlotPrices[slot]?.toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-between items-center">
                      <span className="font-medium text-indigo-800">Total:</span>
                      <span className="text-lg font-bold text-indigo-900">₹{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Check size={20} className="text-indigo-500" />
                Confirm Your Booking
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Review your booking details before payment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-500" />
                  Booking Summary
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Venue:</span>
                    <span className="text-sm font-medium">{venues.find(v => v.id === selectedVenue)?.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Sport:</span>
                    <span className="text-sm font-medium">
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
                    <span className="text-sm text-gray-500">Court:</span>
                    <span className="text-sm font-medium">{courts.find(c => c.id === selectedCourt)?.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="text-sm font-medium">{format(new Date(selectedDate), 'PPP')}</span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Selected Slots:</h5>
                    <ul className="space-y-2">
                      {selectedSlots.sort().map(slot => (
                        <li key={slot} className="flex justify-between text-sm">
                          <span>{slot}</span>
                          <span className="font-medium">₹{selectedSlotPrices[slot]?.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-indigo-600">₹{calculateTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User size={18} className="text-indigo-500" />
                  Your Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Name:</span>
                    <span className="text-sm font-medium">{name || user.email}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Email:</span>
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  
                  {phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Phone:</span>
                      <span className="text-sm font-medium">{phone}</span>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <h5 className="text-sm font-medium text-blue-800 flex items-center gap-2 mb-1">
                      <CreditCard size={16} />
                      Payment Method
                    </h5>
                    <p className="text-xs text-blue-700">
                      You'll be redirected to Razorpay's secure payment gateway to complete your booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between">
            {currentStep > 1 ? (
              <Button
                onClick={handlePreviousStep}
                variant="outline"
                disabled={isSubmitting || bookingInProgress}
                className="gap-2"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 3 ? (
              <Button
                onClick={handleNextStep}
                disabled={isSubmitting || bookingInProgress}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={isSubmitting || bookingInProgress || loading.booking || loading.payment}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {loading.booking || loading.payment ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <CreditCard size={16} />
                )}
                Pay & Confirm Booking
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSlotModal;
