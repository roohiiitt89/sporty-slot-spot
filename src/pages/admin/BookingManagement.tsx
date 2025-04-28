import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  Check, AlertCircle, XCircle, Search, ChevronDown, Filter, DownloadIcon 
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

// Define the booking status type to match our enum
type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingManagementProps {
  userRole: string | null;
  adminVenues?: Array<{ venue_id: string }>; // Added adminVenues prop
}

interface Court {
  id: string;
  name: string;
  venue: {
    name: string;
    id: string;
  };
  sport: {
    name: string;
  };
}

interface Profile {
  full_name: string;
  phone: string;
  email: string;
}

interface Booking {
  id: string;
  court_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  guest_name: string;
  guest_phone: string;
  status: BookingStatus;
  created_at: string;
  court: Court;
  profile: Profile;
}

const statusOptions: { value: BookingStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-500' }
];

const BookingManagement: React.FC<BookingManagementProps> = ({ userRole, adminVenues = [] }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [dateFilter, setDateFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const isSuperAdmin = userRole === 'super_admin';
  
  useEffect(() => {
    fetchBookings();
  }, []);

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
          court:court_id (
            id, 
            name,
            venue:venue_id (name, id),
            sport:sport_id (name)
          ),
          profile:user_id (full_name, phone, email)
        `)
        .order('booking_date', { ascending: false });
      
      if (userRole === 'admin' && adminVenues && adminVenues.length > 0) {
        const venueIds = adminVenues.map(venue => venue.venue_id);
        
        const { data: courtData, error: courtError } = await supabase
          .from('courts')
          .select('id')
          .in('venue_id', venueIds);
          
        if (courtError) throw courtError;
        
        if (courtData && courtData.length > 0) {
          const courtIds = courtData.map(court => court.id);
          query = query.in('court_id', courtIds);
        } else {
          setBookings([]);
          setLoading(false);
          return;
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setBookings(data as unknown as Booking[]);
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

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === id ? { ...booking, status } : booking
        )
      );
      
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
      
      toast({
        title: 'Status updated',
        description: `Booking status has been updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  const openBookingDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingDetailOpen(true);
  };

  const closeBookingDetail = () => {
    setIsBookingDetailOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: BookingStatus) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-white text-xs ${statusOption?.color}`}>
        {statusOption?.label}
      </span>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.court?.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (booking.court?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter ? booking.status === statusFilter : true;
    const matchesDate = dateFilter ? booking.booking_date === dateFilter : true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportBookingsToCSV = () => {
    const headers = [
      'Booking ID', 
      'Court', 
      'Venue', 
      'Sport',
      'Date', 
      'Time', 
      'Customer', 
      'Contact', 
      'Price',
      'Status'
    ];
    
    const csvData = filteredBookings.map(booking => {
      const name = booking.user_id ? booking.profile?.full_name : booking.guest_name;
      const contact = booking.user_id ? booking.profile?.email : booking.guest_phone;
      
      return [
        booking.id,
        booking.court?.name || 'Unknown',
        booking.court?.venue?.name || 'Unknown',
        booking.court?.sport?.name || 'Unknown',
        booking.booking_date,
        `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
        name || 'Unknown',
        contact || 'None',
        `₹${booking.total_price.toFixed(2)}`,
        booking.status
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Booking Management</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportBookingsToCSV()}
            className="px-4 py-2 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors flex items-center gap-2"
          >
            <DownloadIcon size={16} />
            Export
          </button>
        </div>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow-sm mb-6 border border-slate-dark/20">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sport-gray" size={18} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full bg-card text-card-foreground"
            />
          </div>
          
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center px-4 py-2 bg-sport-gray-light text-sport-gray-dark rounded-md hover:bg-sport-gray transition-colors"
          >
            <Filter size={18} className="mr-2" />
            Filter
            <ChevronDown size={16} className={`ml-2 transform transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BookingStatus | '')}
                className="w-full p-2 border rounded-md bg-card text-card-foreground"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Booking Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border rounded-md bg-card text-card-foreground"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setDateFilter('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 border text-card-foreground rounded-md hover:bg-sport-gray-light transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo"></div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-slate rounded-lg">
          <p className="text-navy-light">No bookings found matching your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg overflow-hidden">
            <thead className="bg-slate">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Court</th>
                <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                <th className="py-3 px-4 text-left font-medium">Customer</th>
                <th className="py-3 px-4 text-left font-medium">Price</th>
                <th className="py-3 px-4 text-left font-medium">Status</th>
                <th className="py-3 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBookings.map(booking => {
                const name = booking.user_id 
                  ? (booking.profile?.full_name || 'Unknown User') 
                  : (booking.guest_name || 'Guest');
                
                return (
                  <tr 
                    key={booking.id} 
                    className="hover:bg-slate-light cursor-pointer"
                    onClick={() => openBookingDetail(booking)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{booking.court?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{booking.court?.venue?.name || 'Unknown Venue'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{formatDate(booking.booking_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.user_id 
                            ? booking.profile?.email || 'No email' 
                            : booking.guest_phone || 'No phone'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">₹{booking.total_price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus: BookingStatus = booking.status === 'pending' ? 'confirmed' : 'completed';
                          updateBookingStatus(booking.id, nextStatus);
                        }}
                        className={`text-green-600 hover:text-green-900 ${
                          booking.status !== 'pending' && booking.status !== 'confirmed' ? 'hidden' : ''
                        }`}
                        title={booking.status === 'pending' ? 'Confirm' : 'Complete'}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateBookingStatus(booking.id, 'cancelled');
                        }}
                        className={`text-red-600 hover:text-red-900 ${
                          booking.status !== 'pending' && booking.status !== 'confirmed' ? 'hidden' : ''
                        }`}
                        title="Cancel"
                      >
                        <XCircle size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {isBookingDetailOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-card-foreground rounded-lg max-w-2xl w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Booking Details</h3>
              <button 
                onClick={closeBookingDetail}
                className="text-muted-foreground hover:text-indigo transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Booking Reference</h4>
                  <p className="font-mono">{selectedBooking.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Court</h4>
                  <p>{selectedBooking.court?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Venue</h4>
                  <p>{selectedBooking.court?.venue?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Sport</h4>
                  <p>{selectedBooking.court?.sport?.name || 'Unknown'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p>{formatDate(selectedBooking.booking_date)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                  <p>{formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
                  <p>₹{selectedBooking.total_price.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Booked On</h4>
                  <p>{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs text-muted-foreground">Name</h5>
                    <p>{selectedBooking.user_id 
                      ? (selectedBooking.profile?.full_name || 'Unknown User') 
                      : (selectedBooking.guest_name || 'Guest')}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs text-muted-foreground">Contact</h5>
                    <p>{selectedBooking.user_id 
                      ? selectedBooking.profile?.email || 'No email'
                      : selectedBooking.guest_phone || 'No phone'}
                    </p>
                  </div>
                  {selectedBooking.user_id && selectedBooking.profile?.phone && (
                    <div>
                      <h5 className="text-xs text-muted-foreground">Phone</h5>
                      <p>{selectedBooking.profile.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-slate flex justify-end space-x-2">
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <>
                  <button
                    onClick={() => {
                      const nextStatus: BookingStatus = selectedBooking.status === 'pending' ? 'confirmed' : 'completed';
                      updateBookingStatus(selectedBooking.id, nextStatus);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Check size={16} className="mr-1" />
                    {selectedBooking.status === 'pending' ? 'Confirm Booking' : 'Mark Completed'}
                  </button>
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  >
                    <XCircle size={16} className="mr-1" />
                    Cancel Booking
                  </button>
                </>
              )}
              <button
                onClick={closeBookingDetail}
                className="px-4 py-2 border text-card-foreground rounded-md hover:bg-slate-light transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
