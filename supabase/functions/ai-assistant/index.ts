import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

// Enhanced system prompt with payment instructions
const SYSTEM_PROMPT = `
You are Grid2Play's expert sports slot booking assistant with payment capabilities.

KEY FEATURES:
1. Check slot availability for venues/courts
2. Book courts for specific time slots
3. Process payments via Razorpay
4. View/modify/cancel bookings
5. Answer venue/sport-specific questions

PAYMENT FLOW:
1. Show available slots first
2. Confirm booking details
3. Provide "Pay Now (₹amount)" button
4. Complete payment via Razorpay

RULES:
- Use only real data from our database
- Verify slot availability before booking
- For payments, return Razorpay order object
- Never ask for credit card details
- Maintain polite, helpful tone in English/Hinglish
`;

const HINGLISH_SYSTEM_PROMPT = `
${SYSTEM_PROMPT}

Respond in Hinglish when user does. Use phrases like:
- "Aapka slot available hai" (Your slot is available)
- "Payment karein: Pay Now (₹amount)"
- "Booking confirm ho gayi!" (Booking confirmed!)
`;

// Main server function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initial checks
    if (!OPENAI_API_KEY) {
      return errorResponse("Assistant is currently unavailable");
    }
    
    const { messages, userId, role } = await req.json();
    
    if (!userId) {
      return errorResponse("Please sign in to use booking features. कृपया साइन इन करें।");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Detect language
    const selectedSystemPrompt = detectHinglish(messages[messages.length - 1]?.content || "") 
      ? HINGLISH_SYSTEM_PROMPT 
      : SYSTEM_PROMPT;

    // Prepare message history
    const completeMessages = [
      { 
        role: "system", 
        content: `${selectedSystemPrompt}\nCurrent user ID: ${userId}` 
      },
      ...messages
    ];

    // ================== SLOT AVAILABILITY ==================
    if (containsSlotQuery(messages[messages.length - 1]?.content || "")) {
      try {
        const { venueId, sportId, courtId, date } = extractBookingParams(
          messages[messages.length - 1]?.content || ""
        );

        if (venueId && sportId) {
          const slotsInfo = courtId 
            ? await getAvailableSlots(supabase, courtId, date)
            : await getVenueSlots(supabase, venueId, sportId, date);

          if (slotsInfo.success) {
            completeMessages.push({
              role: "system",
              content: `SLOT_AVAILABILITY: ${JSON.stringify(slotsInfo)}`
            });
          }
        }
      } catch (error) {
        console.error("Slot check error:", error);
      }
    }

    // ================== BOOKING CREATION ==================
    if (containsBookingCreationQuery(messages[messages.length - 1]?.content || "")) {
      try {
        const { courtId, date, startTime, endTime } = extractBookingParams(
          messages[messages.length - 1]?.content || ""
        );

        if (courtId && date && startTime && endTime) {
          const bookingResult = await createBookingWithPayment(
            supabase,
            userId,
            { courtId, date, startTime, endTime }
          );
          
          if (bookingResult.success) {
            completeMessages.push({
              role: "system",
              content: `BOOKING_CREATED: ${JSON.stringify(bookingResult)}`
            });
          }
        }
      } catch (error) {
        console.error("Booking error:", error);
      }
    }

    // ================== FUNCTION HANDLING ==================
    const functions = [
      // ... (keep all your existing function definitions)
      // Add new payment-related function
      {
        name: "process_payment",
        description: "Process payment for a booking via Razorpay",
        parameters: {
          type: "object",
          properties: {
            booking_id: { type: "string" },
            amount: { type: "number" },
            currency: { type: "string", enum: ["INR"] }
          },
          required: ["booking_id", "amount"]
        }
      }
    ];

    // Initial OpenAI call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: completeMessages,
        temperature: 0.7,
        tools: functions.map(fn => ({ type: "function", function: fn })),
        tool_choice: "auto",
      }),
    });

    const data = await response.json();
    const responseMessage = data.choices[0].message;
    let result = { message: responseMessage };
    
    // Handle function calls
    if (responseMessage.tool_calls?.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      const functionResult = await handleFunctionCall(
        { name: functionName, arguments: functionArgs, userId },
        supabase
      );
      
      // Second OpenAI call with function result
      const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            ...completeMessages,
            responseMessage,
            {
              role: "function",
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: 0.7
        }),
      });
      
      const secondData = await secondResponse.json();
      result = { 
        message: secondData.choices[0].message, 
        functionCall: {
          name: functionName,
          arguments: functionArgs,
          result: functionResult
        }
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error:", error);
    return errorResponse("Sorry, I encountered an error. Please try again.");
  }
});

// ================== CORE FUNCTIONS ==================

async function handleFunctionCall(functionCall: any, supabase: any) {
  const { name, arguments: args, userId } = functionCall;
  
  console.log(`Handling function call: ${name}`, args);
  
  switch (name) {
    // ... (keep all your existing function cases)
    case "process_payment":
      return await processPayment(supabase, args.booking_id, args.amount, args.currency || "INR");
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// ================== BOOKING & PAYMENT FUNCTIONS ==================

async function createBookingWithPayment(
  supabase: any,
  userId: string,
  { courtId, date, startTime, endTime }: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
  }
) {
  try {
    // 1. Verify slot availability
    const { data: availability, error: availabilityError } = await supabase
      .rpc('get_available_slots', {
        p_court_id: courtId,
        p_date: date
      });

    if (availabilityError) throw availabilityError;

    const slotAvailable = availability.some((slot: any) => 
      slot.start_time === startTime && 
      slot.end_time === endTime && 
      slot.is_available
    );

    if (!slotAvailable) {
      return { 
        success: false, 
        message: "Slot not available. Please choose another time." 
      };
    }

    // 2. Get court pricing
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('id, name, hourly_rate, venue:venues(id, name)')
      .eq('id', courtId)
      .single();

    if (courtError || !court) throw courtError || new Error("Court not found");

    // 3. Calculate price
    const durationHours = (
      (new Date(`${date}T${endTime}`).getTime() - 
       new Date(`${date}T${startTime}`).getTime()) / 
      (1000 * 60 * 60)
    );
    const amount = Math.round(durationHours * court.hourly_rate * 100);

    // 4. Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        court_id: courtId,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        total_price: amount / 100,
        status: 'pending_payment',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 5. Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount,
      currency: 'INR',
      booking_id: booking.id,
      user_id: userId,
      description: `${court.name} on ${date} (${startTime}-${endTime})`
    });

    // 6. Update booking with payment reference
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_reference: razorpayOrder.id })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    return {
      success: true,
      booking,
      payment: formatPaymentResponse(razorpayOrder, court, booking)
    };

  } catch (error) {
    console.error("Booking error:", error);
    return { 
      success: false, 
      message: "Booking failed. " + (error.message || "Please try again."),
      error: error.message 
    };
  }
}

async function createRazorpayOrder(orderDetails: {
  amount: number;
  currency: string;
  booking_id: string;
  user_id: string;
  description: string;
}) {
  const authString = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${authString}`
    },
    body: JSON.stringify({
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      receipt: `booking_${orderDetails.booking_id}`,
      notes: {
        booking_id: orderDetails.booking_id,
        user_id: orderDetails.user_id
      },
      description: orderDetails.description
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.description || "Payment processing failed");
  }

  return await response.json();
}

function formatPaymentResponse(order: any, court: any, booking: any) {
  return {
    provider: "razorpay",
    order_id: order.id,
    amount: order.amount / 100, // Convert back to rupees
    currency: order.currency,
    key: RAZORPAY_KEY_ID,
    name: "Grid2Play Booking",
    description: `Booking for ${court.name}`,
    prefill: {
      name: "",
      email: "",
      contact: ""
    },
    theme: {
      color: "#3399cc"
    },
    booking_details: {
      court: court.name,
      date: booking.booking_date,
      time: `${booking.start_time}-${booking.end_time}`,
      booking_id: booking.id
    }
  };
}

async function processPayment(
  supabase: any,
  bookingId: string,
  amount: number,
  currency: string = "INR"
) {
  try {
    // Verify booking exists and amount matches
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, total_price, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) throw bookingError || new Error("Booking not found");
    if (booking.status !== 'pending_payment') throw new Error("Booking already processed");
    if (Math.round(booking.total_price * 100) !== amount) throw new Error("Amount mismatch");

    // Create Razorpay order
    const order = await createRazorpayOrder({
      amount: amount * 100, // Convert to paise
      currency,
      booking_id: bookingId,
      user_id: "", // Will be added from booking
      description: `Payment for booking ${bookingId}`
    });

    return {
      success: true,
      payment: formatPaymentResponse(order, { name: "" }, booking)
    };
  } catch (error) {
    console.error("Payment error:", error);
    return {
      success: false,
      message: "Payment processing failed",
      error: error.message
    };
  }
}

// ================== HELPER FUNCTIONS ==================

function extractBookingParams(content: string) {
  const lowerContent = content.toLowerCase();
  
  // Extract IDs
  const venueId = extractId(content, 'venue');
  const sportId = extractId(content, 'sport');
  const courtId = extractId(content, 'court');
  
  // Extract date
  let date = new Date().toISOString().split('T')[0]; // Default to today
  if (lowerContent.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
  } else {
    const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) date = dateMatch[1];
  }
  
  // Extract time
  let startTime = '', endTime = '';
  const timeMatch = content.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (timeMatch) {
    startTime = timeMatch[1];
    endTime = timeMatch[2];
  }

  return { venueId, sportId, courtId, date, startTime, endTime };
}

function extractId(content: string, type: string) {
  const regex = new RegExp(`${type}\\s*(id)?\\s*[:=]?\\s*([a-f0-9-]{36})`, 'i');
  const match = content.match(regex);
  return match?.[2] || '';
}

function detectHinglish(message: string): boolean {
  const hindiPatterns = ['kya', 'hai', 'main', 'mujhe', 'aap', 'kaise', 'nahi', 'karo', 'kar', 'mein'];
  return hindiPatterns.some(pattern => message.toLowerCase().includes(pattern));
}

function containsSlotQuery(message: string): boolean {
  const keywords = [
    /slot/i, /available/i, /timing/i, /book a court/i, 
    /reserve a court/i, /time available/i, /khali slot/i
  ];
  return keywords.some(keyword => keyword.test(message));
}

function containsBookingCreationQuery(message: string): boolean {
  const keywords = [
    /book now/i, /confirm booking/i, /pay for slot/i, 
    /reserve court/i, /make payment/i, /proceed to pay/i
  ];
  return keywords.some(keyword => keyword.test(message));
}

function errorResponse(message: string) {
  return new Response(
    JSON.stringify({ 
      message: { 
        role: "assistant", 
        content: message 
      }
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}

// ================== EXISTING DATABASE FUNCTIONS ==================
// ... (include all your existing database functions exactly as they are)
// getUserBookings, getAvailableSlots, getAdminSummary, etc.
    // Define available functions
    const functions = [
      {
        name: "get_available_slots",
        description: "Get available slots for a specific venue, court, and date",
        parameters: {
          type: "object",
          properties: {
            venue_id: { type: "string", description: "UUID of the venue" },
            court_id: { type: "string", description: "UUID of the court (optional)" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" }
          },
          required: ["venue_id", "date"]
        }
      },
      {
        name: "get_user_bookings",
        description: "Get a summary of user's bookings (past and upcoming)",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of bookings to return" }
          },
          required: []
        }
      },
      {
        name: "get_court_availability",
        description: "Get detailed availability for a specific court on a date",
        parameters: {
          type: "object",
          properties: {
            court_id: { type: "string", description: "UUID of the court" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" }
          },
          required: ["court_id", "date"]
        }
      },
      {
        name: "recommend_courts",
        description: "Get court recommendations based on user preferences and history",
        parameters: {
          type: "object",
          properties: {
            sport_id: { type: "string", description: "UUID of the sport (optional)" }
          },
          required: []
        }
      },
      {
        name: "book_court",
        description: "Book a court for a specific date and time slot",
        parameters: {
          type: "object",
          properties: {
            court_id: { type: "string", description: "UUID of the court" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" },
            start_time: { type: "string", description: "Start time in HH:MM format" },
            end_time: { type: "string", description: "End time in HH:MM format" }
          },
          required: ["court_id", "date", "start_time", "end_time"]
        }
      }
    ];
    
    // Only include admin functions if the user has admin role
    if (role === 'admin' || role === 'super_admin') {
      functions.push({
        name: "admin_summary",
        description: "Get administrative summary for a venue (requires admin role)",
        parameters: {
          type: "object",
          properties: {
            venue_id: { type: "string", description: "UUID of the venue" }
          },
          required: ["venue_id"]
        }
      });
      
      functions.push({
        name: "get_venue_admins",
        description: "List users who can manage a venue (admin only)",
        parameters: {
          type: "object",
          properties: {
            venue_id: { type: "string", description: "UUID of the venue" }
          },
          required: ["venue_id"]
        }
      });
      
      functions.push({
        name: "get_bookings_by_date_range",
        description: "Get bookings within a date range for reporting (admin only)",
        parameters: {
          type: "object",
          properties: {
            start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
            venue_id: { type: "string", description: "UUID of the venue (optional)" }
          },
          required: ["start_date", "end_date"]
        }
      });
    }

    try {
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: completeMessages,
          temperature: 0.7,
          tools: functions.map(fn => ({ type: "function", function: fn })),
          tool_choice: "auto",
        }),
      });

      const data = await response.json();
      console.log("OpenAI API response:", JSON.stringify(data));
      
      // Check if the response contains a function call
      const responseMessage = data.choices[0].message;
      let result = { message: responseMessage };
      
      // If the model wants to call a function
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        // Execute the function
        const functionResult = await handleFunctionCall({
          name: functionName,
          arguments: functionArgs,
          userId: userId
        }, supabase);
        
        // Make a second call to OpenAI with the function result
        const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              ...completeMessages,
              responseMessage,
              {
                role: "function",
                name: functionName,
                content: JSON.stringify(functionResult)
              }
            ],
            temperature: 0.7
          }),
        });
        
        const secondData = await secondResponse.json();
        result = { 
          message: secondData.choices[0].message, 
          functionCall: {
            name: functionName,
            arguments: functionArgs,
            result: functionResult
          }
        };
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return new Response(
        JSON.stringify({ 
          message: { 
            role: "assistant", 
            content: "I'm having trouble connecting to my brain right now. Please try again in a moment." 
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200  // Return 200 even on API error to handle gracefully
        }
      );
    }
  } catch (error) {
    console.error("General error:", error);
    return new Response(JSON.stringify({ 
      message: { 
        role: "assistant", 
        content: "Sorry, I encountered an error processing your request. Please try again later." 
      }
    }), {
      status: 200,  // Return 200 for graceful handling
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleFunctionCall(functionCall: any, supabase: any) {
  const { name, arguments: args, userId } = functionCall;
  
  console.log(`Handling function call: ${name} with args:`, args);
  
  switch (name) {
    case "get_available_slots":
      return await getAvailableSlots(supabase, args.venue_id, args.court_id, args.date);
    case "get_user_bookings":
      // Important change: Use the userId from the auth context instead of requiring it as an argument
      return await getUserBookings(supabase, userId, args.limit || 10);
    case "admin_summary":
      return await getAdminSummary(supabase, args.venue_id);
    case "get_court_availability":
      return await getCourtAvailability(supabase, args.court_id, args.date);
    case "recommend_courts":
      return await recommendCourts(supabase, userId, args.sport_id);
    case "get_venue_admins":
      return await getVenueAdmins(supabase, args.venue_id);
    case "get_bookings_by_date_range":
      return await getBookingsByDateRange(supabase, args.start_date, args.end_date, args.venue_id);
    case "book_court":
      return await bookCourt(supabase, userId, args.court_id, args.date, args.start_time, args.end_time);
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

async function getUserBookings(supabase: any, user_id: string, limit: number = 10) {
  if (!user_id) {
    return { 
      success: false, 
      message: "User is not authenticated. Please log in to view your bookings." 
    };
  }

  try {
    console.log("Fetching bookings for user:", user_id);
    
    // First, retrieve user information to personalize the response
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .limit(1);
    
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
    }
    
    const userName = profileData && profileData.length > 0 ? profileData[0].full_name : "User";
    
    // Get upcoming bookings
    const { data: upcomingBookings, error: upcomingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        total_price,
        payment_status,
        court:courts (
          id,
          name,
          venue:venues (
            id,
            name
          ),
          sport:sports (
            id,
            name
          )
        )
      `)
      .eq('user_id', user_id)
      .in('status', ['confirmed', 'pending'])
      .gte('booking_date', new Date().toISOString().split('T')[0])
      .order('booking_date', { ascending: true })
      .limit(limit);
    
    if (upcomingError) throw upcomingError;
    
    // Get past bookings
    const { data: pastBookings, error: pastError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        total_price,
        payment_status,
        court:courts (
          id,
          name,
          venue:venues (
            id,
            name
          ),
          sport:sports (
            id,
            name
          )
        )
      `)
      .eq('user_id', user_id)
      .or('status.eq.completed,status.eq.cancelled')
      .lt('booking_date', new Date().toISOString().split('T')[0])
      .order('booking_date', { ascending: false })
      .limit(limit);
    
    if (pastError) throw pastError;
    
    return {
      success: true,
      user_name: userName,
      upcoming: upcomingBookings || [],
      past: pastBookings || []
    };
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    return { 
      success: false, 
      message: "Failed to fetch user bookings", 
      error: error.message 
    };
  }
}

// Function implementations
async function getAvailableSlots(supabase: any, venue_id: string, court_id: string | undefined, date: string) {
  try {
    let query;
    
    if (court_id) {
      // If court_id is provided, get slots for that specific court
      const { data, error } = await supabase
        .from('courts')
        .select(`
          id,
          name,
          venue:venues (
            id,
            name
          ),
          sport:sports (
            id,
            name
          )
        `)
        .eq('id', court_id);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { success: false, message: "Court not found" };
      }
      
      const { data: slots, error: slotsError } = await supabase
        .rpc('get_available_slots', {
          p_court_id: court_id,
          p_date: date
        });
      
      if (slotsError) throw slotsError;
      
      return {
        success: true,
        court: data[0],
        date: date,
        slots: slots || []
      };
    } else {
      // If only venue_id is provided, get available slots for all courts in the venue
      const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select(`
          id,
          name,
          sport:sports (
            id,
            name
          )
        `)
        .eq('venue_id', venue_id)
        .eq('is_active', true);
      
      if (courtsError) throw courtsError;
      
      if (!courts || courts.length === 0) {
        return { success: false, message: "No courts found for this venue" };
      }
      
      // Get venue details
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('id, name')
        .eq('id', venue_id)
        .limit(1);
      
      if (venueError) throw venueError;
      
      const allSlots = [];
      
      // For each court, get available slots
      for (const court of courts) {
        const { data: slots, error: slotsError } = await supabase
          .rpc('get_available_slots', {
            p_court_id: court.id,
            p_date: date
          });
        
        if (slotsError) throw slotsError;
        
        // Add available slots to result
        if (slots && slots.length > 0) {
          const availableSlots = slots.filter((slot: any) => slot.is_available);
          if (availableSlots.length > 0) {
            allSlots.push({
              court_id: court.id,
              court_name: court.name,
              sport_name: court.sport.name,
              slots: availableSlots
            });
          }
        }
      }
      
      return {
        success: true,
        venue: venue && venue.length > 0 ? venue[0] : null,
        date: date,
        courts_with_slots: allSlots
      };
    }
  } catch (error) {
    console.error("Error in getAvailableSlots:", error);
    return { success: false, message: "Failed to fetch available slots", error: error.message };
  }
}

async function getAdminSummary(supabase: any, venue_id: string) {
  try {
    // Get total bookings for the venue
    const { data: bookingsCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('id', { count: true })
      .eq('court.venue_id', venue_id);
    
    if (bookingsError) throw bookingsError;
    
    // Get total revenue
    const { data: revenue, error: revenueError } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('court.venue_id', venue_id)
      .eq('payment_status', 'completed');
    
    if (revenueError) throw revenueError;
    
    const totalRevenue = revenue ? revenue.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0) : 0;
    
    // Get upcoming bookings
    const { data: upcomingBookings, error: upcomingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        court:courts (
          id,
          name
        )
      `)
      .eq('court.venue_id', venue_id)
      .in('status', ['confirmed', 'pending'])
      .gte('booking_date', new Date().toISOString().split('T')[0])
      .order('booking_date', { ascending: true })
      .limit(10);
    
    if (upcomingError) throw upcomingError;
    
    // Get most active courts
    const { data: activeCourts, error: courtsError } = await supabase
      .from('bookings')
      .select(`
        court_id,
        court:courts (
          id,
          name
        ),
        count
      `)
      .eq('court.venue_id', venue_id)
      .group('court_id, court.id, court.name')
      .order('count', { ascending: false })
      .limit(5);
    
    if (courtsError) throw courtsError;
    
    return {
      success: true,
      total_bookings: bookingsCount?.length || 0,
      total_revenue: totalRevenue,
      upcoming_bookings: upcomingBookings || [],
      active_courts: activeCourts || []
    };
  } catch (error) {
    console.error("Error in getAdminSummary:", error);
    return { success: false, message: "Failed to fetch admin summary", error: error.message };
  }
}

async function getCourtAvailability(supabase: any, court_id: string, date: string) {
  try {
    // Get court details
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select(`
        id,
        name,
        venue:venues (
          id,
          name
        ),
        sport:sports (
          id,
          name
        ),
        hourly_rate
      `)
      .eq('id', court_id)
      .limit(1);
    
    if (courtError) throw courtError;
    
    if (!court || court.length === 0) {
      return { success: false, message: "Court not found" };
    }
    
    // Get template slots for the day
    const { data: slots, error: slotsError } = await supabase
      .rpc('get_available_slots', {
        p_court_id: court_id,
        p_date: date
      });
    
    if (slotsError) throw slotsError;
    
    // Get existing bookings for the court on the date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status
      `)
      .eq('court_id', court_id)
      .eq('booking_date', date)
      .in('status', ['confirmed', 'pending']);
    
    if (bookingsError) throw bookingsError;
    
    return {
      success: true,
      court: court[0],
      date,
      availability: slots || [],
      bookings: bookings || []
    };
  } catch (error) {
    console.error("Error in getCourtAvailability:", error);
    return { success: false, message: "Failed to fetch court availability", error: error.message };
  }
}

async function recommendCourts(supabase: any, user_id: string, sport_id?: string) {
  try {
    // Get user's booking history to determine preferences
    const { data: bookingHistory, error: historyError } = await supabase
      .from('bookings')
      .select(`
        court:courts (
          id,
          name,
          venue_id,
          sport_id,
          venue:venues (
            id,
            name,
            location
          ),
          sport:sports (
            id,
            name
          )
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (historyError) throw historyError;
    
    // Get user's profile for location preferences
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .limit(1);
    
    if (profileError) throw profileError;
    
    // Build query for recommended courts
    let query = supabase
      .from('courts')
      .select(`
        id,
        name,
        hourly_rate,
        venue:venues (
          id,
          name,
          location,
          rating
        ),
        sport:sports (
          id,
          name
        )
      `)
      .eq('is_active', true);
    
    // Apply sport filter if provided
    if (sport_id) {
      query = query.eq('sport_id', sport_id);
    }
    
    // Get recommended courts
    const { data: courts, error: courtsError } = await query
      .order('venue.rating', { ascending: false })
      .limit(5);
    
    if (courtsError) throw courtsError;
    
    // Analyze user preferences
    const sportPreferences = new Map();
    const venuePreferences = new Map();
    
    if (bookingHistory) {
      bookingHistory.forEach((booking: any) => {
        const court = booking.court;
        if (court) {
          // Count sport preferences
          if (court.sport_id) {
            sportPreferences.set(
              court.sport_id, 
              (sportPreferences.get(court.sport_id) || 0) + 1
            );
          }
          
          // Count venue preferences
          if (court.venue_id) {
            venuePreferences.set(
              court.venue_id, 
              (venuePreferences.get(court.venue_id) || 0) + 1
            );
          }
        }
      });
    }
    
    // Convert Maps to arrays and sort by count
    const topSports = [...sportPreferences.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }));
      
    const topVenues = [...venuePreferences.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }));
    
    return {
      success: true,
      recommended_courts: courts || [],
      preferences: {
        top_sports: topSports.slice(0, 3),
        top_venues: topVenues.slice(0, 3),
      }
    };
  } catch (error) {
    console.error("Error in recommendCourts:", error);
    return { success: false, message: "Failed to generate court recommendations", error: error.message };
  }
}

async function getVenueAdmins(supabase: any, venue_id: string) {
  try {
    // Get venue admins
    const { data: admins, error: adminsError } = await supabase
      .from('venue_admins')
      .select(`
        id,
        admin:profiles!user_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('venue_id', venue_id);
    
    if (adminsError) throw adminsError;
    
    // Get venue details
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name')
      .eq('id', venue_id)
      .limit(1);
    
    if (venueError) throw venueError;
    
    return {
      success: true,
      venue: venue && venue.length > 0 ? venue[0] : null,
      admins: admins ? admins.map((admin: any) => admin.admin) : []
    };
  } catch (error) {
    console.error("Error in getVenueAdmins:", error);
    return { success: false, message: "Failed to fetch venue admins", error: error.message };
  }
}

async function getBookingsByDateRange(supabase: any, start_date: string, end_date: string, venue_id?: string) {
  try {
    // Build query for bookings in date range
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        status,
        payment_status,
        total_price,
        user:profiles!user_id (
          id,
          full_name,
          phone
        ),
        court:courts (
          id,
          name,
          venue:venues (
            id,
            name
          ),
          sport:sports (
            id,
            name
          )
        )
      `)
      .gte('booking_date', start_date)
      .lte('booking_date', end_date);
    
    // Apply venue filter if provided
    if (venue_id) {
      query = query.eq('court.venue_id', venue_id);
    }
    
    // Get bookings
    const { data, error } = await query
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    
    // Calculate summary statistics
    let totalBookings = data ? data.length : 0;
    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let totalRevenue = 0;
    
    if (data) {
      data.forEach((booking: any) => {
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          confirmedBookings++;
        } else if (booking.status === 'cancelled') {
          cancelledBookings++;
        }
        
        if (booking.payment_status === 'completed' && booking.total_price) {
          totalRevenue += parseFloat(booking.total_price);
        }
      });
    }
    
    return {
      success: true,
      start_date,
      end_date,
      venue_id,
      bookings: data || [],
      summary: {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        cancelled_bookings: cancelledBookings,
        total_revenue: totalRevenue.toFixed(2)
      }
    };
  } catch (error) {
    console.error("Error in getBookingsByDateRange:", error);
    return { success: false, message: "Failed to fetch bookings by date range", error: error.message };
  }
}

// New function to handle booking a court through AI
async function bookCourt(supabase: any, userId: string, courtId: string, date: string, startTime: string, endTime: string) {
  try {
    // Check if the slot is available
    const { data: availabilityData, error: availabilityError } = await supabase
      .rpc('get_available_slots', {
        p_court_id: courtId,
        p_date: date
      });
    
    if (availabilityError) throw availabilityError;
    
    // Find the requested slot in available slots
    const requestedSlot = availabilityData?.find((slot: any) => 
      slot.start_time === startTime && 
      slot.end_time === endTime
    );
    
    if (!requestedSlot || !requestedSlot.is_available) {
      return {
        success: false,
        message: "The requested time slot is not available. Please choose another time."
      };
    }
    
    // Get court details for pricing
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('id, name, hourly_rate, venue:venues(id, name)')
      .eq('id', courtId)
      .single();
    
    if (courtError) throw courtError;
    
    // Calculate price based on time difference
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const hours = (endMinutes - startMinutes) / 60;
    const totalPrice = hours * court.hourly_rate;
    
    // Create booking using the database function
    const { data: bookingId, error: bookingError } = await supabase
      .rpc('create_booking_with_lock', {
        p_court_id: courtId,
        p_user_id: userId,
        p_booking_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
        p_total_price: totalPrice
      });
    
    if (bookingError) throw bookingError;
    
    return {
      success: true,
      booking_id: bookingId,
      court_name: court.name,
      venue_name: court.venue?.name,
      date: date,
      start_time: startTime,
      end_time: endTime,
      total_price: totalPrice
    };
  } catch (error) {
    console.error("Error in bookCourt:", error);
    return { 
      success: false, 
      message: "Failed to book the court. " + (error.message || "Please try again later.")
    };
  }
}
