import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Venue {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  location: string; // Required field that was missing
  // ... other venue fields
}

// ... keep existing code (component implementation)

// In your component where you fetch venues:
const fetchVenues = async () => {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, image_url, rating, location') // Make sure to include location
      .eq('is_active', true)
      .limit(3);

    if (error) throw error;
    setVenues(data as Venue[]); // Type assertion to ensure it includes the location field
  } catch (error) {
    console.error('Error fetching venues:', error);
  }
};

// ... keep existing code
