
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Check, X, CalendarDays } from 'lucide-react';
import Header from '../components/Header';
import { toast } from '@/components/ui/use-toast';

// Mock booking data (would come from API in production)
const mockBookings = [
  {
    id: 1,
    venue: 'Urban Sports Center',
    sport: 'Basketball',
    court: 'Court 1',
    date: '2025-05-02',
    slots: ['10:00 AM', '10:30 AM'],
    status: 'upcoming',
    location: 'Downtown'
  },
  {
    id: 2,
    venue: 'Elite Training Center',
    sport: 'Tennis',
    court: 'Court 3',
    date: '2025-05-05',
    slots: ['5:00 PM', '5:30 PM', '6:00 PM'],
    status: 'upcoming',
    location: 'North District'
  },
  {
    id: 3,
    venue: 'Green Field Complex',
    sport: 'Football',
    court: 'Field A',
    date: '2025-04-25',
    slots: ['7:00 PM', '7:30 PM'],
    status: 'completed',
    location: 'West Side'
  },
  {
    id: 4,
    venue: 'Community Sports Hub',
    sport: 'Volleyball',
    court: 'Indoor Court 2',
    date: '2025-04-20',
    slots: ['6:30 PM', '7:00 PM'],
    status: 'completed',
    location: 'East End'
  },
  {
    id: 5,
    venue: 'Riverside Sports Arena',
    sport: 'Swimming',
    court: 'Olympic Pool',
    date: '2025-04-18',
    slots: ['8:00 AM', '8:30 AM'],
    status: 'cancelled',
    location: 'Waterfront District'
  },
];

const Bookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  const filteredBookings = mockBookings.filter(booking => booking.status === activeTab);

  const confirmCancelBooking = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setIsDeleteModalOpen(true);
  };

  const cancelBooking = () => {
    // In a real app, this would make an API call
    toast({
      title: "Booking cancelled",
      description: "Your booking has been cancelled successfully.",
    });
    
    setIsDeleteModalOpen(false);
    setBookingToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-sport-green text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-sport-green pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">My Bookings</h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto text-center">
            Track and manage all your sport venue reservations
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-6 font-medium transition-colors border-b-2 ${
                activeTab === 'upcoming'
                  ? 'border-sport-green text-sport-green'
                  : 'border-transparent text-sport-gray-dark hover:text-sport-green'
              }`}
            >
              Upcoming Bookings
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-6 font-medium transition-colors border-b-2 ${
                activeTab === 'completed'
                  ? 'border-sport-green text-sport-green'
                  : 'border-transparent text-sport-gray-dark hover:text-sport-green'
              }`}
            >
              Completed Bookings
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`py-4 px-6 font-medium transition-colors border-b-2 ${
                activeTab === 'cancelled'
                  ? 'border-sport-green text-sport-green'
                  : 'border-transparent text-sport-gray-dark hover:text-sport-green'
              }`}
            >
              Cancelled Bookings
            </button>
          </div>
        </div>
      </div>
      
      {/* Bookings Content */}
      <div className="container mx-auto px-4 py-12">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-6">
              <CalendarDays className="h-16 w-16 text-sport-gray mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-sport-gray-dark mb-2">No {activeTab} bookings</h3>
            <p className="text-sport-gray mb-6">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming bookings."
                : activeTab === 'completed'
                ? "You don't have any completed bookings yet."
                : "You don't have any cancelled bookings."}
            </p>
            <button
              onClick={() => window.location.href = '/venues'}
              className="px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Book a Venue
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-sport-gray-dark mb-2">{booking.venue} - {booking.sport}</h3>
                      <div className="flex items-center text-sport-gray mb-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{booking.location}</span>
                      </div>
                      <div className="flex items-center text-sport-gray mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center text-sport-gray mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{booking.slots.join(', ')}</span>
                      </div>
                      <p className="text-sport-gray-dark">
                        <span className="font-medium">Court/Field:</span> {booking.court}
                      </p>
                    </div>
                    
                    {booking.status === 'upcoming' && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => window.location.href = `/bookings/${booking.id}`}
                          className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors whitespace-nowrap"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => confirmCancelBooking(booking.id)}
                          className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors whitespace-nowrap"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                    
                    {booking.status === 'completed' && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => window.location.href = `/bookings/${booking.id}`}
                          className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors whitespace-nowrap"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => toast({ title: "Review submitted", description: "Thank you for your feedback!" })}
                          className="px-4 py-2 border border-sport-gray text-sport-gray-dark rounded-md hover:bg-sport-gray-light transition-colors whitespace-nowrap"
                        >
                          Leave Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Cancel Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-sport-gray-dark mb-4">Cancel Booking</h3>
            <p className="text-sport-gray-dark mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-sport-gray-light text-sport-gray-dark rounded-md hover:bg-sport-gray transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={cancelBooking}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-sport-gray-dark text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Bookings;
