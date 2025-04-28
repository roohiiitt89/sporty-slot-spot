
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
}

interface VenueManagementProps {
  userRole: string | null;
}

const VenueManagement: React.FC<VenueManagementProps> = ({ userRole }) => {
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
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      let query = supabase.from('venues').select('*');
      
      // Super admins see all venues, regular admins see only their assigned venues
      if (userRole !== 'super_admin') {
        query = query.eq('id', 'venue_id_placeholder'); // This would be replaced with actual logic to get assigned venues
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox for is_active
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentVenue({ ...currentVenue, [name]: checkbox.checked });
      return;
    }
    
    // Handle number inputs
    if (name === 'capacity') {
      setCurrentVenue({ ...currentVenue, [name]: value ? parseInt(value) : null });
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
        is_active: true
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
        description: 'Please fill in the required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (isEditing && currentVenue.id) {
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
            is_active: currentVenue.is_active
          })
          .eq('id', currentVenue.id);
          
        if (error) throw error;
        
        toast({
          title: 'Venue updated',
          description: `${currentVenue.name} has been updated successfully.`
        });
      } else {
        // Create new venue
        const { error } = await supabase
          .from('venues')
          .insert({
            name: currentVenue.name,
            location: currentVenue.location,
            description: currentVenue.description,
            capacity: currentVenue.capacity,
            contact_number: currentVenue.contact_number,
            opening_hours: currentVenue.opening_hours,
            image_url: currentVenue.image_url,
            is_active: currentVenue.is_active
          });
          
        if (error) throw error;
        
        toast({
          title: 'Venue created',
          description: `${currentVenue.name} has been created successfully.`
        });
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Venue Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
        >
          Add New Venue
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No venues found</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
          >
            Create Your First Venue
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {venues.map((venue) => (
                <tr key={venue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{venue.name}</div>
                    {venue.capacity && <div className="text-sm text-gray-500">Capacity: {venue.capacity}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{venue.location}</div>
                    {venue.opening_hours && <div className="text-xs text-gray-500">{venue.opening_hours}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{venue.contact_number || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        venue.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {venue.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(venue)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleVenueStatus(venue)}
                      className={`${
                        venue.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {venue.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Venue Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
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
                    value={currentVenue.name}
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
                    value={currentVenue.location}
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
                      value={currentVenue.capacity || ''}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                      min={0}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="contact_number"
                      value={currentVenue.contact_number || ''}
                      onChange={handleChange}
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
                    className="w-full p-2 border rounded-md"
                    placeholder="e.g. Mon-Fri: 9AM-5PM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="image_url"
                    value={currentVenue.image_url || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://example.com/image.jpg"
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
              
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
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
