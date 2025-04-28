
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface SportManagementProps {
  userRole: string | null;
}

interface Sport {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

const SportManagement: React.FC<SportManagementProps> = ({ userRole }) => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSport, setCurrentSport] = useState<Partial<Sport>>({
    name: '',
    description: '',
    icon: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name, description, icon, is_active, created_at')
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
    
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentSport({ ...currentSport, [name]: checkbox.checked });
    } else {
      setCurrentSport({ ...currentSport, [name]: value });
    }
  };

  const openModal = (sport?: Sport) => {
    if (sport) {
      setCurrentSport(sport);
      setIsEditing(true);
    } else {
      setCurrentSport({
        name: '',
        description: '',
        icon: '',
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
        description: 'Please provide a name for the sport.',
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
            icon: currentSport.icon,
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
            icon: currentSport.icon,
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

  const deleteSport = async (sport: Sport) => {
    if (!confirm(`Are you sure you want to delete ${sport.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sports')
        .delete()
        .eq('id', sport.id);
        
      if (error) throw error;
      
      toast({
        title: 'Sport deleted',
        description: `${sport.name} has been deleted.`
      });
      
      fetchSports();
    } catch (error) {
      console.error('Error deleting sport:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sport. It may be in use by courts or bookings.',
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
          className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
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
            Add Your First Sport
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Name</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Description</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Status</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sports.map(sport => (
                <tr key={sport.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{sport.name}</td>
                  <td className="py-3 px-4">{sport.description || 'No description'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sport.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sport.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(sport)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => toggleSportStatus(sport)}
                      className={sport.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      title={sport.is_active ? "Deactivate" : "Activate"}
                    >
                      {sport.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button
                      onClick={() => deleteSport(sport)}
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
                    value={currentSport.name || ''}
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
                    className="w-full p-2 border rounded-md h-24"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (CSS class or URL)
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={currentSport.icon || ''}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="fa-basketball-ball or image URL"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={currentSport.is_active || false}
                    onChange={handleChange}
                    className="h-4 w-4 text-sport-green focus:ring-sport-green border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
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
