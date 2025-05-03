import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import SportDisplayName from './SportDisplayName';
import { Button } from '@/components/ui/button';

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
    booking: false
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
    
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);

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
      }, (payload) => {
        console.log('Booking change detected:', payload);
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
      fetchAvailability();
    }
  }, [selectedCourt, selectedDate, refreshKey]);

  // Add periodic refresh of availability data
  useEffect(() => {
    if (currentStep === 2 && selectedCourt && selectedDate) {
      // Refresh availability data every 15 seconds
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

  const fetchAvailability = useCallback(async () => {
    if (!selectedCourt || !selectedDate) return;
    
    setLoading(prev => ({ ...prev, availability: true }));
    try {
      // This function automatically checks for conflicts with other courts in the same group
      const { data, error } = await supabase
        .rpc('get_available_slots', { 
          p_court_id: selectedCourt, 
          p_date: selectedDate 
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
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedSlots.length === 0) {
        toast({
          title: "No slots selected",
          description: "Please select at least one time slot to continue.",
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

  const handleBooking = async () => {
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
      await fetchAvailability();
      
      // If any selected slots were removed during the refresh, stop the booking process
      if (selectedSlots.length === 0) {
        toast({
          title: "Booking failed",
          description: "Your selected slots are no longer available. Please select new time slots.",
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
            p_booking_date: selectedDate,
            p_start_time: startTime,
            p_end_time: endTime,
            p_total_price: blockPrice
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
      
      // Refresh availability and go back to step 2
      setCurrentStep(2);
      setRefreshKey(prev => prev + 1);
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

        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 1 ? 'bg-sport-green text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-full ${currentStep > 1 ? 'bg-sport-green' : ''}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 2 ? 'bg-sport-green text-white' : currentStep > 2 ? 'bg-sport-green-light text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className="w-16 h-1 bg-gray-200">
              <div className={`h-full ${currentStep > 2 ? 'bg-sport-green' : ''}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 3 ? 'bg-sport-green text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Select Venue</label>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green bg-white"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green bg-white"
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
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green bg-white"
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
                <p className="mt-1 text-xs text-blue-600">
                  Note: This court shares physical space with other sports. Bookings on one will affect availability on others.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green bg-white"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Select Time Slots</h3>
              <p className="text-gray-600">Click on the available slots to select them. You can select multiple slots, they don't need to be continuous.</p>
            </div>
            
            <div className="mb-4">
              <p className="font-medium text-gray-700">Selected Date: <span className="text-sport-green">{selectedDate}</span></p>
              <div className="flex items-center text-xs mt-1 text-blue-600">
                <span>Availability automatically refreshes every 15 seconds.</span>
                <button 
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="ml-2 text-blue-700 underline"
                >
                  Refresh now
                </button>
              </div>
            </div>
            
            {loading.availability ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading availability...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableTimeSlots.map((slot, index) => {
                    const slotDisplay = `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`;
                    return (
                      <div
                        key={`${slot.start_time}-${slot.end_time}`}
                        className={`
                          p-3 rounded-md cursor-pointer transition-all text-center
                          ${slot.is_available 
                            ? selectedSlots.includes(slotDisplay) 
                              ? 'bg-sport-green text-white border border-sport-green' 
                              : 'bg-white border border-sport-green-light hover:bg-sport-green-light/10' 
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
                
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-sport-green rounded-sm mr-2"></div>
                    <span className="text-sm">Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 border border-sport-green-light bg-white rounded-sm mr-2"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 rounded-sm mr-2"></div>
                    <span className="text-sm">Unavailable</span>
                  </div>
                </div>
                
                {selectedSlots.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h4 className="font-medium mb-2">Selected Slots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.sort().map(slot => (
                        <span key={slot} className="bg-sport-green text-white px-2 py-1 rounded text-sm">
                          {slot} - ₹{selectedSlotPrices[slot]?.toFixed(2)}
                        </span>
                      ))}
                    </div>
                    {selectedSlots.length > 0 && (
                      <p className="mt-3 font-medium">Total Price: ₹{calculateTotalPrice().toFixed(2)}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Booking Details</h3>
                
                <div className="bg-gray-50 rounded-md p-4 space-y-3 border border-gray-200">
                  <p><span className="font-medium">Venue:</span> {venues.find(v => v.id === selectedVenue)?.name}</p>
                  <p>
                    <span className="font-medium">Sport:</span> {selectedVenue && selectedSport && (
                      <SportDisplayName 
                        venueId={selectedVenue}
                        sportId={selectedSport}
                        defaultName={sports.find(s => s.id === selectedSport)?.name || ''}
                      />
                    )}
                  </p>
                  <p><span className="font-medium">Court:</span> {courts.find(c => c.id === selectedCourt)?.name}</p>
                  <p><span className="font-medium">Date:</span> {selectedDate}</p>
                  
                  <div>
                    <p className="font-medium">Selected Slots:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSlots.sort().map(slot => (
                        <span key={slot} className="bg-sport-green text-white px-2 py-1 rounded text-sm">
                          {slot} - ₹{selectedSlotPrices[slot]?.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="mt-2 font-medium text-lg">Total Price: ₹{calculateTotalPrice().toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Your Information</h3>
              
              <div className="bg-gray-50 rounded-md p-4 space-y-3 border border-gray-200">
                <p><span className="font-medium">Booking as:</span> {name || user.email}</p>
                <p><span className="font-medium">Account Email:</span> {user.email}</p>
                {phone && <p><span className="font-medium">Phone:</span> {phone}</p>}
                <p className="text-sm text-gray-600">You're signed in. Your booking will be linked to your account.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between">
          {currentStep > 1 ? (
            <Button
              onClick={handlePreviousStep}
              variant="outline"
              disabled={isSubmitting || bookingInProgress}
              className="py-3 px-6 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Previous
            </Button>
          ) : (
            <div></div>
          )}
          
          {currentStep < 3 ? (
            <Button
              onClick={handleNextStep}
              variant="default"
              disabled={isSubmitting || bookingInProgress}
              className="py-3 px-6 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors font-medium"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleBooking}
              disabled={isSubmitting || bookingInProgress || loading.booking}
              variant="default"
              className="py-3 px-6 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center font-medium"
            >
              {loading.booking ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Book Now'
              )}
            </Button>
          )}
        </div>
      </div>
      
      <style>
        {`
        .modal-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 50;
          padding: 1rem;
        }
        .modal-content {
          background: #ffffff;
          color: #1E293B;
          border-radius: 0.75rem;
          padding: 2rem;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1E293B;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </div>
  );
};

export default BookSlotModal;
