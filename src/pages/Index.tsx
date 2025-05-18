import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { VenueCard } from "@/components/VenueCard";
import { SportCard } from "@/components/SportCard";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { NewAIChatWidget } from "@/components/NewAIChatWidget";
import { HowItWorks } from "@/components/challenge/HowItWorks";
import { LeaderboardPreview } from "@/components/challenge/LeaderboardPreview";
import { BookSlotModal } from "@/components/BookSlotModal";
import { useVenues } from "@/hooks/use-venues";
import { useSports } from "@/hooks/use-sports";
import { useTournaments } from "@/hooks/use-tournament";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/ModeToggle";
import { BottomNav } from "@/components/ui/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminBottomNav } from "@/components/ui/AdminBottomNav";
import { AdminRedirector } from "@/components/AdminRedirector";

const Index = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allowCashPayments, setAllowCashPayments] = useState(false);
  const { toast } = useToast();
  const { venues, isLoading: isLoadingVenues } = useVenues();
  const { sports, isLoading: isLoadingSports } = useSports();
  const { tournaments, isLoading: isLoadingTournaments } = useTournaments();
  const { userRole } = useAuth();
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
  const [chatActive, setChatActive] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleChatClick = () => setChatActive((prev) => !prev);

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleBookingClick = () => {
    if (date) {
      setSelectedDate(date);
      setBookingModalOpen(true);
    } else {
      toast({
        title: "Please select a date",
        description: "You need to select a date to book a slot.",
      });
    }
  };

  const handleBookingComplete = () => {
    setBookingModalOpen(false);
    toast({
      title: "Booking successful",
      description: "Your slot has been booked successfully.",
    });
  };

  const formatDate = (date: Date): string => {
    return format(date, 'EEE, MMMM dd');
  };

  const handlePreviousDay = () => {
    setDate(prevDate => {
      const newDate = subDays(prevDate || new Date(), 1);
      setSelectedDate(newDate);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setDate(prevDate => {
      const newDate = addDays(prevDate || new Date(), 1);
      setSelectedDate(newDate);
      return newDate;
    });
  };

  return (
    <>
      {isMobile && <NotificationBell />}
      <AdminRedirector />
      <div className="container relative pb-20">
        <div className="flex justify-between items-center pt-6">
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            Explore
          </h1>
          <ModeToggle />
        </div>

        <Card className="w-full max-w-full mt-4">
          <CardHeader>
            <CardTitle>Book a court</CardTitle>
            <CardDescription>
              Select a date to see available courts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-[1fr_110px] gap-4">
              <div className="flex items-center">
                <Button variant="outline" size="sm" className="mr-2 h-9 w-9 p-0" onClick={handlePreviousDay}>
                  <ArrowLeftCircle className="h-4 w-4" />
                  <span className="sr-only">Previous day</span>
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={
                        "w-[240px] justify-start text-left font-normal" +
                        (date ? "pl-3" : " text-muted-foreground")
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? formatDate(date) : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      disabled={(date) =>
                        date < new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" className="ml-2 h-9 w-9 p-0" onClick={handleNextDay}>
                  <ArrowRightCircle className="h-4 w-4" />
                  <span className="sr-only">Next day</span>
                </Button>
              </div>
              <Button onClick={handleBookingClick}>Book now</Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="cash"
                type="checkbox"
                checked={allowCashPayments}
                onChange={(e) => setAllowCashPayments(e.target.checked)}
              />
              <Label htmlFor="cash">Allow Cash Payments</Label>
            </div>
          </CardContent>
        </Card>

        <section className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Venues
            </h2>
            <Button asChild variant="link">
              <Link to="/venues">View All</Link>
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoadingVenues ? (
              <>
                <Skeleton className="h-[200px] w-full rounded-md" />
                <Skeleton className="h-[200px] w-full rounded-md" />
                <Skeleton className="h-[200px] w-full rounded-md" />
                <Skeleton className="h-[200px] w-full rounded-md" />
              </>
            ) : (
              venues?.slice(0, 4).map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Sports
            </h2>
            <Button asChild variant="link">
              <Link to="/sports">View All</Link>
            </Button>
          </div>
          <Separator className="my-4" />
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="inline-flex space-x-4">
              {isLoadingSports ? (
                <>
                  <Skeleton className="h-[100px] w-[150px] rounded-md" />
                  <Skeleton className="h-[100px] w-[150px] rounded-md" />
                  <Skeleton className="h-[100px] w-[150px] rounded-md" />
                  <Skeleton className="h-[100px] w-[150px] rounded-md" />
                </>
              ) : (
                sports?.map((sport) => (
                  <SportCard key={sport.id} sport={sport} />
                ))
              )}
            </div>
          </ScrollArea>
        </section>

        <section className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Tournaments
            </h2>
            <Button asChild variant="link">
              <Link to="/tournaments">View All</Link>
            </Button>
          </div>
          <Separator className="my-4" />
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingTournaments ? (
              <>
                <Skeleton className="h-[250px] w-full rounded-md" />
                <Skeleton className="h-[250px] w-full rounded-md" />
                <Skeleton className="h-[250px] w-full rounded-md" />
              </>
            ) : (
              tournaments?.slice(0, 3).map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))
            )}
          </div>
        </section>

        <HowItWorks />
        <LeaderboardPreview />

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
          />
        )}
      </div>

      {/* Always mount the chat widget on mobile, but control visibility with isOpen */}
      {isMobile ? (
        <NewAIChatWidget isOpen={chatActive} setIsOpen={setChatActive} />
      ) : (
        <NewAIChatWidget />
      )}

      {/* Show appropriate bottom nav based on user role and if chat is not active */}
      {(!chatActive || !isMobile) && (
        isMobile && isAdminUser && window.location.pathname.includes('/admin') ? (
          <AdminBottomNav />
        ) : (
          <BottomNav onChatClick={handleChatClick} chatActive={chatActive} setChatActive={setChatActive} />
        )
      )}
    </>
  );
};

export default Index;
