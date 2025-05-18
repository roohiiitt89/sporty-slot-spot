
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";

import { Venue } from "@/types/venue";
import { getAllVenues } from "@/integrations/venue-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, Plus, MapPinIcon, Phone, Globe, CalendarDays } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Pagination } from "@/components/ui/pagination";
import { CreateVenueModal } from "@/components/CreateVenueModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { BookSlotModal } from "@/components/BookSlotModal";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

const Venues = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 500);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [allowCashPayments, setAllowCashPayments] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 7)),
    })

  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const [isCreateVenueModalOpen, setIsCreateVenueModalOpen] = useState(false);

  const {
    data: venuesData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["venues", page, debouncedSearch],
    queryFn: () => getAllVenues(page, DEFAULT_PAGE_SIZE, debouncedSearch),
    keepPreviousData: true,
  });

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(page));
    if (search) {
      newParams.set("search", search);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  }, [page, search, setSearchParams]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleBookingComplete = () => {
    toast({
      title: "Booking Successful",
      description: "Your booking has been confirmed.",
    });
  };

  if (isError) {
    return <div>Error: {(error as Error).message}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Venues</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="search"
              placeholder="Search venues..."
              className="pl-10 pr-4"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreateVenueModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </Button>
          )}
        </div>
      </div>

      <Separator className="mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-5 w-4/5" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-3/5" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </CardContent>
              </Card>
            ))
          : venuesData?.data.map((venue: Venue) => (
              <Card
                key={venue.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader>
                  <CardTitle>{venue.name}</CardTitle>
                  <CardDescription>{venue.address}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-700">{venue.city}, {venue.state}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-700">{venue.phone}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {date?.from ? (
                            date.to ? (
                              `${format(date.from, "MMM dd, yyyy")} - ${format(
                                date.to,
                                "MMM dd, yyyy"
                              )}`
                            ) : (
                              format(date.from, "MMM dd, yyyy")
                            )
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                          mode="range"
                          defaultMonth={new Date()}
                          selected={date}
                          onSelect={setDate}
                          numberOfMonths={2}
                          disabled={{ before: new Date() }}
                          pagedNavigation
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      {venue.is_approved ? (
                        <Badge variant="outline">Approved</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setBookingModalOpen(true);
                        setSelectedDate(new Date());
                      }}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {venuesData?.meta.total && (
        <Pagination
          currentPage={page}
          totalItems={venuesData.meta.total}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <CreateVenueModal
        open={isCreateVenueModalOpen}
        onOpenChange={setIsCreateVenueModalOpen}
      />
        
      {bookingModalOpen && (
        <BookSlotModal
          isOpen={bookingModalOpen} 
          onOpenChange={setBookingModalOpen}
          selectedDate={selectedDate}
          selectedCourt={null}
          hourlyRate={null}
          onBookingComplete={handleBookingComplete}
          allowCashPayments={allowCashPayments}
          onClose={() => setBookingModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Venues;
