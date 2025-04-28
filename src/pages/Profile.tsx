import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LogOut, Edit, Calendar, User, Phone, Mail } from 'lucide-react';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  court: {
    name: string;
    venue: {
      name: string;
    };
    sport: {
      name: string;
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
          court:courts (
            name,
            venue:venues (name),
            sport:sports (name)
          )
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false });
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      // Filter out any bookings with unexpected status (if any)
      const validBookings = data?.filter(booking => 
        booking.status === 'confirmed' || booking.status === 'cancelled' || booking.status === 'completed'
      ) as Booking[];
      
      console.log('Fetched bookings:', validBookings);
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
      fetchUserProfile(); // Refresh profile data
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

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${amPm}`;
  };

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/4 bg-gray-50 p-6">
                <div className="flex flex-col space-y-2">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Your Account</h2>
                  
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      activeTab === 'profile' 
                        ? 'bg-sport-green text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`flex items-center space-x-2 p-2 rounded-md ${
                      activeTab === 'bookings' 
                        ? 'bg-sport-green text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Calendar size={18} />
                    <span>My Bookings</span>
                  </button>
                  
                  {userRole && (userRole === 'admin' || userRole === 'super_admin') && (
                    <a 
                      href="/admin" 
                      className="flex items-center space-x-2 p-2 rounded-md text-gray-700 hover:bg-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      <span>Admin Dashboard</span>
                    </a>
                  )}
                  
                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-2 p-2 rounded-md text-red-600 hover:bg-red-50 mt-8"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
              
              <div className="md:w-3/4 p-6">
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center space-x-1 text-sport-green hover:text-sport-green-dark"
                        >
                          <Edit size={18} />
                          <span>Edit Profile</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                          />
                          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                          />
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={updateProfile}
                            className="px-6 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
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
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <User className="text-sport-green" size={20} />
                                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                              </div>
                              <p className="mt-1 text-lg">{profile?.full_name || 'Not provided'}</p>
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <Mail className="text-sport-green" size={20} />
                                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                              </div>
                              <p className="mt-1 text-lg">{user?.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Phone className="text-sport-green" size={20} />
                                <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                              </div>
                              <p className="mt-1 text-lg">{profile?.phone || 'Not provided'}</p>
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sport-green" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                              </div>
                              <p className="mt-1 text-lg capitalize">{userRole || 'User'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Your Bookings</h2>
                    </div>
                    
                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-4">You don't have any bookings yet</p>
                        <a 
                          href="/venues" 
                          className="px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors inline-block"
                        >
                          Browse Venues
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {bookings.map((booking) => {
                          const isPast = new Date(`${booking.booking_date} ${booking.end_time}`) < new Date();
                          
                          return (
                            <div key={booking.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                              <div className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                  <div className="mb-4 md:mb-0">
                                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                                      <h3 className="text-lg font-medium text-gray-900">{booking.court.sport.name} at {booking.court.venue.name}</h3>
                                      <span className={`inline-flex px-2 py-1 mt-2 md:mt-0 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 mt-1">{booking.court.name}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                  <div className="bg-gray-50 px-3 py-2 rounded-md">
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-medium">{new Date(booking.booking_date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}</p>
                                  </div>
                                  
                                  <div className="bg-gray-50 px-3 py-2 rounded-md">
                                    <p className="text-xs text-gray-500">Time</p>
                                    <p className="font-medium">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                  </div>
                                  
                                  <div className="bg-gray-50 px-3 py-2 rounded-md">
                                    <p className="text-xs text-gray-500">Price</p>
                                    <p className="font-medium">₹{booking.total_price.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sport-gray">&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Profile;
