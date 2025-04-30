
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
}

const Bookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Fetch upcoming bookings - Changed to descending order
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          id, 
          booking_date, 
          start_time, 
          end_time, 
          total_price, 
          status,
          court:courts (
            name,
            venue:venues (name, location),
            sport:sports (name)
          )
        `)
        .eq('user_id', user?.id)
        .gte('booking_date', todayStr)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: false }) // Changed to descending
        .order('start_time', { ascending: true });
      
      if (upcomingError) throw upcomingError;
      
      // Fetch past bookings - Changed to descending order for dates
      const { data: pastData, error: pastError } = await supabase
        .from('bookings')
        .select(`
          id, 
          booking_date, 
          start_time, 
          end_time, 
          total_price, 
          status,
          court:courts (
            name,
            venue:venues (name, location),
            sport:sports (name)
          )
        `)
        .eq('user_id', user?.id)
        .or(`booking_date.lt.${todayStr},status.eq.cancelled,status.eq.completed`)
        .order('booking_date', { ascending: false }) // Already descending
        .order('start_time', { ascending: true })
        .limit(5);
      
      if (pastError) throw pastError;
      
      setUpcomingBookings(upcomingData || []);
      setPastBookings(pastData || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed cancelBooking function since users should no longer be able to cancel bookings

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-sport-gray-dark">My Bookings</h1>
              <button
                onClick={() => navigate('/venues')}
                className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
              >
                Book New Slot
              </button>
            </div>
            
            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-8 flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sport-green"></div>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Upcoming Bookings */}
                <div>
                  <h2 className="text-xl font-semibold text-sport-gray-dark mb-4">Upcoming Bookings</h2>
                  
                  {upcomingBookings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                      <p className="text-sport-gray mb-4">You don't have any upcoming bookings</p>
                      <a 
                        href="/venues" 
                        className="inline-block px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
                      >
                        Browse Venues
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
                          {/* Date Column */}
                          <div className="bg-sport-green text-white p-4 md:p-6 md:w-1/5 flex flex-col justify-center items-center">
                            <Calendar className="h-8 w-8 mb-2" />
                            <p className="text-xl font-bold">{new Date(booking.booking_date).toLocaleDateString('en-US', { day: 'numeric' })}</p>
                            <p className="text-sm">{new Date(booking.booking_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                            <p className="mt-2 text-xs uppercase tracking-wider">{new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                          </div>
                          
                          {/* Details Column */}
                          <div className="p-4 md:p-6 md:w-3/5 flex-grow">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                              <h3 className="text-lg font-semibold text-sport-gray-dark">
                                {booking.court.sport.name} at {booking.court.venue.name}
                              </h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 md:mt-0 ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                            
                            <p className="text-sport-gray-dark">{booking.court.name}</p>
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sport-gray">
                                <Clock className="h-4 w-4 mr-2" />
                                <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                              </div>
                              <div className="flex items-center text-sport-gray">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{booking.court.venue.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Price Column - Removed cancel button */}
                          <div className="p-4 md:p-6 md:w-1/5 bg-gray-50 flex flex-row md:flex-col items-center justify-between md:justify-center">
                            <p className="font-bold text-lg text-sport-gray-dark">₹{booking.total_price.toFixed(2)}</p>
                            {/* Cancel button removed */}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Past Bookings */}
                <div>
                  <h2 className="text-xl font-semibold text-sport-gray-dark mb-4">Past Bookings</h2>
                  
                  {pastBookings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                      <p className="text-sport-gray">You don't have any past bookings</p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left py-3 px-4 font-medium text-sport-gray-dark">Date</th>
                                <th className="text-left py-3 px-4 font-medium text-sport-gray-dark">Venue & Court</th>
                                <th className="text-left py-3 px-4 font-medium text-sport-gray-dark">Time</th>
                                <th className="text-left py-3 px-4 font-medium text-sport-gray-dark">Price</th>
                                <th className="text-left py-3 px-4 font-medium text-sport-gray-dark">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {pastBookings.map(booking => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    {new Date(booking.booking_date).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4">
                                    <p>{booking.court.venue.name}</p>
                                    <p className="text-sm text-sport-gray">{booking.court.name}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                  </td>
                                  <td className="py-3 px-4">
                                    ₹{booking.total_price.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {pastBookings.length > 0 && (
                        <div className="mt-4 text-right">
                          <a 
                            href="/profile?tab=bookings"
                            className="inline-flex items-center text-sport-green hover:text-sport-green-dark"
                          >
                            View All Bookings 
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="bg-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sport-gray">&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Bookings;
