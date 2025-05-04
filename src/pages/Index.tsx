
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Venue {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  location: string;
}

const Index = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  
  // Fetch venues on component mount
  useEffect(() => {
    fetchVenues();
  }, []);

  // Function to fetch venues
  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, image_url, rating, location')
        .eq('is_active', true)
        .limit(3);

      if (error) throw error;
      if (data) {
        setVenues(data as Venue[]);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  // You can add your JSX content here
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to Our Sports Booking Platform</h1>
      
      {venues.length > 0 ? (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Featured Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {venues.map(venue => (
              <div key={venue.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <img 
                  src={venue.image_url || '/placeholder.svg'} 
                  alt={venue.name} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold">{venue.name}</h3>
                  <p className="text-gray-600">{venue.location}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-amber-500">★</span>
                    <span className="ml-1">{venue.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Loading featured venues...</p>
      )}
    </div>
  );
};

export default Index;
