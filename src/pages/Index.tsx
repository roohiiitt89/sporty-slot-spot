
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { LocationPermissionRequest } from '../components/LocationPermissionRequest';
import { NearbyVenues } from '../components/NearbyVenues';
import HeroSection from '../components/HeroSection';

// Define interface for venue data
interface VenueData {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  [key: string]: any; // Allow other properties
}

// Define interface for sport data
interface SportData {
  id: string;
  name: string;
  image_url?: string;
  [key: string]: any; // Allow other properties
}

const Index = () => {
  const isMobile = useIsMobile();
  const [featuredVenues, setFeaturedVenues] = useState<VenueData[]>([]);
  const [popularSports, setPopularSports] = useState<SportData[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [loadingSports, setLoadingSports] = useState(true);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showVenuesNearMe, setShowVenuesNearMe] = useState(false);

  const fetchFeaturedVenues = useCallback(async () => {
    try {
      setLoadingVenues(true);
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, image_url, description')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(6);

      if (error) {
        throw error;
      }

      // Only set featured venues if the data is valid
      if (data && Array.isArray(data)) {
        setFeaturedVenues(data as VenueData[]);
      }
    } catch (error) {
      console.error('Error fetching featured venues:', error);
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  const fetchPopularSports = useCallback(async () => {
    try {
      setLoadingSports(true);
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .eq('is_popular', true)
        .eq('is_active', true)
        .limit(6);

      if (error) {
        throw error;
      }

      // Only set popular sports if the data is valid
      if (data && Array.isArray(data)) {
        setPopularSports(data as SportData[]);
      }
    } catch (error) {
      console.error('Error fetching popular sports:', error);
    } finally {
      setLoadingSports(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedVenues();
    fetchPopularSports();

    // Check if geolocation is supported
    if (navigator.geolocation) {
      setShowLocationPermission(true);
    }
  }, [fetchFeaturedVenues, fetchPopularSports]);

  const handleLocationPermissionGranted = useCallback(() => {
    setShowLocationPermission(false);
    setShowVenuesNearMe(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <HeroSection />

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Location Permission and Nearby Venues */}
          {showLocationPermission && (
            <div className="mb-10">
              <LocationPermissionRequest
                onPermissionGranted={handleLocationPermissionGranted}
                onPermissionDenied={() => setShowLocationPermission(false)}
              />
            </div>
          )}

          {showVenuesNearMe && <NearbyVenues className="mb-16" />}

          {/* Featured Venues */}
          <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Featured Venues</h2>
              <Link to="/venues" className="text-indigo-600 hover:text-indigo-500 flex items-center">
                View All <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
            {loadingVenues ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredVenues.map((venue) => (
                  <Link 
                    to={`/venues/${venue.id}`}
                    key={venue.id}
                    className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {venue.image_url ? (
                        <img
                          src={venue.image_url}
                          alt={venue.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <p className="text-gray-400">No image available</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1 group-hover:text-indigo-600 transition-colors">
                        {venue.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{venue.description || 'Visit this amazing venue'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Popular Sports */}
          <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Popular Sports</h2>
              <Link to="/sports" className="text-indigo-600 hover:text-indigo-500 flex items-center">
                View All <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
            {loadingSports ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {popularSports.map((sport) => (
                  <Link
                    key={sport.id}
                    to={`/sports?id=${sport.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col items-center p-4"
                  >
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                      {sport.image_url ? (
                        <img
                          src={sport.image_url}
                          alt={sport.name}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="text-indigo-500 text-xl font-bold">
                          {sport.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-center">{sport.name}</h3>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
              How Grid2Play Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Find a Sport Venue</h3>
                <p className="text-gray-600">
                  Browse through our curated list of top sport venues or find venues near your location.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Book Your Slot</h3>
                <p className="text-gray-600">
                  Select your preferred date, time and book instantly with our easy booking system.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-indigo-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Play & Enjoy</h3>
                <p className="text-gray-600">
                  Show up at the venue, present your booking confirmation and enjoy your game!
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to book your next game?</h2>
                <p className="text-indigo-100">
                  Join thousands of sports enthusiasts who book venues through Grid2Play.
                </p>
              </div>
              <Link
                to="/venues"
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Explore Venues
              </Link>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
