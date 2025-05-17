import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  organizer_name: z.string().min(2, { message: "Organizer name is required" }),
  tournament_name: z.string().min(3, { message: "Tournament name is required" }),
  sport_id: z.string().min(1, { message: "Sport is required" }),
  venue_id: z.string().min(1, { message: "Venue is required" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
  max_participants: z.coerce.number().int().min(2, { message: "At least 2 participants" }),
  entry_fee: z.coerce.number().nonnegative().optional(),
  contact_info: z.string().min(3, { message: "Contact info is required" }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function HostTournamentForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sports, setSports] = useState<{ id: string; name: string }[]>([]);
  const [venues, setVenues] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizer_name: user?.user_metadata?.name || "",
      tournament_name: "",
      sport_id: "",
      venue_id: "",
      start_date: "",
      end_date: "",
      max_participants: 8,
      entry_fee: undefined,
      contact_info: user?.email || "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchSports = async () => {
      const { data, error } = await supabase.from("sports").select("id, name").eq("is_active", true);
      if (!error && data) setSports(data);
    };
    const fetchVenues = async () => {
      const { data, error } = await supabase.from("venues").select("id, name");
      if (!error && data) setVenues(data);
    };
    fetchSports();
    fetchVenues();
  }, []);

  async function onSubmit(data: FormValues) {
    if (!user) {
      toast({ title: "Authentication required", description: "Please sign in to host tournaments", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from as any)("tournament_host_requests").insert({
        organizer_name: data.organizer_name,
        user_id: user.id,
        tournament_name: data.tournament_name,
        sport_id: data.sport_id,
        venue_id: data.venue_id,
        start_date: data.start_date,
        end_date: data.end_date,
        max_participants: data.max_participants,
        entry_fee: data.entry_fee || null,
        contact_info: data.contact_info,
        description: data.description || null,
      });
      if (error) throw error;
      toast({ title: "Request submitted", description: "Your tournament host request has been submitted. Our team will review it soon." });
      form.reset();
    } catch (error: any) {
      toast({ title: "Submission failed", description: error.message || "There was a problem submitting your request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="organizer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organizer Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name or organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tournament_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="Tournament name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sport_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sport</FormLabel>
                <FormControl>
                  <select {...field} className="w-full p-2 border rounded-md">
                    <option value="">Select sport</option>
                    {sports.map(sport => (
                      <option key={sport.id} value={sport.id}>{sport.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="venue_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue</FormLabel>
                <FormControl>
                  <select {...field} className="w-full p-2 border rounded-md">
                    <option value="">Select venue</option>
                    {venues.map(venue => (
                      <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="max_participants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Participants</FormLabel>
                <FormControl>
                  <Input type="number" min="2" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entry_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee (optional)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="contact_info"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Info</FormLabel>
              <FormControl>
                <Input placeholder="Email or phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your tournament, rules, etc." className="resize-none min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 