import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract OpenAI API key from environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

// System prompt to restrict the scope of the assistant
const SYSTEM_PROMPT = `
You are a helpful assistant embedded in a sports slot booking website called Grid2Play. Your job is to help users with venue selection, slot availability, bookings, cancellations, payments, and recommendations for sports-related activities on this platform.

If the user asks anything unrelated to this platform (e.g., homework, coding help, chatting, etc.), politely say:
'Sorry, I can only help with sports slot booking queries on this site.' Do not answer off-topic queries.

Keep responses concise, focusing on helping users:
1. Find available slots at venues
2. Book courts for their preferred sports
3. Check their booking history
4. Get recommendations based on their preferences
5. Understand venue policies and amenities
6. Navigate payment options
7. Contact venue owners and staff

For venue contact queries:
- Always mention the chat option below the "Book Now" button on venue details page first
- If specific contact details (phone, hours) are available, include them
- If specific details are not available, direct users to find them on the venue details page
- Always maintain a helpful tone and provide alternative contact methods
- Include any additional venue information (location, rating, sports) if available

When handling contact queries:
1. First try to fetch venue-specific contact details
2. If specific details aren't available, provide the standard contact methods
3. Always mention the venue details page as a reliable source of information
4. Include any additional venue context that might be helpful

You can use functions to access real data from our database when needed.

IMPORTANT: You already know who the user is. DO NOT ask users for their user ID, email, or any identifying information.
Instead, use the authenticated user information already provided to this function.
`;

// Hindi-English mixed system prompt for bilingual responses
const HINGLISH_SYSTEM_PROMPT = `
${SYSTEM_PROMPT}

If the user writes in Hinglish (Hindi-English mix), please respond in Hinglish as well. 
Be friendly and conversational. Use phrases like:
- "Kya help chahiye aapko?" (What help do you need?)
- "Main check kar raha hoon" (I'm checking)
- "Yeh raha aapka booking details" (Here are your booking details)

Always maintain a polite and helpful tone in either language.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          message: { 
            role: "assistant", 
            content: "I'm currently unavailable. Please contact the administrator to set up my integration." 
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { messages, userId, role } = await req.json();
    
    // Check if user is authenticated
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          message: { 
            role: "assistant", 
            content: "Please sign in to use booking features. कृपया साइन इन करें।" 
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect language - check if the latest user message might be in Hinglish
    let selectedSystemPrompt = SYSTEM_PROMPT;
    if (messages && messages.length > 0) {
      const latestUserMsg = messages[messages.length - 1].content || '';
      
      // Very basic Hinglish detection (presence of common Hindi words/patterns)
      const hindiPatterns = ['kya', 'hai', 'main', 'mujhe', 'aap', 'kaise', 'nahi', 'karo', 'kar', 'mein'];
      const mightBeHinglish = hindiPatterns.some(pattern => 
        latestUserMsg.toLowerCase().includes(pattern)
      );
      
      if (mightBeHinglish) {
        selectedSystemPrompt = HINGLISH_SYSTEM_PROMPT;
      }
    }

    // Create Supabase client for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Prepare complete message history with system prompt
    const completeMessages = [
      { role: "system", content: selectedSystemPrompt },
      ...messages
    ];
    
    // Add user authentication context to the system message
    if (userId) {
      completeMessages.unshift({
        role: "system", 
        content: `The current user has user_id: ${userId}. Use this to fetch their data without asking them for it.`
      });
    }

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
      },
      {
        name: "get_venue_contact",
        description: "Get contact details and communication options for a specific venue",
        parameters: {
          type: "object",
          properties: {
            venue_name: { 
              type: "string", 
              description: "Name of the venue" 
            }
          },
          required: ["venue_name"]
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
    
    case "get_venue_contact":
      return await getVenueContact(supabase, args.venue_name);

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

    if (functionCall.name === "get_venue_contact") {
      const { venue_name } = functionCall.arguments;
      const { data: venue, error } = await supabase
        .from("venues")
        .select("name, location, contact_number, opening_hours")
        .ilike("name", `%${venue_name}%`)
        .limit(1)
        .maybeSingle();

      if (error || !venue) {
        return {
          content: `Sorry, I couldn't find contact details for "${venue_name}".`
        };
      }

      let reply = `You can chat with the "${venue.name}" venue owner directly within the site using the "Chat with Venue" feature.`;
      if (venue.contact_number) {
        reply += ` Or call the venue owner at ${venue.contact_number}.`;
      }
      if (venue.location) {
        reply += `\nLocation: ${venue.location}`;
      }
      if (venue.opening_hours) {
        reply += `\nOpening Hours: ${venue.opening_hours}`;
      }

      return { content: reply };
    }

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

async function getVenueContact(supabase: any, venue_name: string) {
  try {
    // Clean up the venue name for better matching
    const cleanVenueName = venue_name.trim().replace(/[\/\\]/g, ' ');
    
    const { data: venue, error } = await supabase
      .from('venues')
      .select(`
        id,
        name,
        contact_number,
        has_chat_support,
        business_hours,
        address,
        rating,
        sports:venue_sports(
          sport:sports(name)
        )
      `)
      .or(`name.ilike.%${cleanVenueName}%,name.ilike.%${venue_name}%`)
      .single();

    if (error) throw error;

    if (!venue) {
      return {
        message: `For venue "${venue_name}", you can contact them in two ways:\n\n` +
                "1. Use the chat option available below the 'Book Now' button on the venue details page\n" +
                "2. Check the contact number on the venue details page\n\n" +
                "All contact information is available on the venue details page for quick access."
      };
    }

    // Format sports list
    const sports = venue.sports
      ? venue.sports.map((s: any) => s.sport.name).join(', ')
      : 'Not specified';

    const contactMessage = `You can contact ${venue.name} in two ways:\n\n` +
      "1. Use the chat option available below the 'Book Now' button on the venue details page\n" +
      (venue.contact_number 
        ? `2. Call them at ${venue.contact_number}${venue.business_hours ? ` during business hours: ${venue.business_hours}` : ''}\n\n`
        : "2. Check the contact number on the venue details page\n\n"
      ) +
      "Additional Venue Information:\n" +
      `📍 Location: ${venue.address || 'Available on venue page'}\n` +
      (venue.rating ? `⭐ Rating: ${venue.rating}\n` : '') +
      `🎯 Sports Available: ${sports}\n\n` +
      "The venue details page has all contact information and is the quickest way to reach the venue staff.";

    return {
      message: contactMessage,
      venue_details: {
        name: venue.name,
        contact_number: venue.contact_number,
        has_chat_support: venue.has_chat_support,
        business_hours: venue.business_hours,
        address: venue.address,
        rating: venue.rating,
        sports: sports
      }
    };
  } catch (error) {
    console.error('Error fetching venue contact:', error);
    // Provide a helpful response even when there's an error
    return {
      message: `For venue "${venue_name}", you can contact them in two ways:\n\n` +
              "1. Use the chat option available below the 'Book Now' button on the venue details page\n" +
              "2. Check the contact number on the venue details page\n\n" +
              "All contact information is available on the venue details page for quick access."
    };
  }
}
