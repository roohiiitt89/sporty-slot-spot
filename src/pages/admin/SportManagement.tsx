
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Sport {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface SportManagementProps {
  userRole: string | null;
}

const SportManagement: React.FC<SportManagementProps> = ({ userRole }) => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSport, setCurrentSport] = useState<Partial<Sport>>({
    name: '',
    description: '',
    image_url: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sports')
        .select('*')
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
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox for is_active
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentSport({ ...currentSport, [name]: checkbox.checked });
      return;
    }
    
    // Handle other inputs
    setCurrentSport({ ...currentSport, [name]: value });
  };

  const openModal = (sport?: Sport) => {
    if (sport) {
      setCurrentSport(sport);
      setIsEditing(true);
    } else {
      setCurrentSport({
        name: '',
        description: '',
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
    
    if (!currentSport.name) {
      toast({
        title: 'Missing information',
        description: 'Sport name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (isEditing && currentSport.id) {
        // Update existing sport
        const { error } = await supabase
          .from('sports')
          .update({
            name: currentSport.name,
            description: currentSport.description,
            image_url: currentSport.image_url,
            is_active: currentSport.is_active
          })
          .eq('id', currentSport.id);
          
        if (error) throw error;
        
        toast({
          title: 'Sport updated',
          description: `${currentSport.name} has been updated successfully.`
        });
      } else {
        // Create new sport
        const { error } = await supabase
          .from('sports')
          .insert({
            name: currentSport.name,
            description: currentSport.description,
            image_url: currentSport.image_url,
            is_active: currentSport.is_active
          });
          
        if (error) throw error;
        
        toast({
          title: 'Sport created',
          description: `${currentSport.name} has been created successfully.`
        });
      }
      
      closeModal();
      fetchSports();
    } catch (error) {
      console.error('Error saving sport:', error);
      toast({
        title: 'Error',
        description: 'Failed to save sport',
        variant: 'destructive',
      });
    }
  };

  const toggleSportStatus = async (sport: Sport) => {
    try {
      const { error } = await supabase
        .from('sports')
        .update({ is_active: !sport.is_active })
        .eq('id', sport.id);
        
      if (error) throw error;
      
      toast({
        title: sport.is_active ? 'Sport deactivated' : 'Sport activated',
        description: `${sport.name} has been ${sport.is_active ? 'deactivated' : 'activated'}.`
      });
      
      fetchSports();
    } catch (error) {
      console.error('Error toggling sport status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sport status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Sport Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
        >
          Add New Sport
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : sports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No sports found</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
          >
            Create Your First Sport
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map(sport => (
            <div key={sport.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
              {sport.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={sport.image_url} 
                    alt={sport.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">{sport.name}</span>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{sport.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[40px]">
                      {sport.description || 'No description provided'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sport.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sport.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => openModal(sport)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleSportStatus(sport)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      sport.is_active 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {sport.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Sport Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Sport' : 'Add New Sport'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sport Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentSport.name}
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
                    value={currentSport.description || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="image_url"
                    value={currentSport.image_url || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={currentSport.is_active || false}
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
                  {isEditing ? 'Update Sport' : 'Create Sport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportManagement;
