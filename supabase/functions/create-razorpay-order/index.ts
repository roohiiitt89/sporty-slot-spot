
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
    const { amount, currency = "INR", receipt = "", notes = {} } = await req.json() as CreateOrderRequest;
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // Fix: The total amount should be in paise, but doesn't need additional multiplication 
    // if already converted in BookSlotModal.tsx
    const amountInPaise = Math.round(amount);
    console.log(`Creating Razorpay order for amount: ${amountInPaise}`);

    // Create Basic Authorization header
    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Create Razorpay order
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountInPaise, // Use the amount already in paise
        currency: currency,
        receipt: receipt,
        notes: notes
      })
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
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
