
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  hourly_rate: number;
}

interface Booking {
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

// Generate time slots from 5 AM to 12 AM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 5; hour <= 23; hour++) {
    const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
    const period = hour < 12 ? 'AM' : 'PM';
    slots.push(`${hourFormatted}:00 ${period}`);
    slots.push(`${hourFormatted}:30 ${period}`);
  }
  // Add 12 AM
  slots.push('12:00 AM');
  return slots;
};

const timeSlots = generateTimeSlots();

// Convert 12-hour format to 24-hour format for database
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

const BookSlotModal: React.FC<BookSlotModalProps> = ({ onClose, venueId, sportId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenue, setSelectedVenue] = useState(venueId || '');
  const [selectedSport, setSelectedSport] = useState(sportId || '');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, 'available' | 'booked'>>({});
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
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [courtRate, setCourtRate] = useState<number>(0);

  // Fetch venues and sports on load
  useEffect(() => {
    fetchVenues();
    fetchSports();
    
    // Set today's date as default
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  }, []);

  // Fetch courts when venue and sport are selected
  useEffect(() => {
    if (selectedVenue && selectedSport) {
      fetchCourts();
    } else {
      setCourts([]);
      setSelectedCourt('');
    }
  }, [selectedVenue, selectedSport]);

  // Fetch availability when court and date are selected
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchAvailability();
    }
  }, [selectedCourt, selectedDate]);

  // Pre-fill user info if logged in
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

  const fetchCourts = async () => {
    setLoading(prev => ({ ...prev, courts: true }));
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, venue_id, sport_id, hourly_rate')
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

  const fetchAvailability = async () => {
    if (!selectedCourt || !selectedDate) return;
    
    setLoading(prev => ({ ...prev, availability: true }));
    try {
      // Fetch existing bookings for the selected court and date
      const { data, error } = await supabase
        .from('bookings')
        .select('court_id, booking_date, start_time, end_time')
        .eq('court_id', selectedCourt)
        .eq('booking_date', selectedDate)
        .in('status', ['pending', 'confirmed']);
        
      if (error) {
        throw error;
      }
      
      setExistingBookings(data || []);
      
      // Determine availability for each time slot
      const availability: Record<string, 'available' | 'booked'> = {};
      
      timeSlots.forEach(slot => {
        const slotTime = convertTo24Hour(slot);
        const isBooked = (data || []).some(booking => {
          const bookingStart = booking.start_time;
          const bookingEnd = booking.end_time;
          return slotTime >= bookingStart && slotTime < bookingEnd;
        });
        
        availability[slot] = isBooked ? 'booked' : 'available';
      });
      
      setSlotAvailability(availability);
      setSelectedSlots([]); // Reset selected slots when availability changes
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
  };

  const handleSlotClick = (slot: string) => {
    if (slotAvailability[slot] === 'booked') return;
    
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      // Check if slots are continuous
      const newSelectedSlots = [...selectedSlots, slot].sort((a, b) => {
        const timeA = convertTo24Hour(a);
        const timeB = convertTo24Hour(b);
        return timeA.localeCompare(timeB);
      });
      
      // Check if the slots are continuous
      let isContinuous = true;
      for (let i = 0; i < newSelectedSlots.length - 1; i++) {
        const currentSlotIndex = timeSlots.indexOf(newSelectedSlots[i]);
        const nextSlotIndex = timeSlots.indexOf(newSelectedSlots[i + 1]);
        
        if (nextSlotIndex - currentSlotIndex !== 1) {
          isContinuous = false;
          break;
        }
      }
      
      if (!isContinuous) {
        toast({
          title: "Invalid Selection",
          description: "Please select continuous time slots only.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedSlots(newSelectedSlots);
    }
  };

  const calculateTotalPrice = () => {
    // Use the court's hourly rate from the database
    return (selectedSlots.length / 2) * courtRate; // 2 slots = 1 hour
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
    
    if (!name || !phone) {
      toast({
        title: "Missing information",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, booking: true }));
    
    try {
      // Calculate start and end times from selected slots
      const sortedSlots = [...selectedSlots].sort((a, b) => {
        const timeA = convertTo24Hour(a);
        const timeB = convertTo24Hour(b);
        return timeA.localeCompare(timeB);
      });
      
      const startTime = convertTo24Hour(sortedSlots[0]);
      const endTime = convertTo24Hour(sortedSlots[sortedSlots.length - 1]);
      
      // Add 30 minutes to the last slot to get the end time
      const lastEndTimeParts = endTime.split(':');
      let endHour = parseInt(lastEndTimeParts[0], 10);
      let endMinute = parseInt(lastEndTimeParts[1], 10) + 30;
      
      if (endMinute >= 60) {
        endMinute -= 60;
        endHour = (endHour + 1) % 24;
      }
      
      const finalEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Create booking in database
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          court_id: selectedCourt,
          user_id: user?.id || null, // Link to user if logged in
          booking_date: selectedDate,
          start_time: startTime,
          end_time: finalEndTime,
          total_price: calculateTotalPrice(),
          guest_name: user ? null : name,
          guest_phone: user ? null : phone,
          status: 'pending'
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Booking successful!",
        description: "You have successfully booked your slots.",
      });
      
      // If user is logged in, navigate to profile/bookings
      if (user) {
        navigate('/profile');
      } else {
        // If guest, maybe show a confirmation screen
        navigate('/');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: "Booking failed",
        description: error.message || "There was an issue creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, booking: false }));
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="modal-header">Book Your Slot</h2>
          <button 
            onClick={onClose}
            className="text-sport-gray-dark hover:text-sport-green transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 1 ? 'bg-sport-green text-white' : 'bg-sport-gray-light text-sport-gray-dark'
            }`}>
              1
            </div>
            <div className="w-16 h-1 bg-sport-gray-light">
              <div className={`h-full ${currentStep > 1 ? 'bg-sport-green' : ''}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 2 ? 'bg-sport-green text-white' : currentStep > 2 ? 'bg-sport-green-light text-white' : 'bg-sport-gray-light text-sport-gray-dark'
            }`}>
              2
            </div>
            <div className="w-16 h-1 bg-sport-gray-light">
              <div className={`h-full ${currentStep > 2 ? 'bg-sport-green' : ''}`}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 3 ? 'bg-sport-green text-white' : 'bg-sport-gray-light text-sport-gray-dark'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Select Sport, Venue, Court, Date */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Venue</label>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                disabled={loading.venues}
              >
                <option value="">Select a venue</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
              {loading.venues && <p className="mt-1 text-xs text-sport-gray">Loading venues...</p>}
            </div>
            
            <div>
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Sport</label>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                disabled={loading.sports}
              >
                <option value="">Select a sport</option>
                {sports.map(sport => (
                  <option key={sport.id} value={sport.id}>{sport.name}</option>
                ))}
              </select>
              {loading.sports && <p className="mt-1 text-xs text-sport-gray">Loading sports...</p>}
            </div>
            
            <div>
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Court</label>
              <select
                value={selectedCourt}
                onChange={e => {
                  setSelectedCourt(e.target.value);
                  const court = courts.find(c => c.id === e.target.value);
                  if (court) {
                    setCourtRate(court.hourly_rate);
                  }
                }}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                disabled={loading.courts || !selectedVenue || !selectedSport}
              >
                <option value="">Select a court</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>{court.name} - ${court.hourly_rate}/hr</option>
                ))}
              </select>
              {loading.courts && <p className="mt-1 text-xs text-sport-gray">Loading courts...</p>}
              {!loading.courts && courts.length === 0 && selectedVenue && selectedSport && (
                <p className="mt-1 text-xs text-red-500">No courts available for this venue and sport combination.</p>
              )}
            </div>
            
            <div>
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
              />
            </div>
          </div>
        )}

        {/* Step 2: Select Time Slots */}
        {currentStep === 2 && (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-sport-gray-dark mb-2">Select Time Slots</h3>
              <p className="text-sport-gray">Click on the available slots to select them.</p>
            </div>
            
            <div className="mb-4">
              <p className="font-medium text-sport-gray-dark">Selected Date: <span className="text-sport-green">{selectedDate}</span></p>
            </div>
            
            {loading.availability ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green mx-auto"></div>
                <p className="mt-2 text-sport-gray">Loading availability...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {timeSlots.map(slot => (
                    <div
                      key={slot}
                      className={`
                        slot-item
                        ${slotAvailability[slot] === 'available' 
                          ? selectedSlots.includes(slot) 
                            ? 'slot-selected' 
                            : 'slot-available' 
                          : 'slot-unavailable'}
                      `}
                      onClick={() => handleSlotClick(slot)}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex items-center">
                  <div className="flex items-center mr-4">
                    <div className="w-4 h-4 bg-sport-green rounded-sm mr-2"></div>
                    <span className="text-sm">Selected</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <div className="w-4 h-4 border border-sport-green-light rounded-sm mr-2"></div>
                    <span className="text-sm">Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-sport-gray-light rounded-sm mr-2"></div>
                    <span className="text-sm">Unavailable</span>
                  </div>
                </div>
                
                {selectedSlots.length > 0 && (
                  <div className="mt-6 p-4 bg-sport-gray-light rounded-md">
                    <h4 className="font-medium mb-2">Selected Slots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.sort().map(slot => (
                        <span key={slot} className="bg-sport-green text-white px-2 py-1 rounded text-sm">
                          {slot}
                        </span>
                      ))}
                    </div>
                    {selectedSlots.length > 0 && (
                      <p className="mt-3 font-medium">Total Price: ${calculateTotalPrice().toFixed(2)}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Enter User Details */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-sport-gray-dark mb-6">Booking Details</h3>
                
                <div className="bg-sport-gray-light rounded-md p-4 space-y-2">
                  <p><span className="font-medium">Venue:</span> {venues.find(v => v.id === selectedVenue)?.name}</p>
                  <p><span className="font-medium">Sport:</span> {sports.find(s => s.id === selectedSport)?.name}</p>
                  <p><span className="font-medium">Court:</span> {courts.find(c => c.id === selectedCourt)?.name}</p>
                  <p><span className="font-medium">Date:</span> {selectedDate}</p>
                  
                  <div>
                    <p className="font-medium">Selected Slots:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSlots.sort().map(slot => (
                        <span key={slot} className="bg-sport-green text-white px-2 py-1 rounded text-sm">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="mt-2 font-medium">Total Price: ${calculateTotalPrice().toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sport-gray-dark mb-6">Your Information</h3>
              
              {user ? (
                <div className="bg-sport-gray-light rounded-md p-4 space-y-2">
                  <p><span className="font-medium">Booking as:</span> {name || user.email}</p>
                  <p><span className="font-medium">Account Email:</span> {user.email}</p>
                  {phone && <p><span className="font-medium">Phone:</span> {phone}</p>}
                  <p className="text-sm text-sport-gray">You're signed in. Your booking will be linked to your account.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sport-gray-dark mb-2 font-medium">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sport-gray-dark mb-2 font-medium">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Creating an account allows you to track and manage your bookings.
                    </p>
                    <a 
                      href="/register" 
                      className="text-sport-green hover:underline text-sm block mt-1"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        navigate('/register');
                      }}
                    >
                      Create an account instead
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-10 flex justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handlePreviousStep}
              className="py-3 px-6 bg-sport-gray text-white rounded-md hover:bg-sport-gray-dark transition-colors"
            >
              Previous
            </button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}
          
          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              className="py-3 px-6 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleBooking}
              disabled={loading.booking}
              className="py-3 px-6 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center"
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
            </button>
          )}
        </div>
      </div>
      
      {/* Add some custom CSS to handle modal styling */}
      <style jsx>
        {`
        .modal-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 50;
          padding: 1rem;
        }
        .modal-content {
          background: white;
          border-radius: 0.75rem;
          padding: 2rem;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slot-item {
          padding: 0.5rem;
          font-size: 0.8rem;
          text-align: center;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .slot-available {
          border: 1px solid #4ade80; /* sport-green-light */
          color: #333;
        }
        .slot-available:hover {
          background-color: rgba(74, 222, 128, 0.1);
        }
        .slot-selected {
          background-color: #16a34a; /* sport-green */
          color: white;
        }
        .slot-unavailable {
          background-color: #e5e7eb; /* sport-gray-light */
          color: #9ca3af; /* sport-gray */
          cursor: not-allowed;
        }
        `}
      </style>
    </div>
  );
};

export default BookSlotModal;
