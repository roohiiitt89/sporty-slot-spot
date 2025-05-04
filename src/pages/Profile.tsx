import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LogOut, Edit, Calendar, User, Phone, Mail, CreditCard, ChevronRight, ArrowLeft } from 'lucide-react';
import SportDisplayName from '@/components/SportDisplayName';

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
  const { user, signOut, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

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
        phone: data.phone || '',
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
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
        booking.status === 'confirmed' || booking.status === 'cancelled' || booking.status === 'completed'
      ) as Booking[];
      
      setBookings(validBookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your bookings',
        variant: 'destructive',
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
          phone: formData.phone,
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      
      setIsEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Profile header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
              <p className="mt-2 text-gray-600">
                {activeTab === 'profile' ? 'Manage your personal information' : 'View and manage your bookings'}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar navigation */}
              <div className="md:w-64 flex-shrink-0">
                <div className="bg-white rounded-xl shadow-sm p-4 sticky top-28">
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-sport-green/10 text-sport-green font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User className="mr-3 h-5 w-5" />
                      <span>Profile</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                        activeTab === 'bookings'
                          ? 'bg-sport-green/10 text-sport-green font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Calendar className="mr-3 h-5 w-5" />
                      <span>My Bookings</span>
                    </button>
                    
                    {userRole && (userRole === 'admin' || userRole === 'super_admin') && (
                      <a
                        href="/admin"
                        className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <span>Admin Dashboard</span>
                      </a>
                    )}
                    
                    <button
                      onClick={() => signOut()}
                      className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-6"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Main content */}
              <div className="flex-1">
                {activeTab === 'profile' ? (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sport-green"
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
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="full_name"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-sport-green focus:border-sport-green"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={user?.email || ''}
                              disabled
                              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                            />
                            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-sport-green focus:border-sport-green"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-2">
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                  full_name: profile?.full_name || '',
                                  phone: profile?.phone || '',
                                });
                              }}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sport-green"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={updateProfile}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sport-green hover:bg-sport-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sport-green"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Personal Details</h3>
                              <div className="space-y-4">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sport-green/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-sport-green" />
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {profile?.full_name || 'Not provided'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sport-green/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sport-green" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Account Type</p>
                                    <p className="text-sm font-semibold text-gray-900 capitalize">
                                      {userRole || 'User'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
                              <div className="space-y-4">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sport-green/10 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-sport-green" />
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {user?.email}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sport-green/10 flex items-center justify-center">
                                    <Phone className="h-5 w-5 text-sport-green" />
                                  </div>
                                  <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {profile?.phone || 'Not provided'}
                                    </p>
                                  </div>
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
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Booking History</h2>
                      </div>
                      
                      {loading ? (
                        <div className="p-12 flex justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sport-green"></div>
                        </div>
                      ) : bookings.length === 0 ? (
                        <div className="p-12 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              vectorEffect="non-scaling-stroke"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings yet</h3>
                          <p className="mt-1 text-gray-500">You haven't made any bookings yet.</p>
                          <div className="mt-6">
                            <a
                              href="/venues"
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sport-green hover:bg-sport-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sport-green"
                            >
                              Browse Venues
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {bookings.map((booking) => (
                            <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                      <h3 className="text-base font-medium text-gray-900">
                                        {booking.court.venue.name}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {booking.court.name} -{' '}
                                        <SportDisplayName
                                          venueId={booking.court.venue.id}
                                          sportId={booking.court.sport.id}
                                          defaultName={booking.court.sport.name}
                                        />
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div>
                                      <p className="text-gray-500">Date</p>
                                      <p className="font-medium text-gray-900">
                                        {formatDate(booking.booking_date)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Time</p>
                                      <p className="font-medium text-gray-900">
                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Amount</p>
                                      <p className="font-medium text-gray-900">
                                        ₹{booking.total_price.toFixed(2)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Status</p>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {booking.payment_reference && (
                                    <div className="mt-4 flex items-start">
                                      <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                                        <CreditCard className="h-5 w-5" />
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                          <span className="font-medium">Payment ID:</span> {booking.payment_reference}
                                        </p>
                                        <div className="mt-1 flex items-center">
                                          <span className="text-xs text-gray-500 mr-2">Status:</span>
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                            {booking.payment_status || 'Unknown'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-shrink-0">
                                  <a
                                    href={`/venues/${booking.court.venue.id}`}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sport-green"
                                  >
                                    View Venue
                                    <ChevronRight className="ml-1 h-4 w-4" />
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
      
      <footer className="bg-white py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Profile;
