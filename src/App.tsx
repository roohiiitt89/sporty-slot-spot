import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import HomepageAvailabilityWidget from './components/HomepageAvailabilityWidget';
import { enableRealtimeForBookingSystem } from './integrations/supabase/realtime';
import AdminMobileHomePage from './pages/admin/MobileHomePage';
import BookForCustomer_Mobile from './pages/admin/BookForCustomer_Mobile';
import BlockTimeSlots_Mobile from './pages/admin/BlockTimeSlots_Mobile';
import React from 'react';
import Index from './pages';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import BookingConfirmation from './pages/BookingConfirmation';
import Admin from './pages/Admin';
import { AuthProvider } from './context/AuthContext';
import PublicRoute from './components/routes/PublicRoute';
import PrivateRoute from './components/routes/PrivateRoute';
import AdminRoute from './components/routes/AdminRoute';
import MobileHomePage from './pages/MobileHomePage';
import RealTimeAvailabilityMobile from './pages/admin/RealTimeAvailability_Mobile';
import BookingManagementMobile from './pages/admin/BookingManagement_Mobile';
import AnalyticsMobile from './pages/admin/Analytics_Mobile';
import RevenueMobile from './pages/admin/Revenue_Mobile';
import CustomerChatsMobile from './pages/admin/CustomerChats_Mobile';
import HelpRequestsMobile from './pages/admin/HelpRequests_Mobile';
import UsersMobile from './pages/admin/Users_Mobile';
import SettingsMobile from './pages/admin/Settings_Mobile';

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
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/booking-confirmation/:bookingId" element={<PrivateRoute><BookingConfirmation /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        
        {/* Mobile Routes */}
        <Route path="/mobile-home" element={<PrivateRoute><MobileHomePage /></PrivateRoute>} />

        {/* Admin Mobile Routes */}
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
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
