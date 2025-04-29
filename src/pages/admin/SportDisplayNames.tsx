
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SportDisplayNameProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

interface Venue {
  id: string;
  name: string;
}

interface Sport {
  id: string;
  name: string;
}

interface DisplayName {
  id: string;
  venue_id: string;
  sport_id: string;
  display_name: string;
  venue: {
    name: string;
  };
  sport: {
    name: string;
  };
}

const SportDisplayNames: React.FC<SportDisplayNameProps> = ({ userRole, adminVenues }) => {
  const [displayNames, setDisplayNames] = useState<DisplayName[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [displayNameValue, setDisplayNameValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  useEffect(() => {
    fetchDisplayNames();
    fetchVenues();
    fetchSports();
  }, [adminVenues]);

  const fetchDisplayNames = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('venue_sport_display_names')
        .select(`
          id,
          venue_id,
          sport_id,
          display_name,
          venue:venues (name),
          sport:sports (name)
        `);
      
      // Filter by admin venues if not super admin
      if (userRole === 'admin' && adminVenues?.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        query = query.in('venue_id', venueIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setDisplayNames(data || []);
    } catch (error) {
      console.error('Error fetching custom display names:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom sport display names',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      let query = supabase
        .from('venues')
        .select('id, name')
        .eq('is_active', true);
      
      // Filter by admin venues if not super admin
      if (userRole === 'admin' && adminVenues?.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        query = query.in('id', venueIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedVenue || !selectedSport || !displayNameValue.trim()) {
        toast({
          title: 'Missing fields',
          description: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }

      if (isEditing && currentEditId) {
        // Update existing display name
        const { error } = await supabase
          .from('venue_sport_display_names')
          .update({
            display_name: displayNameValue.trim(),
          })
          .eq('id', currentEditId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Custom sport name updated successfully',
        });
      } else {
        // Check if a mapping already exists for this venue-sport combination
        const { data: existing } = await supabase
          .from('venue_sport_display_names')
          .select('id')
          .eq('venue_id', selectedVenue)
          .eq('sport_id', selectedSport)
          .maybeSingle();

        if (existing) {
          toast({
            title: 'Already exists',
            description: 'A custom name for this venue-sport combination already exists',
            variant: 'destructive',
          });
          return;
        }

        // Create new display name
        const { error } = await supabase
          .from('venue_sport_display_names')
          .insert({
            venue_id: selectedVenue,
            sport_id: selectedSport,
            display_name: displayNameValue.trim(),
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Custom sport name created successfully',
        });
      }

      // Reset form and refresh data
      resetForm();
      fetchDisplayNames();
    } catch (error) {
      console.error('Error saving sport display name:', error);
      toast({
        title: 'Error',
        description: 'Failed to save custom sport name',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: DisplayName) => {
    setIsEditing(true);
    setCurrentEditId(item.id);
    setSelectedVenue(item.venue_id);
    setSelectedSport(item.sport_id);
    setDisplayNameValue(item.display_name);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('venue_sport_display_names')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Custom sport name deleted successfully',
      });
      
      fetchDisplayNames();
    } catch (error) {
      console.error('Error deleting sport display name:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete custom sport name',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setSelectedVenue('');
    setSelectedSport('');
    setDisplayNameValue('');
    setIsEditing(false);
    setCurrentEditId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Custom Sport Display Names</h2>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-sport-green hover:bg-sport-green-dark">
          <Plus size={16} className="mr-2" /> Add Custom Name
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
        </div>
      ) : displayNames.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No custom sport display names found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead>Original Sport Name</TableHead>
              <TableHead>Custom Display Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayNames.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.venue?.name || 'Unknown Venue'}</TableCell>
                <TableCell>{item.sport?.name || 'Unknown Sport'}</TableCell>
                <TableCell>{item.display_name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Custom Sport Name' : 'Add Custom Sport Name'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="venue">Venue</Label>
              <Select
                disabled={isEditing}
                value={selectedVenue}
                onValueChange={setSelectedVenue}
              >
                <SelectTrigger id="venue">
                  <SelectValue placeholder="Select a venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sport">Sport</Label>
              <Select
                disabled={isEditing}
                value={selectedSport}
                onValueChange={setSelectedSport}
              >
                <SelectTrigger id="sport">
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((sport) => (
                    <SelectItem key={sport.id} value={sport.id}>
                      {sport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display-name">Custom Display Name</Label>
              <Input
                id="display-name"
                value={displayNameValue}
                onChange={(e) => setDisplayNameValue(e.target.value)}
                placeholder="E.g., Box Cricket / Football"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportDisplayNames;
