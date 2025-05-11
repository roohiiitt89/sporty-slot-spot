import React, { useState } from 'react';
import { BookCheck, BookX, Ban, Calendar, CreditCard, DollarSign, User } from 'lucide-react';
import { BookingInfo, AdminBookingInfo, Booking, BookingStatus } from '@/types/help';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SportDisplayName from '@/components/SportDisplayName';

interface UserInfo {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface AdminInfo {
  full_name: string | null;
  email: string | null;
}

interface BookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  onStatusUpdate: (bookingId: string, status: BookingStatus) => void;
}

const BookingsList: React.FC<BookingsListProps> = ({ 
  bookings,
  isLoading,
  onStatusUpdate
}) => {
  // Function to get color for payment status badges
  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get payment method icon
  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return null;
    
    switch (method.toLowerCase()) {
      case 'cash':
        return <DollarSign className="w-4 h-4 mr-1" />;
      case 'card':
        return <CreditCard className="w-4 h-4 mr-1" />;
      case 'online':
        return <CreditCard className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Venue / Court / Sport</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(booking => (
            <TableRow key={booking.id}>
              <TableCell>{formatDate(booking.booking_date)}</TableCell>
              <TableCell>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{booking.court.venue.name}</p>
                  <p className="text-sm text-gray-500">
                    {booking.court.name} / {' '}
                    <SportDisplayName 
                      venueId={booking.court.venue.id}
                      sportId={booking.court.sport.id}
                      defaultName={booking.court.sport.name}
                    />
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {booking.admin_booking ? (
                  <div>
                    <p className="font-medium">
                      {booking.admin_booking.customer_name} 
                      <span className="text-xs text-purple-600"> (Admin Booking)</span>
                    </p>
                    <p className="text-xs text-gray-500">{booking.admin_booking.customer_phone || 'No phone'}</p>
                    {booking.admin_info && (
                      <p className="text-xs text-purple-600">Booked by: {booking.admin_info.full_name || 'Admin'}</p>
                    )}
                    {booking.admin_booking.notes && (
                      <p className="text-xs text-gray-500 italic mt-1">Note: {booking.admin_booking.notes}</p>
                    )}
                  </div>
                ) : booking.booked_by_admin_id ? (
                  <div>
                    <p className="font-medium">
                      {booking.guest_name || 'Customer'} 
                      <span className="text-xs text-purple-600"> (Admin Booking)</span>
                    </p>
                    <p className="text-xs text-gray-500">{booking.guest_phone || 'No phone'}</p>
                    {booking.admin_info && (
                      <p className="text-xs text-purple-600">Booked by: {booking.admin_info.full_name || 'Admin'}</p>
                    )}
                  </div>
                ) : booking.guest_name ? (
                  <div>
                    <p className="font-medium">{booking.guest_name} <span className="text-xs text-gray-500">(Guest)</span></p>
                    <p className="text-xs text-gray-500">{booking.guest_phone || 'No phone'}</p>
                  </div>
                ) : booking.user_info ? (
                  <div>
                    <p className="font-medium">{booking.user_info.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500">{booking.user_info.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">{booking.user_info.phone || 'No phone'}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">User ID: {booking.user_id || 'No user information'}</p>
                )}
              </TableCell>
              <TableCell>₹{booking.total_price.toFixed(2)}</TableCell>
              <TableCell>
                <div>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                    {getPaymentMethodIcon(booking.payment_method)}
                    {booking.payment_method ? booking.payment_method.charAt(0).toUpperCase() + booking.payment_method.slice(1) : 'Unknown'}
                  </span>
                  <p className="text-xs mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded ${getPaymentStatusColor(booking.payment_status)}`}>
                      {booking.payment_status || 'Unknown'}
                    </span>
                  </p>
                  {booking.payment_reference && (
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[100px]" title={booking.payment_reference}>
                      Ref: {booking.payment_reference}
                    </p>
                  )}
                  {booking.admin_booking?.amount_collected && (
                    <p className="text-xs text-green-600 mt-1">
                      Collected: ₹{booking.admin_booking.amount_collected.toFixed(2)}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {booking.status !== 'confirmed' && (
                    <button
                      onClick={() => onStatusUpdate(booking.id, 'confirmed')}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Mark as Confirmed"
                    >
                      <BookCheck size={18} />
                    </button>
                  )}
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <button
                      onClick={() => onStatusUpdate(booking.id, 'cancelled')}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Cancel Booking"
                    >
                      <Ban size={18} />
                    </button>
                  )}
                  {(booking.status === 'confirmed' || booking.status === 'cancelled' || booking.status === 'pending') && (
                    <button
                      onClick={() => onStatusUpdate(booking.id, 'completed')}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Mark as Completed"
                    >
                      <Calendar size={18} />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BookingsList;
