
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import HomepageAvailabilityWidget from './components/HomepageAvailabilityWidget';
import { enableRealtimeForBookingSystem } from './integrations/supabase/realtime';
import AdminMobileHomePage from './pages/admin/MobileHomePage';
import BookForCustomer_Mobile from './pages/admin/BookForCustomer_Mobile';
import BlockTimeSlots_Mobile from './pages/admin/BlockTimeSlots_Mobile';
import React from 'react';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookingConfirmation from './pages/BookingConfirmation';
import Admin from './pages/Admin';
import { AuthProvider } from './context/AuthContext';
import { RouteGuard } from './components/RouteGuard';
import MobileHomePage from './pages/MobileHomePage';
import RealTimeAvailabilityMobile from './pages/admin/RealTimeAvailability_Mobile';
import BookingManagementMobile from './pages/admin/BookingManagement_Mobile';
import AnalyticsMobile from './pages/admin/Analytics_Mobile';
import RevenueMobile from './pages/admin/Revenue_Mobile';
import CustomerChatsMobile from './pages/admin/CustomerChats_Mobile';
import HelpRequestsMobile from './pages/admin/HelpRequests_Mobile';
import UsersMobile from './pages/admin/Users_Mobile';
import SettingsMobile from './pages/admin/Settings_Mobile';
import VerifyEmail from './pages/VerifyEmail';

export function App() {
  useEffect(() => {
    // Enable realtime for booking system on app initialization
    enableRealtimeForBookingSystem();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/availability" element={<HomepageAvailabilityWidget />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* Public routes */}
        <Route element={<RouteGuard requireAuth={false} />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        {/* Protected routes */}
        <Route element={<RouteGuard requireAuth={true} />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/mobile-home" element={<MobileHomePage />} />
        </Route>
        
        {/* Admin routes */}
        <Route element={<RouteGuard requireAuth={true} adminOnly={true} />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/mobile-home" element={<AdminMobileHomePage />} />
          <Route path="/admin/book-for-customer-mobile" element={<BookForCustomer_Mobile />} />
          <Route path="/admin/block-time-slots-mobile" element={<BlockTimeSlots_Mobile />} />
          <Route path="/admin/real-time-availability-mobile" element={<RealTimeAvailabilityMobile />} />
          <Route path="/admin/booking-management-mobile" element={<BookingManagementMobile />} />
          <Route path="/admin/analytics-mobile" element={<AnalyticsMobile />} />
          <Route path="/admin/revenue-mobile" element={<RevenueMobile />} />
          <Route path="/admin/customer-chats-mobile" element={<CustomerChatsMobile />} />
          <Route path="/admin/help-requests-mobile" element={<HelpRequestsMobile />} />
          <Route path="/admin/users-mobile" element={<UsersMobile />} />
          <Route path="/admin/settings-mobile" element={<SettingsMobile />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
