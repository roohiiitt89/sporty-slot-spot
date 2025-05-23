import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, MapPin, Phone, Clock, Trash2, CheckCircle, XCircle, Navigation } from 'lucide-react';

interface VenueManagementProps {
  userRole: string | null;
  adminVenues?: Array<{ venue_id: string }>;
}

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string | null;
  capacity: number | null;
  contact_number: string | null;
  opening_hours: string | null;
  image_url: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

const VenueManagement: React.FC<VenueManagementProps> = ({ userRole, adminVenues = [] }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVenue, setCurrentVenue] = useState<Partial<Venue>>({
    name: '',
    location: '',
    description: '',
    capacity: null,
    contact_number: '',
    opening_hours: '',
    image_url: '',
    is_active: true,
    latitude: null,
    longitude: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const isSuperAdmin = userRole === 'super_admin';

  useEffect(() => {
    fetchVenues();
  }, [userRole, adminVenues]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      let query = supabase.from('venues').select('*');
      
      // For regular admins, only fetch their assigned venues
      if (userRole === 'admin' && adminVenues && adminVenues.length > 0) {
        const venueIds = adminVenues.map(venue => venue.venue_id);
        query = query.in('id', venueIds);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox for is_active
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentVenue({ ...currentVenue, [name]: checkbox.checked });
      return;
    }
    
    // Handle numeric inputs
    if (name === 'capacity') {
      setCurrentVenue({ ...currentVenue, [name]: value ? parseInt(value) : null });
      return;
    }

    // Handle latitude and longitude inputs
    if (name === 'latitude' || name === 'longitude') {
      setCurrentVenue({ ...currentVenue, [name]: value ? parseFloat(value) : null });
      return;
    }
    
    // Handle other inputs
    setCurrentVenue({ ...currentVenue, [name]: value });
  };

  const openModal = (venue?: Venue) => {
    if (venue) {
      setCurrentVenue(venue);
      setIsEditing(true);
    } else {
      setCurrentVenue({
        name: '',
        location: '',
        description: '',
        capacity: null,
        contact_number: '',
        opening_hours: '',
        image_url: '',
        is_active: true,
        latitude: null,
        longitude: null
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentVenue.name || !currentVenue.location) {
      toast({
        title: 'Missing information',
        description: 'Venue name and location are required.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (isEditing && currentVenue.id) {
        // For normal admins, verify they have permission to edit this venue
        if (userRole === 'admin') {
          const hasPermission = adminVenues?.some(v => v.venue_id === currentVenue.id);
          if (!hasPermission) {
            toast({
              title: 'Permission denied',
              description: 'You do not have permission to edit this venue.',
              variant: 'destructive',
            });
            return;
          }
        }

        // Update existing venue
        const { error } = await supabase
          .from('venues')
          .update({
            name: currentVenue.name,
            location: currentVenue.location,
            description: currentVenue.description,
            capacity: currentVenue.capacity,
            contact_number: currentVenue.contact_number,
            opening_hours: currentVenue.opening_hours,
            image_url: currentVenue.image_url,
            is_active: currentVenue.is_active,
            latitude: currentVenue.latitude,
            longitude: currentVenue.longitude
          })
          .eq('id', currentVenue.id);
          
        if (error) throw error;
        
        toast({
          title: 'Venue updated',
          description: `${currentVenue.name} has been updated successfully.`
        });
      } else if (isSuperAdmin) {
        // Only super admins can create new venues
        const { error, data } = await supabase
          .from('venues')
          .insert({
            name: currentVenue.name,
            location: currentVenue.location,
            description: currentVenue.description,
            capacity: currentVenue.capacity,
            contact_number: currentVenue.contact_number,
            opening_hours: currentVenue.opening_hours,
            image_url: currentVenue.image_url,
            is_active: currentVenue.is_active,
            latitude: currentVenue.latitude,
            longitude: currentVenue.longitude
          })
          .select();
          
        if (error) throw error;
        
        // If a regular admin created a venue, add them as an admin for that venue
        if (!isSuperAdmin && data && data.length > 0) {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) {
            throw new Error('User ID not available');
          }
          
          const { error: adminError } = await supabase
            .from('venue_admins')
            .insert({
              user_id: userId,
              venue_id: data[0].id
            });
          
          if (adminError) throw adminError;
        }
        
        toast({
          title: 'Venue created',
          description: `${currentVenue.name} has been created successfully.`
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Only super admins can create new venues.',
          variant: 'destructive',
        });
        return;
      }
      
      closeModal();
      fetchVenues();
    } catch (error) {
      console.error('Error saving venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to save venue',
        variant: 'destructive',
      });
    }
  };

  const toggleVenueStatus = async (venue: Venue) => {
    // For normal admins, verify they have permission
    if (userRole === 'admin') {
      const hasPermission = adminVenues?.some(v => v.venue_id === venue.id);
      if (!hasPermission) {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to modify this venue.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('venues')
        .update({ is_active: !venue.is_active })
        .eq('id', venue.id);
        
      if (error) throw error;
      
      toast({
        title: venue.is_active ? 'Venue deactivated' : 'Venue activated',
        description: `${venue.name} has been ${venue.is_active ? 'deactivated' : 'activated'}.`
      });
      
      fetchVenues();
    } catch (error) {
      console.error('Error toggling venue status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update venue status',
        variant: 'destructive',
      });
    }
  };

  const deleteVenue = async (venue: Venue) => {
    // Only super admins can delete venues
    if (!isSuperAdmin) {
      toast({
        title: 'Permission denied',
        description: 'Only super administrators can delete venues.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${venue.name}? This will also delete all associated courts and bookings.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', venue.id);
        
      if (error) throw error;
      
      toast({
        title: 'Venue deleted',
        description: `${venue.name} has been deleted.`
      });
      
      fetchVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete venue. It may have associated courts or bookings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold">Venue Management</h2>
        {isSuperAdmin && (
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add New Venue
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            {userRole === 'admin' 
              ? "You don't have any venues assigned to you" 
              : "No venues found"}
          </p>
          {isSuperAdmin && (
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Create Your First Venue
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map(venue => (
            <div key={venue.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {venue.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={venue.image_url} 
                    alt={venue.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">{venue.name}</span>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{venue.name}</h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venue.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {venue.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin size={16} className="flex-shrink-0 mr-1" />
                    <span>{venue.location}</span>
                  </div>
                  
                  {venue.contact_number && (
                    <div className="flex items-center">
                      <Phone size={16} className="flex-shrink-0 mr-1" />
                      <span>{venue.contact_number}</span>
                    </div>
                  )}
                  
                  {venue.opening_hours && (
                    <div className="flex items-center">
                      <Clock size={16} className="flex-shrink-0 mr-1" />
                      <span>{venue.opening_hours}</span>
                    </div>
                  )}
                </div>
                
                {venue.description && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                    {venue.description}
                  </p>
                )}
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => openModal(venue)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => toggleVenueStatus(venue)}
                    className={venue.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                    title={venue.is_active ? "Deactivate" : "Activate"}
                  >
                    {venue.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button
                    onClick={() => deleteVenue(venue)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Venue Form Modal - Updated to be more mobile friendly */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Venue' : 'Add New Venue'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentVenue.name || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={currentVenue.location || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={currentVenue.description || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={currentVenue.capacity === null ? '' : currentVenue.capacity}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={currentVenue.contact_number || ''}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={currentVenue.latitude === null ? '' : currentVenue.latitude}
                      onChange={handleChange}
                      placeholder="e.g., 40.7128"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={currentVenue.longitude === null ? '' : currentVenue.longitude}
                      onChange={handleChange}
                      placeholder="e.g., -74.0060"
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    name="opening_hours"
                    value={currentVenue.opening_hours || ''}
                    onChange={handleChange}
                    placeholder="e.g., Mon-Fri: 9 AM - 9 PM, Sat-Sun: 8 AM - 10 PM"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={currentVenue.image_url || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={currentVenue.is_active || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-sport-green focus:ring-sport-green border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors w-full sm:w-auto"
                >
                  {isEditing ? 'Update Venue' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueManagement;
