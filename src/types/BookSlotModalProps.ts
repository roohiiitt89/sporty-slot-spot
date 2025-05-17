
// This file defines the props for BookSlotModal component
export interface BookSlotModalProps {
  selectedDate: Date;
  selectedCourt: any | null;
  hourlyRate: number | null;
  onBookingComplete: () => void;
  allowCashPayments: boolean;
  onClose: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  venueId?: string;
  sportId?: string;
}
