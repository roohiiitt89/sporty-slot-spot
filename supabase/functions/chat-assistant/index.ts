
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt to define the assistant's behavior and limitations
const SYSTEM_PROMPT = `
You are Grid2Play's expert sports slot booking assistant.

You have full permission to access the backend database and can call any function needed to answer user queries accurately and reliably.

You already know who the user is. Never ask for user ID, email, or any personal information. Always use the authenticated user information provided by the system.

You must understand and respond in both English and Hinglish (Hindi-English mix). If the user speaks in Hinglish, reply in Hinglish. Otherwise, reply in English.

Only answer questions related to sports slot booking, venue details, sports, amenities, or booking management on Grid2Play.

If a user asks something off-topic, politely say:
"Sorry, main sirf sports slot booking mein madad kar sakta hoon. (I can only help with sports slot booking on Grid2Play.)"

Always be positive, clear, and helpful. If you encounter an error or missing information, apologize and suggest the user try again or contact support.

Examples of what you can help with:
- Finding available slots
- Booking a court or field
- Viewing, canceling, or modifying bookings
- Recommending venues or sports
- Explaining venue rules or amenities
- Providing payment or booking status

IMPORTANT: Use only the real data provided to you through the system. Do not make up venues, bookings or other information.
When responding about bookings, venues, and sports, ONLY reference the actual database information provided to you.
NEVER reference fictional venues like "ABC Sports Complex", "XYZ Ground", or other venues that aren't in the user's actual database.
`;

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found");
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

    // Parse request body
    const requestBody = await req.json();
    const { messages = [], userId = null } = requestBody;
    
    // Check if user is authenticated
    if (!userId) {
      console.log("User not authenticated");
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

    console.log(`Processing request for user: ${userId}`);
    
    // Get user info to personalize responses
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
    }

    const userName = userProfile?.full_name || "User";
    
    // Check if the message is in Hinglish to respond appropriately
    const isHinglish = detectHinglish(messages[messages.length - 1]?.content || "");
    
    // Prepare complete message history with system prompt
    const completeMessages = [
      { 
        role: "system", 
        content: SYSTEM_PROMPT + `\nThe current user's name is ${userName}.` 
      },
      ...messages
    ];
    
    // Special handling for booking-related queries
    if (containsBookingQuery(messages[messages.length - 1]?.content || "")) {
      try {
        const bookingInfo = await getUserBookings(userId);
        
        if (bookingInfo && bookingInfo.success) {
          // Add booking information as a system message so the AI has context
          completeMessages.push({
            role: "system",
            content: `User has ${bookingInfo.upcoming.length} upcoming bookings and ${bookingInfo.past.length} past bookings. 
            
            Upcoming bookings details: ${JSON.stringify(bookingInfo.upcoming)}
            
            Past bookings details: ${JSON.stringify(bookingInfo.past)}`
          });
        }
      } catch (error) {
        console.error("Error getting booking information:", error);
      }
    }
    
    // Get venue information for venue-related queries
    if (containsVenueQuery(messages[messages.length - 1]?.content || "")) {
      try {
        const venuesInfo = await getVenues();
        if (venuesInfo && venuesInfo.success) {
          completeMessages.push({
            role: "system",
            content: `Available venues: ${JSON.stringify(venuesInfo.venues)}`
          });
        }
      } catch (error) {
        console.error("Error getting venue information:", error);
      }
    }
    
    // Get sport information for sport-related queries
    if (containsSportQuery(messages[messages.length - 1]?.content || "")) {
      try {
        const sportsInfo = await getSports();
        if (sportsInfo && sportsInfo.success) {
          completeMessages.push({
            role: "system",
            content: `Available sports: ${JSON.stringify(sportsInfo.sports)}`
          });
        }
      } catch (error) {
        console.error("Error getting sports information:", error);
      }
    }

    console.log("Sending request to OpenAI");
    
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    
    // Check if we have a valid response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenAI");
    }
    
    const assistantResponse = data.choices[0].message;
    
    console.log("Received response from OpenAI");
    
    return new Response(
      JSON.stringify({ message: assistantResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in chat-assistant function:", error);
    
    return new Response(
      JSON.stringify({ 
        message: { 
          role: "assistant", 
          content: "Sorry, I encountered an error while processing your request. Please try again later." 
        },
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Return 200 for graceful error handling on the frontend
      }
    );
  }
});

// Helper function to detect if message is in Hinglish
function detectHinglish(message: string): boolean {
  // Common Hindi words and patterns
  const hindiPatterns = [
    /kya/i, /hai/i, /kaise/i, /mein/i, /hum/i, /aap/i, /main/i, /nahi/i, 
    /karenge/i, /milega/i, /chahiye/i, /kitna/i, /kab/i, /kaisa/i
  ];
  
  // Check if message contains any Hindi patterns
  return hindiPatterns.some(pattern => pattern.test(message));
}

// Helper function to identify booking-related queries
function containsBookingQuery(message: string): boolean {
  const bookingKeywords = [
    /book/i, /booking/i, /slot/i, /reserve/i, /court/i, /time/i, 
    /schedule/i, /appointment/i, /reservation/i, /meri booking/i
  ];
  
  return bookingKeywords.some(keyword => keyword.test(message));
}

// Helper function to identify venue-related queries
function containsVenueQuery(message: string): boolean {
  const venueKeywords = [
    /venue/i, /place/i, /ground/i, /court/i, /stadium/i, /arena/i,
    /location/i, /center/i, /centre/i, /where/i, /facility/i
  ];
  
  return venueKeywords.some(keyword => keyword.test(message));
}

// Helper function to identify sport-related queries
function containsSportQuery(message: string): boolean {
  const sportKeywords = [
    /sport/i, /game/i, /play/i, /cricket/i, /football/i, /soccer/i,
    /basketball/i, /tennis/i, /badminton/i, /volleyball/i, /activity/i
  ];
  
  return sportKeywords.some(keyword => keyword.test(message));
}

// Function to get user bookings using Supabase client
async function getUserBookings(userId: string) {
  try {
    console.log("Fetching bookings for user:", userId);
    
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get upcoming bookings with venue and court details
    const { data: upcomingBookings, error: upcomingError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_price,
        status,
        courts:court_id (
          id,
          name,
          venue_id,
          venues:venue_id (
            id,
            name,
            location
          ),
          sports:sport_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .gte('booking_date', today)
      .order('booking_date', { ascending: true })
      .limit(5);
      
    if (upcomingError) throw upcomingError;
    
    // Get past bookings with venue and court details
    const { data: pastBookings, error: pastError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        end_time,
        total_price,
        status,
        courts:court_id (
          id,
          name,
          venue_id,
          venues:venue_id (
            id,
            name,
            location
          ),
          sports:sport_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .lt('booking_date', today)
      .order('booking_date', { ascending: false })
      .limit(5);
      
    if (pastError) throw pastError;
    
    // Format bookings for better readability in assistant responses
    const formattedUpcoming = upcomingBookings?.map(booking => ({
      date: booking.booking_date,
      time: `${booking.start_time} - ${booking.end_time}`,
      court: booking.courts?.name || 'Unknown court',
      venue: booking.courts?.venues?.name || 'Unknown venue',
      sport: booking.courts?.sports?.name || 'Unknown sport',
      status: booking.status,
      price: booking.total_price
    })) || [];
    
    const formattedPast = pastBookings?.map(booking => ({
      date: booking.booking_date,
      time: `${booking.start_time} - ${booking.end_time}`,
      court: booking.courts?.name || 'Unknown court',
      venue: booking.courts?.venues?.name || 'Unknown venue',
      sport: booking.courts?.sports?.name || 'Unknown sport',
      status: booking.status,
      price: booking.total_price
    })) || [];
    
    return {
      success: true,
      upcoming: formattedUpcoming,
      past: formattedPast
    };
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    return { success: false, error: error.message };
  }
}

// Function to get venues using Supabase client
async function getVenues() {
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select(`
        id,
        name,
        location,
        description,
        opening_hours,
        rating,
        sports:courts (
          sports:sport_id (
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });
      
    if (error) throw error;
    
    // Format venues for better readability
    const formattedVenues = venues?.map(venue => {
      // Extract unique sports from this venue
      const uniqueSports = new Set();
      venue.sports?.forEach(court => {
        if (court.sports?.name) {
          uniqueSports.add(court.sports.name);
        }
      });
      
      return {
        id: venue.id,
        name: venue.name,
        location: venue.location,
        description: venue.description,
        openingHours: venue.opening_hours,
        rating: venue.rating,
        sports: Array.from(uniqueSports)
      };
    }) || [];
    
    return {
      success: true,
      venues: formattedVenues
    };
  } catch (error) {
    console.error("Error in getVenues:", error);
    return { success: false, error: error.message };
  }
}

// Function to get sports using Supabase client
async function getSports() {
  try {
    const { data: sports, error } = await supabase
      .from('sports')
      .select(`
        id,
        name,
        description
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });
      
    if (error) throw error;
    
    return {
      success: true,
      sports: sports
    };
  } catch (error) {
    console.error("Error in getSports:", error);
    return { success: false, error: error.message };
  }
}
