import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LogOut, Edit, Calendar, User, Phone, Mail, CreditCard, ChevronRight } from 'lucide-react';
import SportDisplayName from '@/components/SportDisplayName';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="md:flex">
                {/* Sidebar Navigation */}
                <div className="md:w-1/4 bg-gray-50 p-6 border-r border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">My Account</h2>
                    
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeTab === 'profile' 
                          ? 'bg-green-700 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <User size={18} />
                      <span>Profile</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeTab === 'bookings' 
                          ? 'bg-green-700 text-white' 
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Calendar size={18} />
                      <span>My Bookings</span>
                    </button>
                    
                    {userRole && (userRole === 'admin' || userRole === 'super_admin') && (
                      <a 
                        href="/admin" 
                        className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <span>Admin Dashboard</span>
                      </a>
                    )}
                    
                    <button
                      onClick={() => signOut()}
                      className="flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 mt-8 transition-colors"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
                
                {/* Main Content */}
                <div className="md:w-3/4 p-6">
                  {activeTab === 'profile' ? (
                    <div>
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center space-x-2 text-green-700 hover:text-green-800 transition-colors"
                          >
                            <Edit size={18} />
                            <span>Edit Profile</span>
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                            />
                            <p className="mt-2 text-sm text-gray-500">Email cannot be changed</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="flex space-x-4 pt-2">
                            <button
                              onClick={updateProfile}
                              className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                  full_name: profile?.full_name || '',
                                  phone: profile?.phone || '',
                                });
                              }}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <User className="text-green-700" size={20} />
                                  <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                                </div>
                                <p className="text-lg font-medium text-gray-800">
                                  {profile?.full_name || 'Not provided'}
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <Mail className="text-green-700" size={20} />
                                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                                </div>
                                <p className="text-lg font-medium text-gray-800">
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-6">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <Phone className="text-green-700" size={20} />
                                  <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                                </div>
                                <p className="text-lg font-medium text-gray-800">
                                  {profile?.phone || 'Not provided'}
                                </p>
                              </div>
                              
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                  <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                                </div>
                                <p className="text-lg font-medium text-gray-800 capitalize">
                                  {userRole || 'User'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Booking History</h2>
                      </div>
                      
                      {loading ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-700"></div>
                        </div>
                      ) : bookings.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <h3 className="text-xl font-semibold text-gray-700 mb-4">No Bookings Found</h3>
                          <p className="text-gray-500 mb-6">You haven't made any bookings yet.</p>
                          <button
                            onClick={() => navigate('/venues')}
                            className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                          >
                            Browse Venues
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.map(booking => (
                            <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center">
                                  <Calendar className="text-gray-500 mr-3" size={18} />
                                  <span className="font-medium text-gray-700">
                                    {formatDate(booking.booking_date)}
                                  </span>
                                </div>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                              
                              <div className="p-5">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      {booking.court.venue.name}
                                    </h3>
                                    <p className="text-gray-600 mt-1">
                                      {booking.court.name} • {' '}
                                      <SportDisplayName 
                                        venueId={booking.court.venue.id} 
                                        sportId={booking.court.sport.id} 
                                        defaultName={booking.court.sport.name} 
                                      />
                                    </p>
                                  </div>
                                  <div className="md:text-right">
                                    <p className="text-gray-700">
                                      <span className="font-medium">Time:</span> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                    </p>
                                    <p className="text-gray-700 mt-1">
                                      <span className="font-medium">Price:</span> {formatCurrency(booking.total_price)}
                                    </p>
                                  </div>
                                </div>
                                
                                {booking.payment_reference && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-start sm:items-center">
                                    <CreditCard className="text-blue-600 mt-1 sm:mt-0 mr-3 flex-shrink-0" size={18} />
                                    <div>
                                      <p className="text-blue-800 text-sm">
                                        <span className="font-medium">Payment Reference:</span> {booking.payment_reference}
                                      </p>
                                      <div className="flex items-center mt-1">
                                        <span className="text-xs font-medium mr-2">Status:</span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                                          {booking.payment_status || 'Unknown'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="mt-4 flex justify-end">
                                  <button
                                    onClick={() => navigate(`/venues/${booking.court.venue.id}`)}
                                    className="flex items-center text-green-700 hover:text-green-800 transition-colors"
                                  >
                                    View Venue Details
                                    <ChevronRight className="ml-1 w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-white py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} SportySlot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Profile;
