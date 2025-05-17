
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
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
import AdminBottomNav from "./components/ui/AdminBottomNav";
import { useState, useEffect } from 'react';
import { TournamentDashboard } from "./pages/tournament/TournamentDashboard";
import { TournamentDetailsPage } from "./pages/tournament/TournamentDetailsPage";
import { HostTournamentPage } from "./pages/tournament/HostTournamentPage";
import MorePage from "./pages/MorePage";
import ScrollToTopOnMobile from "@/components/ScrollToTopOnMobile";
import { useIsMobile } from "@/hooks/use-mobile";

const queryClient = new QueryClient();

const App = () => {
  const [chatActive, setChatActive] = useState(false);
  const isMobile = useIsMobile();

  const handleChatClick = () => setChatActive((prev) => !prev);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTopOnMobile />
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

            {/* Display admin bottom nav for admin routes on mobile */}
            {(!chatActive || !isMobile) && (
              <>
                {/* Regular bottom nav for user pages */}
                <BottomNav onChatClick={handleChatClick} chatActive={chatActive} setChatActive={setChatActive} />
                
                {/* Admin bottom nav for admin pages */}
                <AdminBottomNav onChatClick={handleChatClick} chatActive={chatActive} setChatActive={setChatActive} />
              </>
            )}
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
