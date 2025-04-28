import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface TemplateSlotManagementProps {
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
  venue_name?: string;
  sport_name?: string;
}

interface TemplateSlot {
  id: string;
  court_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: string;
}

const TemplateSlotManagement: React.FC<TemplateSlotManagementProps> = ({ userRole }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [templateSlots, setTemplateSlots] = useState<TemplateSlot[]>([]);
  const [loading, setLoading] = useState({
    venues: false,
    sports: false,
    courts: false,
    slots: false,
    savingSlot: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<Partial<TemplateSlot>>({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    is_available: true,
    price: '0.00'
  });
  const [isEditing, setIsEditing] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    fetchVenues();
    fetchSports();
  }, []);

  useEffect(() => {
    if (selectedVenue && selectedSport) {
      fetchCourts();
    } else {
      setCourts([]);
      setSelectedCourt('');
    }
  }, [selectedVenue, selectedSport]);

  useEffect(() => {
    if (selectedCourt) {
      fetchTemplateSlots();
    } else {
      setTemplateSlots([]);
    }
  }, [selectedCourt]);

  const fetchVenues = async () => {
    setLoading(prev => ({ ...prev, venues: true }));
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
    } finally {
      setLoading(prev => ({ ...prev, venues: false }));
    }
  };

  const fetchSports = async () => {
    setLoading(prev => ({ ...prev, sports: true }));
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
    } finally {
      setLoading(prev => ({ ...prev, sports: false }));
    }
  };

  const fetchCourts = async () => {
    setLoading(prev => ({ ...prev, courts: true }));
    try {
      const { data, error } = await supabase
        .from('courts')
        .select(`
          id, 
          name, 
          venue_id, 
          sport_id,
          venues:venue_id (name),
          sports:sport_id (name)
        `)
        .eq('venue_id', selectedVenue)
        .eq('sport_id', selectedSport)
        .order('name');
      
      if (error) throw error;
      
      const formattedCourts = data?.map(court => ({
        ...court,
        venue_name: court.venues?.name,
        sport_name: court.sports?.name
      })) || [];
      
      setCourts(formattedCourts);
      if (formattedCourts.length > 0) {
        setSelectedCourt(formattedCourts[0].id);
      } else {
        setSelectedCourt('');
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courts',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, courts: false }));
    }
  };

  const fetchTemplateSlots = async () => {
    if (!selectedCourt) return;

    setLoading(prev => ({ ...prev, slots: true }));
    try {
      const { data, error } = await supabase
        .from('template_slots')
        .select('id, court_id, day_of_week, start_time, end_time, is_available, price')
        .eq('court_id', selectedCourt)
        .order('day_of_week')
        .order('start_time');
      
      if (error) throw error;
      
      setTemplateSlots(data || []);
    } catch (error) {
      console.error('Error fetching template slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template slots',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, slots: false }));
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const formatDay = (dayNumber: number) => {
    return daysOfWeek.find(day => day.value === dayNumber)?.label || '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'is_available' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentSlot({ ...currentSlot, [name]: checkbox.checked });
      return;
    }
    
    if (name === 'day_of_week') {
      setCurrentSlot({ ...currentSlot, [name]: parseInt(value) });
      return;
    }
    
    setCurrentSlot({ ...currentSlot, [name]: value });
  };

  const openModal = (slot?: TemplateSlot) => {
    if (slot) {
      setCurrentSlot({
        ...slot,
        start_time: formatTime(slot.start_time),
        end_time: formatTime(slot.end_time)
      });
      setIsEditing(true);
    } else {
      setCurrentSlot({
        court_id: selectedCourt,
        day_of_week: 0,
        start_time: '09:00',
        end_time: '10:00',
        is_available: true,
        price: '0.00'
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
    
    if (!currentSlot.court_id || currentSlot.start_time === undefined || currentSlot.end_time === undefined || currentSlot.price === undefined) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, savingSlot: true }));
    
    try {
      if (isEditing && currentSlot.id) {
        // Update existing template slot
        const { error } = await supabase
          .from('template_slots')
          .update({
            day_of_week: currentSlot.day_of_week,
            start_time: currentSlot.start_time,
            end_time: currentSlot.end_time,
            is_available: currentSlot.is_available,
            price: currentSlot.price
          })
          .eq('id', currentSlot.id);
          
        if (error) throw error;
        
        toast({
          title: 'Template slot updated',
          description: `The template slot has been updated successfully.`
        });
      } else {
        // Create new template slot
        const { error } = await supabase
          .from('template_slots')
          .insert({
            court_id: currentSlot.court_id,
            day_of_week: currentSlot.day_of_week,
            start_time: currentSlot.start_time,
            end_time: currentSlot.end_time,
            is_available: currentSlot.is_available,
            price: currentSlot.price
          });
          
        if (error) throw error;
        
        toast({
          title: 'Template slot created',
          description: `The template slot has been created successfully.`
        });
      }
      
      closeModal();
      fetchTemplateSlots();
    } catch (error: any) {
      console.error('Error saving template slot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template slot',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, savingSlot: false }));
    }
  };

  const deleteTemplateSlot = async (slot: TemplateSlot) => {
    if (!confirm(`Are you sure you want to delete this template slot? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('template_slots')
        .delete()
        .eq('id', slot.id);
        
      if (error) throw error;
      
      toast({
        title: 'Template slot deleted',
        description: `The template slot has been deleted.`
      });
      
      fetchTemplateSlots();
    } catch (error: any) {
      console.error('Error deleting template slot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template slot',
        variant: 'destructive',
      });
    }
  };

  const generateDefaultSlots = async () => {
    if (!selectedCourt || !confirm("This will generate default hourly slots from 9AM to 9PM for all days of the week. Continue?")) {
      return;
    }
    
    setLoading(prev => ({ ...prev, slots: true }));
    try {
      const { data: courtData, error: courtError } = await supabase
        .from('courts')
        .select('hourly_rate')
        .eq('id', selectedCourt)
        .single();
        
      if (courtError) throw courtError;
      
      const defaultPrice = courtData?.hourly_rate?.toString() || '0.00';
      
      const slots = [];
      
      for (let day = 0; day < 7; day++) {
        for (let hour = 9; hour < 21; hour++) {
          slots.push({
            court_id: selectedCourt,
            day_of_week: day,
            start_time: `${hour}:00`,
            end_time: `${hour + 1}:00`,
            is_available: true,
            price: defaultPrice
          });
        }
      }
      
      const { error } = await supabase
        .from('template_slots')
        .insert(slots);
        
      if (error) throw error;
      
      toast({
        title: 'Default slots generated',
        description: 'Default template slots have been created.'
      });
      
      fetchTemplateSlots();
    } catch (error: any) {
      console.error('Error generating default slots:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate default slots',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, slots: false }));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Template Slot Management</h2>
        <div className="space-x-2">
          <button
            onClick={() => generateDefaultSlots()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            disabled={!selectedCourt}
          >
            Generate Default Slots
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center gap-2"
            disabled={!selectedCourt}
          >
            <Plus size={18} />
            Add New Slot
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue
            </label>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={loading.venues}
            >
              <option value="">Select a venue</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={loading.sports || !selectedVenue}
            >
              <option value="">Select a sport</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court
            </label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={loading.courts || !selectedVenue || !selectedSport}
            >
              <option value="">Select a court</option>
              {courts.map(court => (
                <option key={court.id} value={court.id}>{court.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading.slots ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : selectedCourt && templateSlots.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No template slots found for this court</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Add Your First Template Slot
            </button>
            <button
              onClick={() => generateDefaultSlots()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Generate Default Slots
            </button>
          </div>
        </div>
      ) : selectedCourt ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Day</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Start Time</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">End Time</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Available</th>
                <th className="py-3 px-4 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templateSlots.map(slot => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{formatDay(slot.day_of_week)}</td>
                  <td className="py-3 px-4">{formatTime(slot.start_time)}</td>
                  <td className="py-3 px-4">{formatTime(slot.end_time)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {slot.is_available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(slot)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteTemplateSlot(slot)}
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
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Select a venue, sport, and court to manage template slots</p>
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Template Slot' : 'Add New Template Slot'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week *
                  </label>
                  <select
                    name="day_of_week"
                    value={currentSlot.day_of_week}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    {daysOfWeek.map(day => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={currentSlot.start_time}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={currentSlot.end_time}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={currentSlot.price || '0.00'}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={currentSlot.is_available}
                    onChange={handleChange}
                    className="h-4 w-4 text-sport-green focus:ring-sport-green border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700">
                    Available
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
                  disabled={loading.savingSlot}
                  className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
                >
                  {loading.savingSlot ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Saving...</span>
                    </div>
                  ) : isEditing ? 'Update Slot' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSlotManagement;
