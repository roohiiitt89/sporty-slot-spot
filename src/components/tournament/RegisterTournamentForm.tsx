
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tournament } from "@/types/tournament";

const formSchema = z.object({
  teamName: z.string().min(3, { message: "Team name is required" }),
  playerCount: z.number().int().min(1, { message: "At least 1 player required" }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterTournamentFormProps {
  tournament: Tournament;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RegisterTournamentForm({ tournament, onSuccess, onCancel }: RegisterTournamentFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      playerCount: 1,
      notes: "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for tournaments",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("tournament_registrations").insert({
        tournament_id: tournament.id,
        user_id: user.id,
        team_name: data.teamName,
        player_count: data.playerCount,
        notes: data.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Registration successful",
        description: "You have successfully registered for this tournament.",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "There was a problem with your registration.",
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
          name="teamName"
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
          name="playerCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Players</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1"
                  placeholder="Enter number of players" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))} 
                />
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
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any special requirements or information" 
                  className="resize-none min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
