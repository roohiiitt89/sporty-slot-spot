import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Sport {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

const SportManagement_Mobile: React.FC = () => {
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
    } finally {
      setLoading(false);
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

  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentSport({ ...currentSport, [name]: checkbox.checked });
    } else {
      setCurrentSport({ ...currentSport, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSport.name) return;
    
    try {
      if (isEditing && currentSport.id) {
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
      } else {
        // Ensure name is provided as it's required by the database
        if (!currentSport.name) {
          alert("Sport name is required");
          return;
        }
        
        const { error } = await supabase
          .from('sports')
          .insert({
            name: currentSport.name,
            description: currentSport.description || null,
            icon: currentSport.icon || null,
            is_active: currentSport.is_active
          });
        if (error) throw error;
      }
      closeModal();
      fetchSports();
    } catch (error) {
      console.error('Error saving sport:', error);
    }
  };

  const deleteSport = async (sport: Sport) => {
    if (!window.confirm('Delete this sport?')) return;
    try {
      const { error } = await supabase.from('sports').delete().eq('id', sport.id);
      if (error) throw error;
      setSports(sports.filter(s => s.id !== sport.id));
    } catch (error) {
      // handle error
    }
  };

  const toggleSportStatus = async (sport: Sport) => {
    try {
      const { error } = await supabase
        .from('sports')
        .update({ is_active: !sport.is_active })
        .eq('id', sport.id);
      if (error) throw error;
      setSports(sports.map(s => s.id === sport.id ? { ...s, is_active: !s.is_active } : s));
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
        <h2 className="text-lg font-bold text-white">Sports</h2>
        <button onClick={() => openModal()} className="p-2 rounded bg-sport-green text-white flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
      </div>
      <div className="flex flex-col gap-2">
        {sports.map(sport => (
          <div key={sport.id} className="flex items-center bg-navy-800 rounded-lg shadow px-2 py-2 gap-2">
            <div className="flex-1 min-w-0 ml-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">{sport.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sport.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{sport.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="text-xs text-gray-300 mt-0.5 truncate">{sport.description || 'No description'}</div>
            </div>
            <div className="flex flex-col gap-1 ml-2">
              <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-indigo-300" title="Edit" onClick={() => openModal(sport)}><Edit className="w-4 h-4" /></button>
              <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-green-300" title="Toggle Active" onClick={() => toggleSportStatus(sport)}>{sport.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}</button>
              <button className="p-1 rounded bg-navy-900 hover:bg-navy-700 text-red-300" title="Delete" onClick={() => deleteSport(sport)}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Sport' : 'Add New Sport'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sport Name *</label>
                  <input type="text" name="name" value={currentSport.name || ''} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" value={currentSport.description || ''} onChange={handleChange} className="w-full p-2 border rounded-md" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (CSS class or URL)</label>
                  <input type="text" name="icon" value={currentSport.icon || ''} onChange={handleChange} className="w-full p-2 border rounded-md" placeholder="fa-basketball-ball or image URL" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" name="is_active" id="is_active" checked={currentSport.is_active || false} onChange={handleChange} className="h-4 w-4 text-sport-green focus:ring-sport-green border-gray-300 rounded" />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">Active</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors">{isEditing ? 'Update Sport' : 'Create Sport'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportManagement_Mobile;
