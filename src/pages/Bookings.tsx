
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CalendarDays } from 'lucide-react';
import Header from '../components/Header';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  id: string;
  court: {
    name: string;
    venue: {
      name: string;
      location: string;
    };
    sport: {
      name: string;
    };
  };
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
}

const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user, activeTab]);

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Define the status mapping
      let statusFilter: string[];
      if (activeTab === 'upcoming') {
        statusFilter = ['pending', 'confirmed'];
      } else if (activeTab === 'completed') {
        statusFilter = ['completed'];
      } else {
        statusFilter = ['cancelled'];
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          total_price,
          status,
          court:court_id (
            name,
            venue:venue_id (
              name,
              location
            ),
            sport:sport_id (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .in('status', statusFilter);
      
      if (error) {
        throw error;
      }
      
      // Sort by date (newest first)
      const sortedBookings = (data || []).sort((a, b) => {
        return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime();
      });
      
      setBookings(sortedBookings as unknown as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelBooking = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setIsDeleteModalOpen(true);
  };

  const cancelBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingToDelete);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled successfully.",
      });
      
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel the booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setBookingToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-sport-green text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-sport-gray-light">
        <Header />
        
        <div className="bg-sport-green pt-32 pb-12 md:pb-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">My Bookings</h1>
            <p className="text-xl text-white opacity-90 max-w-3xl mx-auto text-center">
              Sign in to view and manage your bookings
            </p>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-xl p-12 shadow-md">
            <CalendarDays className="h-16 w-16 text-sport-gray-dark mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-sport-gray-dark mb-4">Sign in to view your bookings</h2>
            <p className="text-sport-gray mb-6">You need to be signed in to view and manage your bookings.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/login"
                className="px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="px-6 py-3 border border-sport-gray-dark text-sport-gray-dark rounded-md hover:bg-sport-gray-light transition-colors"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
        
        <footer className="bg-sport-gray-dark text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2025 SportySlot. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

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
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sport-green"></div>
          </div>
        ) : bookings.length === 0 ? (
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
            {bookings.map((booking) => (
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
                      <h3 className="text-xl font-bold text-sport-gray-dark mb-2">
                        {booking.court.venue.name} - {booking.court.sport.name}
                      </h3>
                      <div className="flex items-center text-sport-gray mb-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{booking.court.venue.location}</span>
                      </div>
                      <div className="flex items-center text-sport-gray mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                      <div className="flex items-center text-sport-gray mb-3">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{booking.start_time} - {booking.end_time}</span>
                      </div>
                      <p className="text-sport-gray-dark">
                        <span className="font-medium">Court:</span> {booking.court.name}
                      </p>
                      <p className="text-sport-gray-dark mt-2">
                        <span className="font-medium">Total Price:</span> ${booking.total_price.toFixed(2)}
                      </p>
                    </div>
                    
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
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
