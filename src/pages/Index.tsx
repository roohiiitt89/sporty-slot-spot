
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';
import { LeaderboardPreview } from '@/components/challenge/LeaderboardPreview';
import { HowItWorks } from '@/components/challenge/HowItWorks';

const Index = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-6">Welcome to SportVenue</h1>
        <p className="text-xl mb-6">Find and book sports venues in your area</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Book a Venue</CardTitle>
              <CardDescription>Find venues for your favorite sports</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Browse through our selection of top-rated sports venues and book your slot today.</p>
            </CardContent>
            <CardFooter>
              <Link to="/venues">
                <Button>Browse Venues</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sports Activities</CardTitle>
              <CardDescription>Discover sports activities near you</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Explore various sports activities available in your area and join the fun.</p>
            </CardContent>
            <CardFooter>
              <Link to="/sports">
                <Button>View Sports</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Bookings</CardTitle>
              <CardDescription>Manage your bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>View and manage all your current and upcoming venue bookings.</p>
            </CardContent>
            <CardFooter>
              <Link to="/bookings">
                <Button>My Bookings</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Challenge Mode</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <HowItWorks />
            <div className="mt-6">
              {/* Fixing the className issue by wrapping in a div */}
              <div className="text-center">
                <EnterChallengeButton />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <LeaderboardPreview />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
