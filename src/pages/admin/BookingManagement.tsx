
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Check, X, Filter } from 'lucide-react';

interface BookingManagementProps {
  userRole: string | null;
}

interface Booking {
  id: string;
  court_id: string;
  user_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  guest_name: string | null;
  guest_phone: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  court: {
    name: string;
    venue: {
      name: string;
    };
    sport: {
      name: string;
    };
  };
  profile?: {
    full_name: string;
    phone: string;
    email: string;
  };
}

const BookingManagement: React.FC<BookingManagementProps> = ({ userRole }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'upcoming',
    search: '',
    showFilterPanel: false
  });

  useEffect(() => {
    fetchBookings();
  }, [filters.status, filters.dateRange]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          id, 
          court_id, 
          user_id, 
          booking_date, 
          start_time, 
          end_time, 
          total_price, 
          guest_name, 
          guest_phone, 
          status, 
          created_at,
          court:courts (
            name, 
            venue:venues (name),
            sport:sports (name)
          ),
          profile:profiles (full_name, phone, email)
        `);
      
      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      // Apply date range filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      if (filters.dateRange === 'upcoming') {
        query = query.gte('booking_date', todayStr);
      } else if (filters.dateRange === 'past') {
        query = query.lt('booking_date', todayStr);
      } else if (filters.dateRange === 'today') {
        query = query.eq('booking_date', todayStr);
      }
      
      // Sort by most recent first for past bookings, and closest date first for upcoming
      if (filters.dateRange === 'past') {
        query = query.order('booking_date', { ascending: false });
      } else {
        query = query.order('booking_date', { ascending: true });
      }
      
      // Add additional sorting by time
      query = query.order('start_time', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setBookings(data as Booking[] || []);
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

  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({
        title: 'Status updated',
        description: `Booking status has been updated to ${newStatus}.`
      });
      
      // Refresh the bookings list
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleFilterChange = (filter: string, value: string) => {
    setFilters({ ...filters, [filter]: value });
  };

  const toggleFilterPanel = () => {
    setFilters({ ...filters, showFilterPanel: !filters.showFilterPanel });
  };

  // Filter bookings by search term
  const filteredBookings = bookings.filter(booking => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    const courtName = booking.court?.name?.toLowerCase() || '';
    const venueName = booking.court?.venue?.name?.toLowerCase() || '';
    const sportName = booking.court?.sport?.name?.toLowerCase() || '';
    const userName = booking.profile?.full_name?.toLowerCase() || booking.guest_name?.toLowerCase() || '';
    const date = booking.booking_date;
    
    return (
      courtName.includes(searchLower) ||
      venueName.includes(searchLower) ||
      sportName.includes(searchLower) ||
      userName.includes(searchLower) ||
      date.includes(searchLower)
    );
  });

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Booking Management</h2>
        <button
          onClick={toggleFilterPanel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Filter size={18} />
          Filter & Search
        </button>
      </div>
      
      {/* Filter Panel */}
      {filters.showFilterPanel && (
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="today">Today</option>
                <option value="all">All Dates</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={handleSearch}
                placeholder="Search by name, venue, etc."
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No bookings found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Booking ID</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Date</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Time</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Venue</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Court</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">User</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Price</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{booking.id.split('-')[0]}</td>
                  <td className="py-3 px-4">{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</td>
                  <td className="py-3 px-4">{booking.court?.venue?.name}</td>
                  <td className="py-3 px-4">{booking.court?.name}</td>
                  <td className="py-3 px-4">
                    {booking.profile?.full_name || booking.guest_name || 'Anonymous'}
                    <div className="text-xs text-gray-500">
                      {booking.profile?.email || booking.guest_phone || ''}
                    </div>
                  </td>
                  <td className="py-3 px-4">${booking.total_price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Confirm Booking"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Cancel Booking"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Mark as Completed"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Cancel Booking"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
