
import { useState, useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Index";
import Contact from "@/pages/Contact";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Sports from "@/pages/Sports";
import Venues from "@/pages/Venues";
import VenueDetails from "@/pages/VenueDetails";
import Help from "@/pages/Help";
import Faq3Demo from "@/pages/Faq3Demo";
import { RouteGuard } from "@/components/RouteGuard";
import VerifyEmail from "@/pages/VerifyEmail";
import Bookings from "@/pages/Bookings";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import "@/App.css";
import AdminHome from "@/pages/admin/AdminHome";
import Dashboard from "@/pages/admin/Dashboard";
import VenueManagement from "@/pages/admin/VenueManagement";
import SportManagement from "@/pages/admin/SportManagement";
import CourtManagement from "@/pages/admin/CourtManagement";
import BookingManagement from "@/pages/admin/BookingManagement";
import ReviewManagement from "@/pages/admin/ReviewManagement";
import MessageManagement from "@/pages/admin/MessageManagement";
import HelpRequestsManagement from "@/pages/admin/HelpRequestsManagement";
import Privacy from "@/pages/Privacy";
import SportDisplayNames from "@/pages/admin/SportDisplayNames";
import TemplateSlotManagement from "@/pages/admin/TemplateSlotManagement";
import AnalyticsDashboard from "@/pages/admin/AnalyticsDashboard";
import ChallengeDashboard from "@/pages/challenge/ChallengeDashboard";
import TeamDetails from "@/pages/challenge/TeamDetails";
import { TournamentDashboard } from "@/pages/tournament/TournamentDashboard";
import { HostTournamentPage } from "@/pages/tournament/HostTournamentPage";
import { TournamentDetailsPage } from "@/pages/tournament/TournamentDetailsPage";

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  const [darkMode, setDarkMode] = useLocalStorage<boolean>("darkMode", false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme={darkMode ? "dark" : "light"}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<Faq3Demo />} />

              <Route path="/profile" element={<RouteGuard><Profile /></RouteGuard>} />
              <Route path="/bookings" element={<RouteGuard><Bookings /></RouteGuard>} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              
              <Route path="/sports" element={<Sports />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/:id" element={<VenueDetails />} />
              
              <Route path="/help" element={<Help />} />
              <Route path="/privacy" element={<Privacy />} />
              
              <Route path="/challenge" element={<ChallengeDashboard />} />
              <Route path="/teams/:slug" element={<TeamDetails />} />
              
              <Route path="/tournaments" element={<TournamentDashboard />} />
              <Route path="/tournaments/host" element={<HostTournamentPage />} />
              <Route path="/tournaments/:slug" element={<TournamentDetailsPage />} />
              
              <Route path="/admin" element={<RouteGuard role="admin"><AdminHome /></RouteGuard>} />
              <Route path="/admin/dashboard" element={<RouteGuard role="admin"><Dashboard /></RouteGuard>} />
              <Route path="/admin/analytics" element={<RouteGuard role="admin"><AnalyticsDashboard /></RouteGuard>} />
              <Route path="/admin/venues" element={<RouteGuard role="admin"><VenueManagement /></RouteGuard>} />
              <Route path="/admin/sport-names" element={<RouteGuard role="admin"><SportDisplayNames /></RouteGuard>} />
              <Route path="/admin/sports" element={<RouteGuard role="admin"><SportManagement /></RouteGuard>} />
              <Route path="/admin/courts" element={<RouteGuard role="admin"><CourtManagement /></RouteGuard>} />
              <Route path="/admin/template-slots" element={<RouteGuard role="admin"><TemplateSlotManagement /></RouteGuard>} />
              <Route path="/admin/bookings" element={<RouteGuard role="admin"><BookingManagement /></RouteGuard>} />
              <Route path="/admin/reviews" element={<RouteGuard role="admin"><ReviewManagement /></RouteGuard>} />
              <Route path="/admin/messages" element={<RouteGuard role="admin"><MessageManagement /></RouteGuard>} />
              <Route path="/admin/help-requests" element={<RouteGuard role="admin"><HelpRequestsManagement /></RouteGuard>} />
              
              <Route path="/not-found" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
