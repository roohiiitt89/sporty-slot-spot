
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle, LayoutGrid } from 'lucide-react';

interface CourtManagementProps {
  userRole: string | null;
  adminVenues?: Array<{ venue_id: string }>;
}

interface Venue {
  id: string;
  name: string;
}

interface Sport {
  id: string;
  name: string;
}

interface CourtGroup {
  id: string;
  name: string;
  venue_id: string;
  description: string | null;
  is_active: boolean;
}

interface Court {
  id: string;
  name: string;
  venue_id: string;
  sport_id: string;
  court_group_id: string | null;
  hourly_rate: number;
  is_active: boolean;
  venue_name?: string;
  sport_name?: string;
  court_group_name?: string;
}

const CourtManagement: React.FC<CourtManagementProps> = ({ userRole, adminVenues = [] }) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courtGroups, setCourtGroups] = useState<CourtGroup[]>([]);
  const [filteredCourtGroups, setFilteredCourtGroups] = useState<CourtGroup[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourtGroupModalOpen, setIsCourtGroupModalOpen] = useState(false);
  const [currentCourt, setCurrentCourt] = useState<Partial<Court>>({
    name: '',
    venue_id: '',
    sport_id: '',
    court_group_id: null,
    hourly_rate: 25,
    is_active: true
  });
  const [currentCourtGroup, setCurrentCourtGroup] = useState<Partial<CourtGroup>>({
    name: '',
    venue_id: '',
    description: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const isSuperAdmin = userRole === 'super_admin';
  const [view, setView] = useState<'courts' | 'groups'>('courts');

  useEffect(() => {
    fetchVenues();
    fetchSports();
    fetchCourtGroups();
    fetchCourts();
  }, [userRole, adminVenues]);

  useEffect(() => {
    if (selectedVenue) {
      const filtered = courtGroups.filter(group => group.venue_id === selectedVenue);
      setFilteredCourtGroups(filtered);
    } else {
      setFilteredCourtGroups(courtGroups);
    }
  }, [selectedVenue, courtGroups]);

  const fetchVenues = async () => {
    try {
      let query = supabase.from('venues').select('id, name');
      
      // For regular admins, only fetch their assigned venues
      if (userRole === 'admin' && adminVenues && adminVenues.length > 0) {
        const venueIds = adminVenues.map(venue => venue.venue_id);
        query = query.in('id', venueIds);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      setVenues(data || []);
      if (data && data.length > 0) {
        setSelectedVenue(data[0].id);
      }
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

  const fetchCourtGroups = async () => {
    try {
      let query = supabase
        .from('court_groups')
        .select(`
          id, 
          name, 
          venue_id, 
          description,
          is_active,
          venues:venue_id (name)
        `);
      
      // For regular admins, only fetch court groups for their assigned venues
      if (userRole === 'admin' && adminVenues && adminVenues.length > 0) {
        const venueIds = adminVenues.map(venue => venue.venue_id);
        query = query.in('venue_id', venueIds);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      setCourtGroups(data || []);
    } catch (error) {
      console.error('Error fetching court groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load court groups',
        variant: 'destructive',
      });
    }
  };

  const fetchCourts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('courts')
        .select(`
          id, 
          name, 
          venue_id, 
          sport_id, 
          court_group_id,
          hourly_rate, 
          is_active,
          venues:venue_id (name),
          sports:sport_id (name),
          court_groups:court_group_id (name)
        `);
      
      // For regular admins, only fetch courts for their assigned venues
      if (userRole === 'admin' && adminVenues && adminVenues.length > 0) {
        const venueIds = adminVenues.map(venue => venue.venue_id);
        query = query.in('venue_id', venueIds);
      }
      
      if (selectedVenue) {
        query = query.eq('venue_id', selectedVenue);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      const formattedCourts = data?.map(court => ({
        ...court,
        venue_name: court.venues?.name,
        sport_name: court.sports?.name,
        court_group_name: court.court_groups?.name
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

  const handleCourtChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleCourtGroupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'is_active' && type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setCurrentCourtGroup({ ...currentCourtGroup, [name]: checkbox.checked });
      return;
    }
    
    setCurrentCourtGroup({ ...currentCourtGroup, [name]: value });
  };

  const openCourtModal = (court?: Court) => {
    if (court) {
      setCurrentCourt(court);
      setIsEditing(true);
    } else {
      setCurrentCourt({
        name: '',
        venue_id: selectedVenue || (venues.length > 0 ? venues[0].id : ''),
        sport_id: sports.length > 0 ? sports[0].id : '',
        court_group_id: null,
        hourly_rate: 25,
        is_active: true
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const openCourtGroupModal = (courtGroup?: CourtGroup) => {
    if (courtGroup) {
      setCurrentCourtGroup(courtGroup);
      setIsEditing(true);
    } else {
      setCurrentCourtGroup({
        name: '',
        venue_id: selectedVenue || (venues.length > 0 ? venues[0].id : ''),
        description: '',
        is_active: true
      });
      setIsEditing(false);
    }
    setIsCourtGroupModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCourtGroupModalOpen(false);
  };

  const handleCourtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCourt.name || !currentCourt.venue_id || !currentCourt.sport_id) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // For normal admins, verify they have permission to add/edit courts for this venue
    if (userRole === 'admin' && adminVenues) {
      const hasPermission = adminVenues.some(v => v.venue_id === currentCourt.venue_id);
      if (!hasPermission) {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to manage courts for this venue.',
          variant: 'destructive',
        });
        return;
      }
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
            court_group_id: currentCourt.court_group_id,
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
            court_group_id: currentCourt.court_group_id,
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

  const handleCourtGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCourtGroup.name || !currentCourtGroup.venue_id) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // For normal admins, verify they have permission to add/edit court groups for this venue
    if (userRole === 'admin' && adminVenues) {
      const hasPermission = adminVenues.some(v => v.venue_id === currentCourtGroup.venue_id);
      if (!hasPermission) {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to manage court groups for this venue.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      if (isEditing && currentCourtGroup.id) {
        // Update existing court group
        const { error } = await supabase
          .from('court_groups')
          .update({
            name: currentCourtGroup.name,
            venue_id: currentCourtGroup.venue_id,
            description: currentCourtGroup.description,
            is_active: currentCourtGroup.is_active
          })
          .eq('id', currentCourtGroup.id);
          
        if (error) throw error;
        
        toast({
          title: 'Court group updated',
          description: `${currentCourtGroup.name} has been updated successfully.`
        });
      } else {
        // Create new court group
        const { error } = await supabase
          .from('court_groups')
          .insert({
            name: currentCourtGroup.name,
            venue_id: currentCourtGroup.venue_id,
            description: currentCourtGroup.description,
            is_active: currentCourtGroup.is_active
          });
          
        if (error) throw error;
        
        toast({
          title: 'Court group created',
          description: `${currentCourtGroup.name} has been created successfully.`
        });
      }
      
      closeModal();
      fetchCourtGroups();
    } catch (error) {
      console.error('Error saving court group:', error);
      toast({
        title: 'Error',
        description: 'Failed to save court group',
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

  const toggleCourtGroupStatus = async (courtGroup: CourtGroup) => {
    try {
      const { error } = await supabase
        .from('court_groups')
        .update({ is_active: !courtGroup.is_active })
        .eq('id', courtGroup.id);
        
      if (error) throw error;
      
      toast({
        title: courtGroup.is_active ? 'Court group deactivated' : 'Court group activated',
        description: `${courtGroup.name} has been ${courtGroup.is_active ? 'deactivated' : 'activated'}.`
      });
      
      fetchCourtGroups();
    } catch (error) {
      console.error('Error toggling court group status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update court group status',
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

  const deleteCourtGroup = async (courtGroup: CourtGroup) => {
    if (!confirm(`Are you sure you want to delete ${courtGroup.name}? Any courts linked to this group will be unlinked.`)) {
      return;
    }
    
    try {
      // First update any courts that are using this group to set court_group_id to null
      const { error: updateError } = await supabase
        .from('courts')
        .update({ court_group_id: null })
        .eq('court_group_id', courtGroup.id);
        
      if (updateError) throw updateError;
      
      // Then delete the court group
      const { error } = await supabase
        .from('court_groups')
        .delete()
        .eq('id', courtGroup.id);
        
      if (error) throw error;
      
      toast({
        title: 'Court group deleted',
        description: `${courtGroup.name} has been deleted.`
      });
      
      fetchCourtGroups();
      fetchCourts(); // Refresh courts as well since their court_group_id might have changed
    } catch (error) {
      console.error('Error deleting court group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete court group.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Court Management</h2>
        <div className="flex space-x-4">
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setView('courts')}
              className={`px-4 py-2 ${
                view === 'courts' ? 'bg-sport-green text-white' : 'bg-white'
              }`}
            >
              Courts
            </button>
            <button
              onClick={() => setView('groups')}
              className={`px-4 py-2 ${
                view === 'groups' ? 'bg-sport-green text-white' : 'bg-white'
              }`}
            >
              Court Groups
            </button>
          </div>
          {view === 'courts' ? (
            <button
              onClick={() => openCourtModal()}
              className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add New Court
            </button>
          ) : (
            <button
              onClick={() => openCourtGroupModal()}
              className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add New Court Group
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Venue
        </label>
        <select
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
          className="w-full md:w-1/3 p-2 border rounded-md"
        >
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : view === 'courts' ? (
        // Courts View
        courts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No courts found</p>
            <button
              onClick={() => openCourtModal()}
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
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Court Group</th>
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
                    <td className="py-3 px-4">{court.court_group_name || 'None'}</td>
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
                        onClick={() => openCourtModal(court)}
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
        )
      ) : (
        // Court Groups View
        filteredCourtGroups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No court groups found</p>
            <button
              onClick={() => openCourtGroupModal()}
              className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Add Your First Court Group
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Group Name</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Venue</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Description</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-600">Status</th>
                  <th className="py-3 px-4 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourtGroups.map(group => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{group.name}</td>
                    <td className="py-3 px-4">{group.venues?.name}</td>
                    <td className="py-3 px-4">{group.description || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        group.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {group.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openCourtGroupModal(group)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => toggleCourtGroupStatus(group)}
                        className={group.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={group.is_active ? "Deactivate" : "Activate"}
                      >
                        {group.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        onClick={() => deleteCourtGroup(group)}
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
        )
      )}
      
      {/* Court Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Court' : 'Add New Court'}</h3>
            </div>
            <form onSubmit={handleCourtSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentCourt.name || ''}
                    onChange={handleCourtChange}
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
                    onChange={handleCourtChange}
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
                    onChange={handleCourtChange}
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
                    Court Group
                  </label>
                  <select
                    name="court_group_id"
                    value={currentCourt.court_group_id || ''}
                    onChange={handleCourtChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">None (Individual Court)</option>
                    {courtGroups
                      .filter(group => group.venue_id === currentCourt.venue_id)
                      .map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Placing courts in a group will block booking slots across all courts in that group when any court is booked.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($) *
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={currentCourt.hourly_rate || ''}
                    onChange={handleCourtChange}
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
                    onChange={handleCourtChange}
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

      {/* Court Group Form Modal */}
      {isCourtGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-semibold">{isEditing ? 'Edit Court Group' : 'Add New Court Group'}</h3>
            </div>
            <form onSubmit={handleCourtGroupSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentCourtGroup.name || ''}
                    onChange={handleCourtGroupChange}
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
                    value={currentCourtGroup.venue_id || ''}
                    onChange={handleCourtGroupChange}
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
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={currentCourtGroup.description || ''}
                    onChange={handleCourtGroupChange}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={currentCourtGroup.is_active || false}
                    onChange={handleCourtGroupChange}
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
                  {isEditing ? 'Update Court Group' : 'Create Court Group'}
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
