
export interface HelpRequest {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  user_name?: string;
  user_email?: string;
}

// Type for RPC function return types
export type GetUserHelpRequestsResult = HelpRequest[];
export type GetHelpRequestsResult = HelpRequest[];
export type CreateHelpRequestResult = HelpRequest;
export type UpdateHelpRequestStatusResult = HelpRequest;

// Types for the real-time availability feature
export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  booking?: BookingInfo;
}

// Using the specific enum values to match Database["public"]["Enums"]["booking_status"]
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentMethod = 'online' | 'cash' | 'card' | 'free';

// User info interface
export interface UserInfo {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

// Admin info interface
export interface AdminInfo {
  full_name: string | null;
  email: string | null;
}

// Admin booking info interface - updated to match the actual structure
export interface AdminBookingInfo {
  id: string;
  booking_id: string;
  admin_id: string;
  customer_name: string;
  customer_phone: string | null;
  payment_method: PaymentMethod;
  payment_status?: string | null;
  amount_collected?: number | null;
  created_at: string;
  notes?: string | null;
}

// Extend BookingInfo to include user information
export interface BookingInfo {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  start_time: string;
  end_time: string;
  booking_date: string;
  status: BookingStatus;
  payment_status: string | null;
  payment_method?: PaymentMethod;
  booked_by_admin_id?: string | null;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  admin_booking?: AdminBookingInfo | null;
  user_info?: UserInfo;
  admin_info?: AdminInfo;
}

export type GetAvailableSlotsResult = AvailabilitySlot[];

// Booking type specific for the BookingManagement component
export interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: BookingStatus;
  payment_reference: string | null;
  payment_status: string | null;
  payment_method: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string;
  booked_by_admin_id: string | null;
  court: {
    id: string;
    name: string;
    venue: {
      id: string;
      name: string;
    };
    sport: {
      id: string;
      name: string;
    };
  };
  user_info?: UserInfo;
  admin_info?: AdminInfo;
  admin_booking?: AdminBookingInfo | null;
}
