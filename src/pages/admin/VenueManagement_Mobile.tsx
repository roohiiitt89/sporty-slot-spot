import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Edit, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string | null;
  is_active: boolean;
  description?: string | null;
  capacity?: number | null;
  contact_number?: string | null;
  opening_hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const VenueManagement_Mobile: React.FC = () => {
  const { user, userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVenue, setCurrentVenue] = useState<Partial<Venue>>({
    name: '',
    location: '',
    description: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchVenues = async () => {
      let venueIds: string[] = [];
      if (userRole === 'admin') {
        const { data, error } = await supabase.rpc('get_admin_venues');
        if (!error) {
          setAdminVenues(data || []);
          venueIds = (data || []).map((v: any) => v.venue_id);
        }
      }
      let query = supabase.from('venues').select('*');
      if (userRole === 'admin' && venueIds.length > 0) {
        query = query.in('id', venueIds);
      }
      const { data: venuesData, error: venuesError } = await query.order('name');
      if (!venuesError) setVenues(venuesData || []);
      setLoading(false);
    };
    fetchVenues();
  }, [userRole]);

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

  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentVenue({ ...currentVenue, [name]: checkbox.checked });
      return;
    }
    if (name === 'capacity') {
      setCurrentVenue({ ...currentVenue, [name]: value ? parseInt(value) : null });
      return;
    }
    if (name === 'latitude' || name === 'longitude') {
      setCurrentVenue({ ...currentVenue, [name]: value ? parseFloat(value) : null });
      return;
    }
    setCurrentVenue({ ...currentVenue, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVenue.name || !currentVenue.location) return;
    
    try {
      if (isEditing && currentVenue.id) {
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
      } else {
        // Ensure required fields are provided
        if (!currentVenue.name || !currentVenue.location) {
          alert("Venue name and location are required");
          return;
        }
        
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
            is_active: currentVenue.is_active,
            latitude: currentVenue.latitude,
            longitude: currentVenue.longitude
          });
        if (error) throw error;
      }
      closeModal();
      setLoading(true);
      const { data: venuesData } = await supabase.from('venues').select('*').order('name');
      setVenues(venuesData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error saving venue:', error);
    }
  };

  const deleteVenue = async (venue: Venue) => {
    if (!window.confirm('Delete this venue?')) return;
    try {
      const { error } = await supabase.from('venues').delete().eq('id', venue.id);
      if (error) throw error;
      setVenues(venues.filter(v => v.id !== venue.id));
    } catch (error) {
      // handle error
    }
  };

  const toggleVenueStatus = async (venue: Venue) => {
    try {
      const { error } = await supabase
        .from('venues')
        .update({ is_active: !venue.is_active })
        .eq('id', venue.id);
      if (error) throw error;
      setVenues(venues.map(v => v.id === venue.id ? { ...v, is_active: !v.is_active } : v));
    } catch (error) {
      // handle error
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div></div>;
  }

  return (
    <div className="p-2 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-white">Venues</h2>
        <button onClick={() => openModal()} className="p-2 rounded bg-indigo-600 text-white flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
      </div>
      <div className="flex flex-col gap-2">
        {venues.map(venue => (
          <div key={venue.id} className="flex items-center bg-navy-800 rounded-lg shadow px-2 py-2 gap-2">
            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-navy-900 flex items-center justify-center">
              {venue.image_url ? (
                <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              )}
            </div>
            <div className="flex-1 min-w-0 ml-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">{venue.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${venue.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{venue.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center text-xs text-gray-300 mt-0.5">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="truncate">{venue.location}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 ml-2">
              <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-indigo-300" title="Edit" onClick={() => openModal(venue)}><Edit className="w-4 h-4" /></button>
              <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-green-300" title="Toggle Active" onClick={() => toggleVenueStatus(venue)}>{venue.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}</button>
              <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-red-300" title="Delete" onClick={() => deleteVenue(venue)}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Venue' : 'Add New Venue'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
                  <input type="text" name="name" value={currentVenue.name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input type="text" name="location" value={currentVenue.location || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={currentVenue.description || ''} onChange={handleChange} className="w-full p-2 border rounded-md" rows={2} />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input type="number" name="capacity" value={currentVenue.capacity === null ? '' : currentVenue.capacity} onChange={handleChange} className="w-full p-2 border rounded-md" min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="tel" name="contact_number" value={currentVenue.contact_number || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
                    <input type="text" name="opening_hours" value={currentVenue.opening_hours || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input type="number" step="any" name="latitude" value={currentVenue.latitude === null ? '' : currentVenue.latitude} onChange={handleChange} placeholder="e.g., 40.7128" className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input type="number" step="any" name="longitude" value={currentVenue.longitude === null ? '' : currentVenue.longitude} onChange={handleChange} placeholder="e.g., -74.0060" className="w-full p-2 border rounded-md" />
                  </div>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="is_active" id="is_active" checked={currentVenue.is_active || false} onChange={handleChange} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">Active</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">{isEditing ? 'Update Venue' : 'Create Venue'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueManagement_Mobile;
