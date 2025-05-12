
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
import Profile from "./pages/Profile";
import ChallengeDashboard from "./pages/challenge/ChallengeDashboard";
import TeamDetails from "./pages/challenge/TeamDetails";
import HelpChatWidget from "./components/HelpChatWidget";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            </Route>
            
            {/* Admin routes - accessible to both admin and super_admin */}
            <Route element={<RouteGuard requireAuth={true} requiredRole="admin" adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            {/* Root path and content routes - also protected from admin access via RouteGuard logic */}
            <Route path="/" element={<Index />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venues/:id" element={<VenueDetails />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Global Help Chat Widget (shown on all pages for authenticated users) */}
          <HelpChatWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
