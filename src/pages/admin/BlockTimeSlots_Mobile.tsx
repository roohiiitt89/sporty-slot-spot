
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SlotBlockingTab from '@/components/admin/SlotBlockingTab';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BlockTimeSlots_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<{ venue_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminVenues = async () => {
      try {
        setLoading(true);
        if (userRole === 'admin') {
          const { data, error } = await supabase.rpc('get_admin_venues');
          if (!error) setAdminVenues(data || []);
        } else if (userRole === 'super_admin') {
          setAdminVenues([]); // super_admin can see all venues
        }
      } catch (error) {
        console.error('Error fetching admin venues:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminVenues();
  }, [userRole]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-800 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-black/90 to-navy-900/90 backdrop-blur-md shadow-md">
        <div className="flex items-center px-4 py-4">
          <button 
            onClick={() => navigate('/admin/mobile-home')}
            className="mr-3 p-1.5 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-white">Block Time Slots</h1>
        </div>
      </header>
      
      <div className="p-4 max-w-md mx-auto">
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          <SlotBlockingTab userRole={userRole} adminVenues={adminVenues} />
        </div>
      </div>
    </div>
  );
};

export default BlockTimeSlots_Mobile;
