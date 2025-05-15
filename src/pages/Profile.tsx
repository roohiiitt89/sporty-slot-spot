import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LogOut, Edit, Calendar, User, Phone, Mail, CreditCard, ChevronRight, ArrowLeft, Shield, Info } from 'lucide-react';
import SportDisplayName from '@/components/SportDisplayName';
import HelpChatWidget from '@/components/HelpChatWidget';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  payment_reference: string | null;
  payment_status: string | null;
  court: {
    name: string;
    venue: {
      name: string;
      id: string;
    };
    sport: {
      name: string;
      id: string;
    };
  };
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  });

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserBookings();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive'
      });
    }
  };

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, 
          booking_date, 
          start_time, 
          end_time, 
          total_price, 
          status,
          payment_reference,
          payment_status,
          court:courts (
            name,
            venue:venues (name, id),
            sport:sports (name, id)
          )
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      const validBookings = data?.filter(booking => 
        booking.status === 'confirmed' || 
        booking.status === 'cancelled' || 
        booking.status === 'completed'
      ) as Booking[];

      setBookings(validBookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully'
      });
      setIsEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-navy-dark to-indigo/30">
      <Header />
      
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Profile header with gradient and back button */}
            <div className="mb-6">
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center text-gray-300 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </button>
              
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-6 text-white shadow-lg border border-emerald-400/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">My Account</h1>
                    <p className="mt-2 opacity-90">
                      {activeTab === 'profile' ? 'Manage your personal information' : 'View and manage your bookings'}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{profile?.full_name || user?.email}</p>
                        <p className="text-xs opacity-80 capitalize">{userRole || 'User'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Enhanced Sidebar navigation */}
              <div className="md:w-72 flex-shrink-0">
                <div className="backdrop-blur-sm bg-white/10 rounded-xl shadow-md p-6 sticky top-28 border border-white/20">
                  <nav className="space-y-2">
                    <button 
                      onClick={() => setActiveTab('profile')} 
                      className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-white font-medium shadow-inner border border-emerald-400/30' : 'text-gray-300 hover:bg-white/5'}`}
                    >
                      <User className="mr-3 h-5 w-5" />
                      <span>Profile</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('bookings')} 
                      className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'bookings' ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-white font-medium shadow-inner border border-emerald-400/30' : 'text-gray-300 hover:bg-white/5'}`}
                    >
                      <Calendar className="mr-3 h-5 w-5" />
                      <span>My Bookings</span>
                      {bookings.length > 0 && (
                        <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {bookings.length}
                        </span>
                      )}
                    </button>
                    
                    {userRole && (userRole === 'admin' || userRole === 'super_admin') && (
                      <a 
                        href="/admin" 
                        className="flex items-center w-full p-4 rounded-xl text-gray-300 hover:bg-white/5 transition-all"
                      >
                        <Shield className="mr-3 h-5 w-5" />
                        <span>Admin Dashboard</span>
                      </a>
                    )}
                    
                    <div className="pt-4 mt-4 border-t border-white/20">
                      <button 
                        onClick={() => signOut()} 
                        className="flex items-center w-full p-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </nav>

                  {/* Help card */}
                  <div className="mt-8 bg-emerald-500/10 rounded-lg p-4 border border-emerald-400/30">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-emerald-100">Need help?</h4>
                        <p className="text-xs text-emerald-200 mt-1">
                          Contact our support team for any questions about your account or bookings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main content */}
              <div className="flex-1">
                {activeTab === 'profile' ? (
                  <div className="backdrop-blur-sm bg-white/10 rounded-xl shadow-md overflow-hidden border border-white/20">
                    <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-white/10">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                        {!isEditing && (
                          <button 
                            onClick={() => setIsEditing(true)} 
                            className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {isEditing ? (
                        <div className="space-y-6">
                          <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                              Full Name
                            </label>
                            <input 
                              type="text" 
                              id="full_name" 
                              name="full_name" 
                              value={formData.full_name} 
                              onChange={handleInputChange} 
                              className="block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:outline-none transition-all" 
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                              Email
                            </label>
                            <input 
                              type="email" 
                              id="email" 
                              value={user?.email || ''} 
                              disabled 
                              className="block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm bg-white/10 cursor-not-allowed text-gray-300" 
                            />
                            <p className="mt-1 text-sm text-gray-400">Email cannot be changed</p>
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                              Phone Number
                            </label>
                            <input 
                              type="tel" 
                              id="phone" 
                              name="phone" 
                              value={formData.phone} 
                              onChange={handleInputChange} 
                              className="block w-full px-4 py-3 border border-white/20 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:outline-none transition-all" 
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4">
                            <button 
                              onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                  full_name: profile?.full_name || '',
                                  phone: profile?.phone || ''
                                });
                              }} 
                              className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={updateProfile} 
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Personal Details Card */}
                          <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-white/20 flex items-center">
                              <User className="mr-2 h-5 w-5 text-emerald-400" />
                              Personal Details
                            </h3>
                            <div className="space-y-6">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <User className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-gray-300">Full Name</p>
                                  <p className="text-lg font-semibold text-white">
                                    {profile?.full_name || 'Not provided'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-gray-300">Account Type</p>
                                  <p className="text-lg font-semibold text-white capitalize">
                                    {userRole || 'User'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Contact Information Card */}
                          <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-6 pb-2 border-b border-white/20 flex items-center">
                              <Mail className="mr-2 h-5 w-5 text-emerald-400" />
                              Contact Information
                            </h3>
                            <div className="space-y-6">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <Mail className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-gray-300">Email Address</p>
                                  <p className="text-lg font-semibold text-white break-all">
                                    {user?.email}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                  <Phone className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-gray-300">Phone Number</p>
                                  <p className="text-lg font-semibold text-white">
                                    {profile?.phone || 'Not provided'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="backdrop-blur-sm bg-white/10 rounded-xl shadow-md overflow-hidden border border-white/20">
                      <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-white/10">
                        <h2 className="text-xl font-semibold text-white">Booking History</h2>
                        <p className="mt-1 text-sm text-gray-300">
                          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} in total
                        </p>
                      </div>
                      
                      {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                          <p className="text-gray-300">Loading your bookings...</p>
                        </div>
                      ) : bookings.length === 0 ? (
                        <div className="p-12 text-center">
                          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="mt-4 text-lg font-medium text-white">No bookings yet</h3>
                          <p className="mt-2 text-gray-300">You haven't made any bookings yet.</p>
                          <div className="mt-6">
                            <a 
                              href="/venues" 
                              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                            >
                              Browse Venues
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/20">
                          {bookings.map(booking => (
                            <div key={booking.id} className="p-6 hover:bg-white/5 transition-colors group">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                                <div className="flex-1">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mt-1">
                                      <Calendar className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div className="ml-4">
                                      <h3 className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors">
                                        {booking.court.venue.name}
                                      </h3>
                                      <p className="text-sm text-gray-300">
                                        {booking.court.name} -{' '}
                                        <SportDisplayName 
                                          venueId={booking.court.venue.id} 
                                          sportId={booking.court.sport.id} 
                                          defaultName={booking.court.sport.name} 
                                        />
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="backdrop-blur-sm bg-white/5 p-3 rounded-lg border border-white/20">
                                      <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">Date</p>
                                      <p className="mt-1 font-medium text-white">
                                        {formatDate(booking.booking_date)}
                                      </p>
                                    </div>
                                    
                                    <div className="backdrop-blur-sm bg-white/5 p-3 rounded-lg border border-white/20">
                                      <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">Time</p>
                                      <p className="mt-1 font-medium text-white">
                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                      </p>
                                    </div>
                                    
                                    <div className="backdrop-blur-sm bg-white/5 p-3 rounded-lg border border-white/20">
                                      <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</p>
                                      <p className="mt-1 font-medium text-white">
                                        ₹{booking.total_price.toFixed(2)}
                                      </p>
                                    </div>
                                    
                                    <div className="backdrop-blur-sm bg-white/5 p-3 rounded-lg border border-white/20">
                                      <p className="text-xs font-medium text-gray-300 uppercase tracking-wider">Status</p>
                                      <div className="mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {booking.payment_reference && (
                                    <div className="mt-6 bg-emerald-500/10 p-4 rounded-lg border border-emerald-400/30">
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 h-5 w-5 text-emerald-400 mt-0.5">
                                          <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm font-medium text-emerald-100">
                                            Payment Details
                                          </p>
                                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-xs text-emerald-200">Reference ID</p>
                                              <p className="text-sm font-medium text-white break-all">
                                                {booking.payment_reference}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-emerald-200">Payment Status</p>
                                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                                {booking.payment_status || 'Unknown'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-shrink-0 lg:self-center">
                                  <a 
                                    href={`/venues/${booking.court.venue.id}`} 
                                    className="inline-flex items-center px-4 py-2.5 border border-white/20 shadow-sm text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md group-hover:border-emerald-400 group-hover:text-emerald-400"
                                  >
                                    View Venue
                                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-navy-dark/50 backdrop-blur-sm py-6 border-t border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
      {/* Show HelpChatWidget only for mobile and signed-in users, shifted up above BottomNav */}
      {isMobile && user && (
        <div className="fixed right-4 bottom-48 z-68">
          <HelpChatWidget />
        </div>
      )}
    </div>
  );
};

export default Profile;
