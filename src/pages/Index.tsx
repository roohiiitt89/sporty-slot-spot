import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="py-8 md:py-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">
          Find and Book Sports Venues Near You
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Discover the perfect venue for your next game. Easy booking, instant confirmation.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <Button onClick={() => navigate('/venues')} size="lg" className="flex-1 md:flex-none">
            Browse Venues
          </Button>
          <Button onClick={() => navigate('/sports')} variant="outline" size="lg" className="flex-1 md:flex-none">
            Explore by Sport
          </Button>
        </div>
        
        {/* Challenge Mode Button */}
        <EnterChallengeButton />
      </header>
      
      {/* <section className="py-8 md:py-12">
        <h2 className="text-2xl font-semibold mb-4">Why Book With Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Wide Selection</h3>
            <p className="text-muted-foreground">
              Choose from a variety of venues and sports.
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Easy Booking</h3>
            <p className="text-muted-foreground">
              Book your venue in just a few clicks.
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Best Prices</h3>
            <p className="text-muted-foreground">
              We offer the best prices on the market.
            </p>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Index;
