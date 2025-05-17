
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TournamentWithDetails } from "@/types/tournament";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
  team_name: z.string().min(2, "Team name is required"),
  player_count: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, "Must be greater than 0"),
  notes: z.string().optional(),
});

interface RegisterTournamentFormProps {
  tournament: TournamentWithDetails;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RegisterTournamentForm({ tournament, onSuccess, onCancel }: RegisterTournamentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team_name: "",
      player_count: "1",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to register for the tournament",
          variant: "destructive",
        });
        return;
      }
      
      // Check if already registered
      const { data: existingRegistrations } = await supabase
        .from("tournament_registrations")
        .select("id")
        .eq("tournament_id", tournament.id)
        .eq("user_id", session.user.id)
        .single();
      
      if (existingRegistrations) {
        toast({
          title: "Already registered",
          description: "You have already registered for this tournament",
          variant: "destructive",
        });
        return;
      }
      
      // Submit the tournament registration
      const { error } = await supabase.from("tournament_registrations").insert({
        tournament_id: tournament.id,
        user_id: session.user.id,
        team_name: values.team_name,
        player_count: values.player_count as unknown as number,
        notes: values.notes,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Registration successful",
        description: "You've successfully registered for the tournament",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error registering for tournament:", error);
      toast({
        title: "Error",
        description: "Failed to register for the tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="team_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your team name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="player_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Players</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Any special requirements or information" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tournament.entry_fee ? (
          <div className="bg-muted p-4 rounded-md">
            <p className="font-medium">Entry Fee: ₹{tournament.entry_fee}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Note: Payment will be collected separately after registration approval.
            </p>
          </div>
        ) : null}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Spinner className="mr-2" /> Submitting...</> : "Register"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
