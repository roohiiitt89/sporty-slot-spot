import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { BookSlotModal } from "@/components/BookSlotModal";

interface Sport {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

const Sports = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allowCashPayments, setAllowCashPayments] = useState(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSports = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from<Sport>("sports")
          .select("*")
          .ilike("name", `%${searchTerm}%`)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .order(sortBy, { ascending: sortOrder === "asc" });

        if (selectedSport) {
          query = query.eq("id", selectedSport);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching sports:", error);
          toast({
            title: "Error",
            description: "Failed to fetch sports. Please try again.",
            variant: "destructive",
          });
        } else {
          setSports(data || []);
        }
      } catch (error) {
        console.error("Unexpected error fetching sports:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSports();
  }, [searchTerm, selectedSport, minPrice, maxPrice, sortBy, sortOrder]);

  const handleBooking = (sportId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a slot.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setSelectedSport(sportId);
    setBookingModalOpen(true);
  };

  const handleBookingComplete = () => {
    setBookingModalOpen(false);
    toast({
      title: "Success",
      description: "Booking successful!",
    });
  };

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <div className="relative w-full md:w-1/3">
          <Input
            type="text"
            placeholder="Search for sports..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        </div>

        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <Select onValueChange={(value) => setSelectedSport(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sports</SelectItem>
              {sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  {sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-1 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Customize your search.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="price">Price Range</Label>
                <div className="flex items-center space-x-2">
                  <span>₹{minPrice}</span>
                  <Slider
                    defaultValue={[minPrice, maxPrice]}
                    max={1000}
                    step={10}
                    onValueChange={(value) => {
                      setMinPrice(value[0]);
                      setMaxPrice(value[1]);
                    }}
                  />
                  <span>₹{maxPrice}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="cashPayments">Allow Cash Payments</Label>
                <Switch id="cashPayments" checked={allowCashPayments} onCheckedChange={setAllowCashPayments} />
              </div>
              <div>
                <Label htmlFor="sort">Sort By</Label>
                <Select onValueChange={(value) => setSortBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="created_at">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order">Sort Order</Label>
                <Select onValueChange={(value) => setSortOrder(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <>
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-full h-40" />
                <Skeleton className="w-full h-40" />
              </>
            ) : sports.length > 0 ? (
              sports.map((sport) => (
                <Card key={sport.id}>
                  <CardHeader>
                    <CardTitle>{sport.name}</CardTitle>
                    <CardDescription>{sport.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <img src={sport.image_url} alt={sport.name} className="rounded-md mb-4 h-32 w-full object-cover" />
                    <div className="flex justify-between items-center">
                      <Button onClick={() => handleBooking(sport.id)}>Book Now</Button>
                      <Link to={`/sports/${sport.id}`} className="text-sm text-muted-foreground hover:underline">
                        Learn More
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center">
                <p className="text-muted-foreground">No sports found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {bookingModalOpen && (
        <BookSlotModal
          isOpen={true} // Changed from open to isOpen based on the error message
          onOpenChange={setBookingModalOpen}
          selectedDate={selectedDate}
          selectedCourt={null}
          hourlyRate={null}
          onBookingComplete={handleBookingComplete}
          allowCashPayments={allowCashPayments}
          onClose={() => setBookingModalOpen(false)}
          sportId={selectedSport}
        />
      )}
    </div>
  );
};

export default Sports;
