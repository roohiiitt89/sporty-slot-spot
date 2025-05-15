
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Clock, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import AvailabilityWidget from './AvailabilityWidget';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Venue {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  venue_id: string;
}

const HomepageAvailabilityWidget: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [today] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('venues')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
          .limit(10);

        if (error) throw error;
        
        setVenues(data || []);
        // Auto-select first venue if available
        if (data && data.length > 0) {
          setSelectedVenueId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast({
          title: 'Error',
          description: 'Failed to load venues',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // When venue is selected, fetch its courts
  useEffect(() => {
    if (!selectedVenueId) return;
    
    const fetchCourts = async () => {
      try {
        const { data, error } = await supabase
          .from('courts')
          .select('id, name, venue_id')
          .eq('venue_id', selectedVenueId)
          .eq('is_active', true)
          .order('name');
          
        if (error) throw error;
        
        // Now the data properly includes venue_id to match the Court interface
        setCourts(data || []);
        // Auto-select first court if available
        if (data && data.length > 0) {
          setSelectedCourtId(data[0].id);
        } else {
          setSelectedCourtId('');
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load courts for this venue',
          variant: 'destructive',
        });
      }
    };
    
    fetchCourts();
  }, [selectedVenueId]);

  const handleVenueChange = (venueId: string) => {
    setSelectedVenueId(venueId);
    setSelectedCourtId(''); // Reset court selection
    setIsExpanded(false); // Collapse availability view when changing venue
  };

  const handleCourtChange = (courtId: string) => {
    setSelectedCourtId(courtId);
    setIsExpanded(false); // Collapse availability view when changing court
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="w-full bg-navy/50 border-indigo/20 backdrop-blur-sm text-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center text-white">
          <Calendar className="mr-2 h-5 w-5 text-indigo-light" />
          Check Available Courts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-indigo" />
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-4 mb-4`}>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Select Venue</label>
                <Select value={selectedVenueId} onValueChange={handleVenueChange}>
                  <SelectTrigger className="bg-navy-dark border-indigo/30 text-white">
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-dark border-indigo/30 text-white">
                    {venues.map(venue => (
                      <SelectItem key={venue.id} value={venue.id} className="hover:bg-indigo/20">
                        {venue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Select Court</label>
                <Select value={selectedCourtId} onValueChange={handleCourtChange} disabled={courts.length === 0}>
                  <SelectTrigger className="bg-navy-dark border-indigo/30 text-white">
                    <SelectValue placeholder={courts.length === 0 ? "No courts available" : "Select a court"} />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-dark border-indigo/30 text-white">
                    {courts.map(court => (
                      <SelectItem key={court.id} value={court.id} className="hover:bg-indigo/20">
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedCourtId && (
              <div className="mt-4">
                <Button 
                  onClick={toggleExpanded} 
                  variant="outline" 
                  className="w-full border-indigo-light text-indigo-light hover:bg-indigo/20 mb-4 flex justify-between items-center"
                >
                  <span>{isExpanded ? 'Hide Availability' : 'View Availability'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
                
                {isExpanded && (
                  <div className="animate-fade-in">
                    <AvailabilityWidget courtId={selectedCourtId} date={today} />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HomepageAvailabilityWidget;
