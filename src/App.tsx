
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RouteGuard } from "./components/RouteGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Venues from "./pages/Venues";
import VenueDetails from "./pages/VenueDetails";
import Sports from "./pages/Sports";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminHome from "./pages/admin/AdminHome";
import Profile from "./pages/Profile";
import ChallengeDashboard from "./pages/challenge/ChallengeDashboard";
import TeamDetails from "./pages/challenge/TeamDetails";
import NewAIChatWidget from "./components/NewAIChatWidget";
import Faq3Demo from "./pages/Faq3Demo";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import BottomNav from "./components/ui/BottomNav";
import { useState, useEffect } from 'react';
import { TournamentDashboard } from "./pages/tournament/TournamentDashboard";
import TournamentDetailsPage from "./pages/tournament/TournamentDetailsPage";
import { HostTournamentPage } from "./pages/tournament/HostTournamentPage";
import MorePage from "./pages/MorePage";
import ScrollToTopOnMobile from "@/components/ScrollToTopOnMobile";
import NotificationBell from './components/NotificationBell';
import { HelmetProvider } from 'react-helmet-async';
import AdminRedirector from './components/AdminRedirector';
import AnalyticsDashboard_Mobile from '@/pages/admin/AnalyticsDashboard_Mobile';
import BookingTrends_Mobile from '@/pages/admin/BookingTrends_Mobile';
import PopularSports_Mobile from '@/pages/admin/PopularSports_Mobile';
import PeakHours_Mobile from '@/pages/admin/PeakHours_Mobile';
import RecentBookings_Mobile from '@/pages/admin/RecentBookings_Mobile';
import Bookings_Mobile from '@/pages/admin/Bookings_Mobile';
import BookForCustomer_Mobile from '@/pages/admin/BookForCustomer_Mobile';
import BlockTimeSlots_Mobile from '@/pages/admin/BlockTimeSlots_Mobile';
import AdminHome_Mobile from '@/pages/admin/AdminHome_Mobile';
import AdminBottomNav from './components/ui/AdminBottomNav';
import VenueManagement_Mobile from '@/pages/admin/VenueManagement_Mobile';
import SportManagement_Mobile from '@/pages/admin/SportManagement_Mobile';
import ReviewManagement_Mobile from '@/pages/admin/ReviewManagement_Mobile';
import MessageManagement_Mobile from '@/pages/admin/MessageManagement_Mobile';
import HelpRequestsManagement_Mobile from '@/pages/admin/HelpRequestsManagement_Mobile';

const queryClient = new QueryClient();

const App = () => {
  const [chatActive, setChatActive] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleChatClick = () => setChatActive((prev) => !prev);

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
              <ScrollToTopOnMobile />
              {isMobile && <NotificationBell />}
              <AdminRedirector />
            <Routes>
              {/* Public routes */}
              <Route element={<RouteGuard requireAuth={false} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
              </Route>

              {/* Protected routes - only for normal users */}
              <Route element={<RouteGuard requireAuth={true} adminOnly={false} />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/challenge" element={<ChallengeDashboard />} />
                <Route path="/team/:slug" element={<TeamDetails />} />
                <Route path="/more" element={<MorePage />} />
              </Route>
              
              {/* Admin routes - accessible to both admin and super_admin */}
              <Route element={<RouteGuard requireAuth={true} requiredRole="admin" adminOnly={true} />}>
                <Route path="/admin" element={<AdminHome />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              {/* Mobile admin routes */}
              <Route element={<RouteGuard requireAuth={true} requiredRole="admin" adminOnly={true} />}>
                {/* Mobile admin home */}
                <Route path="/admin/mobile-home" element={<AdminHome_Mobile />} />
                
                {/* Mobile analytics routes */}
                <Route path="/admin/analytics-mobile" element={<AnalyticsDashboard_Mobile />} />
                <Route path="/admin/booking-trends-mobile" element={<BookingTrends_Mobile />} />
                <Route path="/admin/popular-sports-mobile" element={<PopularSports_Mobile />} />
                <Route path="/admin/peak-hours-mobile" element={<PeakHours_Mobile />} />
                <Route path="/admin/recent-bookings-mobile" element={<RecentBookings_Mobile />} />

                {/* Mobile bookings routes */}
                <Route path="/admin/bookings-mobile" element={<Bookings_Mobile />} />
                <Route path="/admin/book-for-customer-mobile" element={<BookForCustomer_Mobile />} />
                <Route path="/admin/block-time-slots-mobile" element={<BlockTimeSlots_Mobile />} />

                {/* Mobile admin section routes */}
                <Route path="/admin/venues-mobile" element={<VenueManagement_Mobile />} />
                <Route path="/admin/sports-mobile" element={<SportManagement_Mobile />} />
                <Route path="/admin/reviews-mobile" element={<ReviewManagement_Mobile />} />
                <Route path="/admin/messages-mobile" element={<MessageManagement_Mobile />} />
                <Route path="/admin/help-mobile" element={<HelpRequestsManagement_Mobile />} />
              </Route>

              {/* Tournament routes */}
              {/* Public: View tournaments and details */}
              <Route path="/tournaments" element={<TournamentDashboard />} />
              <Route path="/tournaments/:slug" element={<TournamentDetailsPage />} />
              {/* Protected: Only logged-in users can host */}
              <Route element={<RouteGuard requireAuth={true} adminOnly={false} />}>
                <Route path="/tournaments/host" element={<HostTournamentPage />} />
              </Route>

              {/* Root path and content routes - also protected from admin access via RouteGuard logic */}
              <Route path="/" element={<Index />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/:id" element={<VenueDetails />} />
              <Route path="/sports" element={<Sports />} />
              <Route path="/faq" element={<Faq3Demo />} />
              <Route path="/help" element={<Help />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* Always mount the chat widget on mobile, but control visibility with isOpen */}
            {isMobile ? (
              <NewAIChatWidget isOpen={chatActive} setIsOpen={setChatActive} />
            ) : (
              <NewAIChatWidget />
            )}
            {(!chatActive || !isMobile) && (
              <>
                <AdminBottomNav />
                <BottomNav onChatClick={handleChatClick} chatActive={chatActive} setChatActive={setChatActive} />
              </>
            )}
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
