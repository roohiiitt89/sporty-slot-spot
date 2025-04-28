
import React, { useEffect, useState } from 'react';
import { User, Calendar, Clock, MapPin } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
}

interface Booking {
  id: string;
  court: {
    name: string;
    venue: {
      name: string;
      location: string;
    };
    sport: {
      name: string;
    };
  };
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  
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
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
        setEditedProfile(data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to load your profile information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserBookings = async () => {
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
          court:court_id (
            name,
            venue:venue_id (
              name,
              location
            ),
            sport:sport_id (
              name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setBookings(data as unknown as Booking[]);
      }
    } catch (error: any) {
      console.error('Error fetching bookings:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to load your booking information.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          phone: editedProfile.phone,
        })
        .eq('id', user?.id);
        
      if (error) {
        throw error;
      }
      
      setUserProfile({
        ...userProfile!,
        full_name: editedProfile.full_name || userProfile?.full_name || null,
        phone: editedProfile.phone || userProfile?.phone || null,
      });
      
      setIsEditMode(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      toast({
        title: 'Error',
        description: 'Failed to update your profile.',
        variant: 'destructive',
      });
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-sport-green text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sport-gray-light">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sport-green"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      {/* User Profile Section */}
      <div className="bg-sport-green pt-32 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-4">My Profile</h1>
          <p className="text-xl text-white opacity-90 mb-6">
            Manage your account information and view your bookings
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Profile info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-sport-gray-dark">Personal Information</h2>
                  <button 
                    onClick={() => isEditMode ? handleUpdateProfile() : setIsEditMode(true)}
                    className="px-4 py-2 text-sm bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
                  >
                    {isEditMode ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>
                
                <div className="mb-8">
                  <div className="w-20 h-20 bg-sport-gray-light rounded-full flex items-center justify-center mx-auto">
                    <User className="h-10 w-10 text-sport-gray-dark" />
                  </div>
                  
                  <div className="text-center mt-4">
                    <h3 className="text-xl font-medium text-sport-gray-dark">{userProfile?.full_name}</h3>
                    <span className="px-3 py-1 inline-block mt-2 rounded-full text-xs font-medium uppercase bg-sport-green bg-opacity-10 text-sport-green">
                      {userProfile?.role}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {isEditMode ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-sport-gray-dark mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editedProfile.full_name || ''}
                          onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
                          className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-sport-gray-dark mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editedProfile.email || ''}
                          disabled
                          className="w-full p-3 border border-sport-gray-light rounded-md bg-gray-100"
                        />
                        <p className="mt-1 text-xs text-sport-gray">Email cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-sport-gray-dark mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={editedProfile.phone || ''}
                          onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                          className="w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                        />
                      </div>
                      
                      <div className="pt-4 flex space-x-2">
                        <button
                          onClick={() => setIsEditMode(false)}
                          className="px-4 py-2 flex-1 border border-sport-gray-light text-sport-gray-dark rounded-md hover:bg-sport-gray-light transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateProfile}
                          className="px-4 py-2 flex-1 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="text-sm text-sport-gray">Full Name</h4>
                        <p className="text-sport-gray-dark font-medium">{userProfile?.full_name || 'Not set'}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm text-sport-gray">Email Address</h4>
                        <p className="text-sport-gray-dark font-medium">{userProfile?.email}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm text-sport-gray">Phone Number</h4>
                        <p className="text-sport-gray-dark font-medium">{userProfile?.phone || 'Not set'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-sport-gray-dark mb-6">My Bookings</h2>
                
                {bookings.length === 0 ? (
                  <div className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-sport-gray mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-sport-gray-dark mb-2">No bookings yet</h3>
                    <p className="text-sport-gray mb-6">You haven't made any bookings yet.</p>
                    <a
                      href="/venues"
                      className="px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors inline-block"
                    >
                      Book a Venue
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-sport-gray-light rounded-lg p-4 hover:border-sport-green transition-colors"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-sport-gray-dark">{booking.court.sport.name} - {booking.court.name}</h3>
                            <p className="text-sport-gray">{booking.court.venue.name}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                          <div className="flex items-center text-sport-gray">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center text-sport-gray">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                          <div className="flex items-center text-sport-gray">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{booking.court.venue.location}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <p className="font-medium text-sport-gray-dark">${booking.total_price.toFixed(2)}</p>
                          
                          {booking.status === 'pending' && (
                            <button 
                              className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('bookings')
                                    .update({ status: 'cancelled' })
                                    .eq('id', booking.id);
                                    
                                  if (error) throw error;
                                  
                                  fetchUserBookings();
                                  
                                  toast({
                                    title: "Booking cancelled",
                                    description: "Your booking has been cancelled successfully.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to cancel the booking. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-sport-gray-dark text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Profile;
