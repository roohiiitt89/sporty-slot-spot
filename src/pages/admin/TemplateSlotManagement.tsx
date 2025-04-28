
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TemplateSlotManagementProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

const TemplateSlotManagement: React.FC<TemplateSlotManagementProps> = ({ userRole, adminVenues }) => {
  const [loading, setLoading] = useState(true);
  const [templateSlots, setTemplateSlots] = useState<any[]>([]);
  
  useEffect(() => {
    // Fetch template slots based on user role and admin venues
    const fetchTemplateSlots = async () => {
      try {
        console.log('Fetching template slots for role:', userRole);
        console.log('Admin venues:', adminVenues);
        
        let query = supabase.from('template_slots').select(`
          id,
          day_of_week,
          start_time,
          end_time,
          price,
          is_available,
          court:courts (
            id,
            name,
            venue:venues (
              id,
              name
            ),
            sport:sports (
              name
            )
          )
        `);

        // If admin (not super_admin), filter by admin venues
        if (userRole === 'admin' && adminVenues.length > 0) {
          const venueIds = adminVenues.map(v => v.venue_id);
          console.log('Filtering by venue IDs:', venueIds);
          
          const { data: courtIds, error: courtError } = await supabase
            .from('courts')
            .select('id')
            .in('venue_id', venueIds);
            
          if (courtError) {
            console.error('Error fetching court IDs:', courtError);
            throw courtError;
          }
          
          if (courtIds && courtIds.length > 0) {
            const courtIdArray = courtIds.map(c => c.id);
            console.log('Found court IDs:', courtIdArray);
            query = query.in('court_id', courtIdArray);
          } else {
            console.log('No courts found for venues');
            setTemplateSlots([]);
            setLoading(false);
            return;
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Template slots data:', data);
        setTemplateSlots(data || []);
      } catch (error) {
        console.error('Error fetching template slots:', error);
        toast({
          title: 'Error',
          description: 'Failed to load template slots',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateSlots();
  }, [userRole, adminVenues]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Template Slot Management</h2>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : templateSlots.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No template slots found</p>
          <p className="text-sm text-gray-500 mt-2">Create template slots to set default available times for courts.</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Template slot management will be implemented here.</p>
          <p className="text-sm text-gray-500 mt-2">You can create and manage default time slots for courts.</p>
        </div>
      )}
    </div>
  );
};

export default TemplateSlotManagement;
