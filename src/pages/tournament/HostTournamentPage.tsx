import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { HostTournamentForm } from "@/components/tournament/HostTournamentForm";

export function HostTournamentPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12 max-w-3xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/tournaments" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </Link>
        </Button>
      
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Host a Tournament</h1>
          <p className="text-muted-foreground mt-2">
            Submit your request to host a tournament. Our team will review your submission and get in touch with you.
          </p>
        </div>
        
        <div className="bg-card rounded-lg shadow p-6">
          <HostTournamentForm />
        </div>
      </div>
    </div>
  );
}
