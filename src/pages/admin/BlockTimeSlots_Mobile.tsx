import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SlotBlockingTab from '@/components/admin/SlotBlockingTab';

const BlockTimeSlots_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<{ venue_id: string }[]>([]);

  useEffect(() => {
    const fetchAdminVenues = async () => {
      if (userRole === 'admin') {
        const { data, error } = await supabase.rpc('get_admin_venues');
        if (!error) setAdminVenues(data || []);
      } else if (userRole === 'super_admin') {
        setAdminVenues([]); // super_admin can see all venues
      }
    };
    fetchAdminVenues();
  }, [userRole]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Block Time Slots</h2>
      <SlotBlockingTab userRole={userRole} adminVenues={adminVenues} />
    </div>
  );
};

export default BlockTimeSlots_Mobile; 