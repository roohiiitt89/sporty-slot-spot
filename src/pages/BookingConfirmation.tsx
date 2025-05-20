
import React from 'react';
import { useParams } from 'react-router-dom';

const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Booking Confirmation</h1>
      <p>Booking ID: {bookingId}</p>
      <p>Your booking has been confirmed.</p>
    </div>
  );
};

export default BookingConfirmation;
