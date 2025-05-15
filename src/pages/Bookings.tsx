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
          )
        `)
        .eq('user_id', user?.id)
        .gte('booking_date', todayStr)
        .in('status', ['pending', 'confirmed'])
        .order('booking_date', { ascending: false })
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
          )
        `)
        .eq('user_id', user?.id)
        .or(`booking_date.lt.${todayStr},status.eq.cancelled,status.eq.completed`)
        .order('booking_date', { ascending: false })
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
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-navy-dark to-indigo/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button and Header */}
            <div className="mb-8">
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center text-gray-300 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">My Bookings</h1>
                <button 
                  onClick={() => navigate('/venues')} 
                  className="px-4 py-2 bg-gradient-to-r from-indigo to-indigo-dark text-white rounded-md hover:from-indigo-dark hover:to-indigo transition-all font-medium flex items-center transform hover:scale-[1.02] shadow-lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book New Slot
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Bookings */}
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-white/20">
                    Upcoming Bookings
                  </h2>
                  
                  {upcomingBookings.length === 0 ? (
                    <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 text-center border border-white/20">
                      <p className="text-gray-300">No upcoming bookings found</p>
                      <button 
                        onClick={() => navigate('/venues')} 
                        className="mt-4 text-indigo-400 hover:text-white font-medium transition-colors"
                      >
                        Book your first slot
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingBookings.map(booking => (
                        <div 
                          key={booking.id} 
                          className="backdrop-blur-sm bg-white/10 rounded-xl overflow-hidden border border-white/20 hover:shadow-lg transition-all"
                        >
                          <div className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-medium text-white">
                                  {booking.court.venue.name} - {booking.court.name}
                                </h3>
                                <p className="text-sm text-gray-300 flex items-center mt-1">
                                  <span className="capitalize">{booking.court.sport.name.toLowerCase()}</span>
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center text-gray-200">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center text-gray-200">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>
                                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-200">
                                <span className="font-medium">₹{booking.total_price.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center text-sm text-gray-300">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{booking.court.venue.location}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Past Bookings */}
                <section>
                  <h2 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-white/20">
                    Past Bookings
                  </h2>
                  
                  {pastBookings.length === 0 ? (
                    <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 text-center border border-white/20">
                      <p className="text-gray-300">No past bookings found</p>
                    </div>
                  ) : (
                    <div className="backdrop-blur-sm bg-white/10 rounded-xl overflow-hidden border border-white/20">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/10">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-gray-300">Date</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-300">Venue & Court</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-300">Time</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-300">Price</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/20">
                            {pastBookings.map(booking => (
                              <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4 text-gray-200">
                                  {formatDate(booking.booking_date)}
                                </td>
                                <td className="py-3 px-4 text-gray-200">
                                  <p className="font-medium">{booking.court.venue.name}</p>
                                  <p className="text-sm text-gray-300">{booking.court.name}</p>
                                </td>
                                <td className="py-3 px-4 text-gray-200">
                                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </td>
                                <td className="py-3 px-4 text-gray-200">
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
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-navy-dark/50 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Bookings;
