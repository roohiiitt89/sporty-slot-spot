import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { Map } from "@/components/Map";
import { BookSlotModal } from "@/components/BookSlotModal";
import { CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, Filter, Locate, MapPin, Phone, Star, Utensils } from "lucide-react";

interface Review {
  id: string;
  user_id: string;
  venue_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_profile: {
    full_name: string;
    profile_name: string;
  };
}

export default function VenueDetails() {
  const { id: venueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [date, setDate] = useState(new Date());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [allowCashPayments, setAllowCashPayments] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });

  const { data: venue, isLoading } = useQuery(
    ["venue", venueId],
    async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .eq("id", venueId)
        .single();

      if (error) {
        console.error("Error fetching venue:", error);
        toast({
          title: "Error",
          description: "Failed to fetch venue details.",
          variant: "destructive",
        });
        return null;
      }
      return data;
    }
  );

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select(
            `
            id,
            user_id,
            venue_id,
            rating,
            comment,
            created_at,
            user_profile:profiles (full_name, profile_name)
          `
          )
          .eq("venue_id", venueId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching reviews:", error);
          toast({
            title: "Error",
            description: "Failed to fetch reviews.",
            variant: "destructive",
          });
          return;
        }
        setReviews(data || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        toast({
          title: "Error",
          description: "Failed to fetch reviews.",
          variant: "destructive",
        });
      } finally {
        setLoadingReviews(false);
      }
    };

    if (venueId) {
      fetchReviews();
    }
  }, [venueId]);

  const handleReviewSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit a review.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!newReview.comment.trim()) {
      toast({
        title: "Validation error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.from("reviews").insert([
        {
          user_id: user.id,
          venue_id: venueId,
          rating: newReview.rating,
          comment: newReview.comment,
        },
      ]);

      if (error) {
        console.error("Error submitting review:", error);
        toast({
          title: "Error",
          description: "Failed to submit review.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });

      // Optimistically update the reviews
      setReviews([
        ...reviews,
        {
          id: data[0].id,
          user_id: user.id,
          venue_id: venueId,
          rating: newReview.rating,
          comment: newReview.comment,
          created_at: new Date().toISOString(),
          user_profile: {
            full_name: user.user_metadata.full_name,
            profile_name: user.user_metadata.profile_name,
          },
        },
      ]);

      // Clear the review form
      setNewReview({
        rating: 5,
        comment: "",
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review.",
        variant: "destructive",
      });
    }
  };

  const handleBookingComplete = () => {
    setBookingModalOpen(false);
    toast({
      title: "Booking Successful",
      description: "Your slot has been booked successfully!",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-48 mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full" />
            <div className="mt-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
          </div>

          <div>
            <Skeleton className="h-48 w-full" />
            <div className="mt-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-full mt-2" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Skeleton className="h-8 w-48" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 border rounded-md">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Venue Not Found</h1>
          <p className="text-gray-500">
            Sorry, the venue you are looking for does not exist.
          </p>
          <Button onClick={() => navigate("/venues")}>
            Back to Venues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate("/venues")} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Venues
      </Button>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <p className="text-gray-500">
          <MapPin className="inline-block mr-1" size={16} />
          {venue.address}, {venue.city}, {venue.state}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <img
            src={venue.image_url || "/placeholder.jpg"}
            alt={venue.name}
            className="w-full h-64 object-cover rounded-md"
          />

          <div className="mt-4">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="text-gray-700">{venue.description || "No description available."}</p>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Venue Details</CardTitle>
              <CardDescription>Quick overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{venue.address}</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                <span>{venue.contact_number}</span>
              </div>
              <div className="flex items-center">
                <Utensils className="mr-2 h-4 w-4" />
                <span>{venue.amenities || "No amenities listed"}</span>
              </div>
              <Button variant="secondary" className="w-full justify-center" onClick={() => setIsMapOpen(true)}>
                <Locate className="mr-2 h-4 w-4" />
                View on Map
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Book a Slot</h2>
        <div className="flex items-center space-x-2 mb-4">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <span>Select Date:</span>
          <Input
            type="date"
            value={format(date, "yyyy-MM-dd")}
            onChange={(e) => setDate(new Date(e.target.value))}
            className="w-32"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venue.courts &&
            JSON.parse(venue.courts).map((court: any) => (
              <Card key={court.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{court.name}</CardTitle>
                  <CardDescription>
                    Hourly Rate: ₹{court.hourly_rate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Available</span>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedCourt(court);
                      setHourlyRate(court.hourly_rate);
                      setAllowCashPayments(venue.allow_cash_payments);
                      setBookingModalOpen(true);
                    }}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Reviews</h2>
        <div className="mb-4">
          <Textarea
            placeholder="Write your review here..."
            value={newReview.comment}
            onChange={(e) =>
              setNewReview({ ...newReview, comment: e.target.value })
            }
            className="w-full mb-2"
          />
          <div className="flex items-center space-x-2 mb-2">
            <Label>Rating:</Label>
            <Select
              value={newReview.rating.toString()}
              onValueChange={(value) =>
                setNewReview({ ...newReview, rating: parseInt(value) })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating} Stars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleReviewSubmit}>Submit Review</Button>
        </div>

        {loadingReviews ? (
          <div className="animate-pulse">
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="mb-4">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center">
                    {review.user_profile?.profile_name
                      ? review.user_profile.profile_name
                      : review.user_profile?.full_name
                        ? review.user_profile.full_name.substring(0, 2).toUpperCase()
                        : "NA"}
                  </div>
                  <div>
                    <CardTitle>{review.user_profile?.full_name || "Anonymous"}</CardTitle>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Star className="h-4 w-4" />
                      <span>{review.rating}</span>
                      <span className="ml-2">
                        {format(new Date(review.created_at), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>{review.comment}</p>
              </CardContent>
            </Card>
          ))
        )}
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
          venueId={venueId}
        />
      )}

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Venue Location</DialogTitle>
            <DialogDescription>
              See the exact location of {venue.name} on the map.
            </DialogDescription>
          </DialogHeader>
          <Map address={venue.address} city={venue.city} state={venue.state} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
