
import React from 'react';
import BookSlotModal from './BookSlotModal';

interface BookSlotModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedCourt: any; // Using any here to match existing implementation
  hourlyRate: number | null;
  onBookingComplete: () => void;
  allowCashPayments: boolean;
  onClose: () => void;
  venueId?: string;
  sportId?: string;
}

const BookSlotModalWrapper: React.FC<BookSlotModalWrapperProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedCourt,
  hourlyRate,
  onBookingComplete,
  allowCashPayments,
  onClose,
  venueId,
  sportId
}) => {
  // Since BookSlotModal expects 'open', we pass it through directly
  return (
    <BookSlotModal
      open={open}
      onOpenChange={onOpenChange}
      selectedDate={selectedDate}
      selectedCourt={selectedCourt}
      hourlyRate={hourlyRate}
      onBookingComplete={onBookingComplete}
      allowCashPayments={allowCashPayments}
      onClose={onClose}
      venueId={venueId}
      sportId={sportId}
    />
  );
};

export default BookSlotModalWrapper;
