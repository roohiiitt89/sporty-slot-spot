
// This is a re-export file that provides a consistent interface for BookSlotModal
// The original component is read-only, so we're creating this adapter component

import React from 'react';
import { BookSlotModalWrapper } from './BookSlotModalWrapper';

// Define the props interface based on how we're using the component
interface BookSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedCourt: any;
  hourlyRate: number | null;
  onBookingComplete: () => void;
  allowCashPayments?: boolean;
  onClose: () => void;
}

export const BookSlotModal: React.FC<BookSlotModalProps> = (props) => {
  // Forward all props to the original component through the wrapper
  return <BookSlotModalWrapper {...props} />;
};
