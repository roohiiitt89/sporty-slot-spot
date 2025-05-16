
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface SlotBlockingFormProps {
  courtId: string;
  courtName: string;
  date: string;
  selectedSlot: {
    start_time: string;
    end_time: string;
    is_available: boolean;
  } | null;
  onBlockComplete: () => void;
}

const SlotBlockingForm: React.FC<SlotBlockingFormProps> = ({
  courtId,
  courtName,
  date,
  selectedSlot,
  onBlockComplete
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Add padTime helper
  const padTime = (t: string) => t.length === 5 ? t + ':00' : t;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedSlot) {
      toast({
        title: 'Error',
        description: 'Missing required information',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Fetch court details to check for court_group_id
      const { data: courtDetails, error: courtDetailsError } = await supabase
        .from('courts')
        .select('court_group_id')
        .eq('id', courtId)
        .single();
        
      if (courtDetailsError) throw courtDetailsError;
      
      let courtIdsToBlock = [courtId];
      
      if (courtDetails && courtDetails.court_group_id) {
        // If court is part of a group, get all courts in that group
        const { data: groupCourts, error: groupCourtsError } = await supabase
          .from('courts')
          .select('id')
          .eq('court_group_id', courtDetails.court_group_id)
          .eq('is_active', true);
          
        if (groupCourtsError) throw groupCourtsError;
        
        courtIdsToBlock = groupCourts.map((c: { id: string }) => c.id);
      }
      
      // Create blocked slot for each court in the group
      const inserts = courtIdsToBlock.map(cid => ({
        court_id: cid,
        date,
        start_time: padTime(selectedSlot.start_time),
        end_time: padTime(selectedSlot.end_time),
        reason: reason.trim() || 'Blocked by admin',
        created_by: user.id
      }));
      
      const { error } = await supabase.from('blocked_slots').insert(inserts);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Slot blocked successfully for all shared courts`,
        variant: 'default'
      });
      
      // Reset form and notify parent
      setReason('');
      onBlockComplete();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to block slot',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedSlot) {
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        <p className="text-center text-gray-600">Please select a time slot to block</p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-800 rounded-md shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Block Time Slot</h3>
      
      <div className="mb-4 p-3 bg-black rounded-md">
        <p className="font-medium">Slot Details:</p>
        <p>Court: {courtName}</p>
        <p>Date: {format(new Date(date), 'EEEE, MMMM d, yyyy')}</p>
        <p>Time: {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
        <p className="text-sm text-red-600 mt-2">
          <Ban className="inline h-4 w-4 mr-1" />
          This slot will become unavailable for booking
        </p>
        <p className="text-xs text-yellow-400 mt-1">
          If this court is part of a shared group, this slot will be blocked for <b>all shared courts</b>.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for Blocking (Optional)</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Enter reason for blocking this slot" 
              rows={3} 
            />
          </div>
          
          <Button 
            type="submit" 
            variant="destructive" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                Blocking...
              </span>
            ) : (
              <>Block Slot</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SlotBlockingForm;
