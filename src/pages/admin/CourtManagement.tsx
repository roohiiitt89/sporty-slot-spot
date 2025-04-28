
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface CourtManagementProps {
  userRole: string | null;
}

interface Venue {
  id: string;
  name: string;
}

interface Sport {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  venue_id: string;
  sport_id: string;
  hourly_rate: number;
  is_active: boolean;
  venue_name?: string;
  sport_name?: string;
}

const CourtManagement: React.FC<CourtManagementProps> = ({ userRole }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourt, setCurrentCourt] = useState<Partial<Court>>({
    name: '',
    venue_id: '',
    sport_id: '',
    hourly_rate: 25,
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchVenues();
    fetchSports();
    fetchCourts();
  }, []);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive',
      });
    }
  };

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sports',
        variant: 'destructive',
      });
    }
  };

  const fetchCourts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courts')
        .select(`
          id, 
          name, 
          venue_id, 
          sport_id, 
          hourly_rate, 
          is_active,
          venues:venue_id (name),
          sports:sport_id (name)
        `)
        .order('name');
      
      if (error) throw error;
      
      const formattedCourts = data?.map(court => ({
        ...court,
        venue_name: court.venues?.name,
        sport_name: court.sports?.name
      })) || [];
      
      setCourts(formattedCourts);
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentCourt({ ...currentCourt, [name]: checkbox.checked });
      return;
    }
    
    if (name === 'hourly_rate') {
      setCurrentCourt({ ...currentCourt, [name]: parseFloat(value) || 0 });
      return;
    }
    
    setCurrentCourt({ ...currentCourt, [name]: value });
  };

  const openModal = (court?: Court) => {
    if (court) {
      setCurrentCourt(court);
      setIsEditing(true);
    } else {
      setCurrentCourt({
        name: '',
        venue_id: venues.length > 0 ? venues[0].id : '',
        sport_id: sports.length > 0 ? sports[0].id : '',
        hourly_rate: 25,
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
    
    if (!currentCourt.name || !currentCourt.venue_id || !currentCourt.sport_id) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (isEditing && currentCourt.id) {
        // Update existing court
        const { error } = await supabase
          .from('courts')
          .update({
            name: currentCourt.name,
            venue_id: currentCourt.venue_id,
            sport_id: currentCourt.sport_id,
            hourly_rate: currentCourt.hourly_rate,
            is_active: currentCourt.is_active
          })
          .eq('id', currentCourt.id);
          
        if (error) throw error;
        
        toast({
          title: 'Court updated',
          description: `${currentCourt.name} has been updated successfully.`
        });
      } else {
        // Create new court
        const { error } = await supabase
          .from('courts')
          .insert({
            name: currentCourt.name,
            venue_id: currentCourt.venue_id,
            sport_id: currentCourt.sport_id,
            hourly_rate: currentCourt.hourly_rate || 25,
            is_active: currentCourt.is_active
          });
          
        if (error) throw error;
        
        toast({
          title: 'Court created',
          description: `${currentCourt.name} has been created successfully.`
        });
      }
      
      closeModal();
      fetchCourts();
    } catch (error) {
      console.error('Error saving court:', error);
      toast({
        title: 'Error',
        description: 'Failed to save court',
        variant: 'destructive',
      });
    }
  };

  const toggleCourtStatus = async (court: Court) => {
    try {
      const { error } = await supabase
        .from('courts')
        .update({ is_active: !court.is_active })
        .eq('id', court.id);
        
      if (error) throw error;
      
      toast({
        title: court.is_active ? 'Court deactivated' : 'Court activated',
        description: `${court.name} has been ${court.is_active ? 'deactivated' : 'activated'}.`
      });
      
      fetchCourts();
    } catch (error) {
      console.error('Error toggling court status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update court status',
        variant: 'destructive',
      });
    }
  };

  const deleteCourt = async (court: Court) => {
    if (!confirm(`Are you sure you want to delete ${court.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('courts')
        .delete()
        .eq('id', court.id);
        
      if (error) throw error;
      
      toast({
        title: 'Court deleted',
        description: `${court.name} has been deleted.`
      });
      
      fetchCourts();
    } catch (error) {
      console.error('Error deleting court:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete court. It may have existing bookings.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Court Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Court
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : courts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No courts found</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
          >
            Add Your First Court
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Court Name</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Venue</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Sport</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Rate/Hour</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courts.map(court => (
                <tr key={court.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{court.name}</td>
                  <td className="py-3 px-4">{court.venue_name}</td>
                  <td className="py-3 px-4">{court.sport_name}</td>
                  <td className="py-3 px-4">${court.hourly_rate.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      court.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {court.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(court)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => toggleCourtStatus(court)}
                      className={court.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      title={court.is_active ? "Deactivate" : "Activate"}
                    >
                      {court.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button
                      onClick={() => deleteCourt(court)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Court Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Court' : 'Add New Court'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentCourt.name || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue *
                  </label>
                  <select
                    name="venue_id"
                    value={currentCourt.venue_id || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a venue</option>
                    {venues.map(venue => (
                      <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport *
                  </label>
                  <select
                    name="sport_id"
                    value={currentCourt.sport_id || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select a sport</option>
                    {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>{sport.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($) *
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={currentCourt.hourly_rate || ''}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={currentCourt.is_active || false}
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
                  {isEditing ? 'Update Court' : 'Create Court'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtManagement;
