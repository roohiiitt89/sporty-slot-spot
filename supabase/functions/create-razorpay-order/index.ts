
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Get Razorpay API keys from environment variables
const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "";
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

// CORS headers to allow cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  venueId?: string; // Added to get venue details for transfer
  sportId?: string; // Added to include in notes
  bookingInfo?: string; // Additional booking information for transfer notes
}

interface TransferItem {
  account: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Check if API keys are configured
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay API keys not configured");
    }

    // Parse request body
    const { amount, currency = "INR", receipt = "", notes = {}, venueId, sportId, bookingInfo } = await req.json() as CreateOrderRequest;
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // The total amount should be in paise
    const amountInPaise = Math.round(amount);
    console.log(`Creating Razorpay order for amount: ${amountInPaise}`);
    
    // Set up transfers array if venue ID is provided
    let transfers: TransferItem[] = [];
    let venueAccountId: string | null = null;
    let sportName = sportId ? `Sport ID: ${sportId}` : "Venue booking";
    
    // Create Basic Authorization header
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    
    // If venue ID is provided, fetch the venue's Razorpay account ID
    if (venueId) {
      try {
        // Create Supabase client to fetch venue information
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("Supabase configuration is missing");
        } else {
          const venueResponse = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venueId}&select=razorpay_account_id,name`, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`
            }
          });
          
          if (venueResponse.ok) {
            const venueData = await venueResponse.json();
            if (venueData && venueData.length > 0) {
              venueAccountId = venueData[0].razorpay_account_id;
              const venueName = venueData[0].name;
              
              // If sport ID is provided, get sport name
              if (sportId) {
                const sportResponse = await fetch(`${supabaseUrl}/rest/v1/sports?id=eq.${sportId}&select=name`, {
                  headers: {
                    "apikey": supabaseKey,
                    "Authorization": `Bearer ${supabaseKey}`
                  }
                });
                
                if (sportResponse.ok) {
                  const sportData = await sportResponse.json();
                  if (sportData && sportData.length > 0) {
                    sportName = sportData[0].name;
                  }
                }
              }
              
              // Log venue and sport information
              console.log(`Venue: ${venueName}, Sport: ${sportName}, Razorpay Account ID: ${venueAccountId}`);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching venue data:", error);
      }
    }
    
    // If venue has a Razorpay account ID, set up transfers
    if (venueAccountId) {
      // Calculate venue's share (93% of the total amount)
      const venueShare = Math.floor(amountInPaise * 0.93);
      
      transfers = [
        {
          account: venueAccountId,
          amount: venueShare,
          currency: currency,
          notes: {
            booking_type: sportName,
            booking_info: bookingInfo || `Booking at venue ID ${venueId}`,
            share_percentage: "93%"
          }
        }
      ];
      
      console.log(`Setting up transfer to venue account ${venueAccountId} of amount ${venueShare} (93% of total ${amountInPaise})`);
    } else if (venueId) {
      console.warn(`Venue ID ${venueId} provided but no Razorpay account ID found. No transfers will be set up.`);
    }

    // Create Razorpay order with or without transfers
    const orderPayload: any = {
      amount: amountInPaise, 
      currency: currency,
      receipt: receipt,
      notes: notes
    };
    
    // Only include transfers if there are items to transfer
    if (transfers.length > 0) {
      orderPayload.transfers = transfers;
    }
    
    console.log("Razorpay order payload:", JSON.stringify(orderPayload));
    
    // Create Razorpay order
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderPayload)
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error("Razorpay API error:", razorpayData);
      throw new Error(razorpayData.error?.description || "Failed to create Razorpay order");
    }

    // Return successful response with Razorpay order details
    return new Response(
      JSON.stringify({
        order: razorpayData,
        key_id: RAZORPAY_KEY_ID
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in create-razorpay-order function:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
