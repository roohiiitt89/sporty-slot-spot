import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Clock, MapPin, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
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
        `)
        .eq('user_id', user?.id)
        .gte('booking_date', todayStr)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (upcomingError) throw upcomingError;

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
        `)
        .eq('user_id', user?.id)
        .or(`booking_date.lt.${todayStr},status.eq.cancelled,status.eq.completed`)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: true })
        .limit(10);

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

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button and Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-700 hover:text-gray-900 transition-colors mb-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                <button
                  onClick={() => navigate('/venues')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book New Slot
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-12">
                {/* Upcoming Bookings */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                    Upcoming Bookings
                  </h2>
                  
                  {upcomingBookings.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                      <p className="text-gray-500">No upcoming bookings found</p>
                      <button
                        onClick={() => navigate('/venues')}
                        className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Book your first slot
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {booking.court.venue.name} - {booking.court.name}
                                </h3>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <span className="capitalize">{booking.court.sport.name.toLowerCase()}</span>
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center text-gray-700">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>
                                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <span className="font-medium">{formatCurrency(booking.total_price)}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{booking.court.venue.location}</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-100">
                            <button
                              onClick={() => navigate(`/booking/${booking.id}`)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                            >
                              View details <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Past Bookings */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200">
                    Past Bookings
                  </h2>
                  
                  {pastBookings.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                      <p className="text-gray-500">No past bookings found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
                        >
                          <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {booking.court.venue.name} - {booking.court.name}
                                </h3>
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <span className="capitalize">{booking.court.sport.name.toLowerCase()}</span>
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center text-gray-700">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>
                                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-700">
                                <span className="font-medium">{formatCurrency(booking.total_price)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Bookings;
