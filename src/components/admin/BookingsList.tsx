import React from 'react';
import { BookCheck, BookX, Ban, Calendar, CreditCard, DollarSign, User } from 'lucide-react';
import { Booking, BookingStatus } from '@/types/help';
import SportDisplayName from '@/components/SportDisplayName';

interface BookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  onStatusUpdate: (bookingId: string, status: BookingStatus) => void;
}

const getPaymentStatusColor = (status: string | null) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentMethodIcon = (method: string | null) => {
  if (!method) return null;
  switch (method.toLowerCase()) {
    case 'cash': return <DollarSign className="w-4 h-4 mr-1" />;
    case 'card':
    case 'online': return <CreditCard className="w-4 h-4 mr-1" />;
    default: return null;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const BookingsList: React.FC<BookingsListProps> = ({ bookings, isLoading, onStatusUpdate }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
      </div>
    );
  }
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No bookings found</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {bookings.map(booking => (
        <div key={booking.id} className="rounded-lg bg-navy-900 shadow border border-navy-700 px-3 py-2 flex flex-col text-xs text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-white text-sm">{formatDate(booking.booking_date)}</span>
            <span className="text-gray-300">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
          </div>
          <div className="mb-1">
            <span className="font-medium text-white truncate block">{booking.court.venue.name}</span>
            <span className="text-gray-400 truncate block">{booking.court.name} / <SportDisplayName venueId={booking.court.venue.id} sportId={booking.court.sport.id} defaultName={booking.court.sport.name} /></span>
          </div>
          <div className="mb-1">
            {booking.admin_booking ? (
              <span className="font-medium text-purple-300">{booking.admin_booking.customer_name} <span className="text-xs text-purple-400">(Admin)</span></span>
            ) : booking.guest_name ? (
              <span className="font-medium text-white">{booking.guest_name} <span className="text-xs text-gray-400">(Guest)</span></span>
            ) : booking.user_info ? (
              <span className="font-medium text-white">{booking.user_info.full_name || 'User'}</span>
            ) : (
              <span className="text-gray-400">User ID: {booking.user_id || 'No user'}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-green-300 font-semibold">₹{booking.total_price.toFixed(2)}</span>
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>{getPaymentMethodIcon(booking.payment_method)}{booking.payment_method ? booking.payment_method.charAt(0).toUpperCase() + booking.payment_method.slice(1) : 'Unknown'}</span>
            <span className={`inline-block px-2 py-0.5 rounded ${getPaymentStatusColor(booking.payment_status)}`}>{booking.payment_status || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`capitalize px-2 py-0.5 rounded text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-900 text-green-300' : booking.status === 'cancelled' ? 'bg-red-900 text-red-300' : 'bg-navy-800 text-gray-300'}`}>{booking.status}</span>
            {booking.payment_reference && (
              <span className="text-gray-500 truncate max-w-[80px]" title={booking.payment_reference}>Ref: {booking.payment_reference}</span>
            )}
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={() => onStatusUpdate(booking.id, 'confirmed')} className="px-2 py-0.5 rounded bg-green-900 text-green-200 text-xs font-medium flex items-center gap-1"><BookCheck className="w-3 h-3" />Confirm</button>
            <button onClick={() => onStatusUpdate(booking.id, 'cancelled')} className="px-2 py-0.5 rounded bg-red-900 text-red-200 text-xs font-medium flex items-center gap-1"><BookX className="w-3 h-3" />Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingsList;
