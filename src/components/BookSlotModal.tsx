
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BookSlotModalProps {
  onClose: () => void;
}

// Mock data (would come from API in production)
const sports = ['Basketball', 'Tennis', 'Football', 'Swimming', 'Volleyball'];
const venues = ['Urban Sports Center', 'Green Field Complex', 'Elite Training Center', 'Community Sports Hub'];
const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4'];

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

// Mock function to simulate checking availability
const mockCheckAvailability = (slot: string): 'available' | 'booked' => {
  // Randomly determine if a slot is available or booked
  return Math.random() > 0.3 ? 'available' : 'booked';
};

const BookSlotModal: React.FC<BookSlotModalProps> = ({ onClose }) => {
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const slotAvailability = timeSlots.reduce<Record<string, 'available' | 'booked'>>((acc, slot) => {
    acc[slot] = mockCheckAvailability(slot);
    return acc;
  }, {});

  const handleSlotClick = (slot: string) => {
    if (slotAvailability[slot] === 'booked') return;
    
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedSport || !selectedVenue || !selectedCourt || !selectedDate) {
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

  const handleBooking = () => {
    if (!name || !phone) {
      toast({
        title: "Missing information",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would make an API call to save the booking
    console.log({
      sport: selectedSport,
      venue: selectedVenue,
      court: selectedCourt,
      date: selectedDate,
      slots: selectedSlots,
      name,
      phone
    });
    
    toast({
      title: "Booking successful!",
      description: "You have successfully booked your slots.",
    });
    
    onClose();
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
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Sport</label>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
              >
                <option value="">Select a sport</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Venue</label>
              <select
                value={selectedVenue}
                onChange={e => setSelectedVenue(e.target.value)}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
              >
                <option value="">Select a venue</option>
                {venues.map(venue => (
                  <option key={venue} value={venue}>{venue}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sport-gray-dark mb-2 font-medium">Select Court</label>
              <select
                value={selectedCourt}
                onChange={e => setSelectedCourt(e.target.value)}
                className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
              >
                <option value="">Select a court</option>
                {courts.map(court => (
                  <option key={court} value={court}>{court}</option>
                ))}
              </select>
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
                  {selectedSlots.map(slot => (
                    <span key={slot} className="bg-sport-green text-white px-2 py-1 rounded text-sm">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
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
                  <p><span className="font-medium">Sport:</span> {selectedSport}</p>
                  <p><span className="font-medium">Venue:</span> {selectedVenue}</p>
                  <p><span className="font-medium">Court:</span> {selectedCourt}</p>
                  <p><span className="font-medium">Date:</span> {selectedDate}</p>
                  
                  <div>
                    <p className="font-medium">Selected Slots:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSlots.map(slot => (
                        <span key={slot} className="bg-sport-green text-white px-2 py-1 rounded text-sm">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sport-gray-dark mb-6">Your Information</h3>
              
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
              className="py-3 px-6 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookSlotModal;
