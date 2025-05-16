import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// System prompt to define the assistant's behavior and limitations
const SYSTEM_PROMPT = `
You are Grid2Play's expert sports slot booking assistant.

You have full permission to access the backend database and can call any function needed to answer user queries accurately and reliably.

You already know who the user is. Never ask for user ID, email, or any personal information. Always use the authenticated user information provided by the system.

You must understand and respond in both English and Hinglish (Hindi-English mix). If the user speaks in Hinglish, reply in Hinglish. Otherwise, reply in English.

Only answer questions related to sports slot booking, venue details, sports, amenities, booking management, or platform features (including Challenge Mode) on Grid2Play.

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
- Explaining new or upcoming features (e.g., Challenge Mode)
- Telling users the status of Challenge Mode if they ask about it

IMPORTANT: Use only the real data provided to you through the system. Do not make up venues, bookings or other information.
When responding about bookings, venues, sports, or features, ONLY reference the actual database information provided to you.
NEVER reference fictional venues like "ABC Sports Complex", "XYZ Ground", or other venues that aren't in the user's actual database.
`;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Main handler for the edge function
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found");
      return new Response(JSON.stringify({
        message: {
          role: "assistant",
          content: "I'm currently unavailable. Please contact the administrator to set up my integration."
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse request body
    const requestBody = await req.json();
    const { messages = [], userId = null } = requestBody;
    // Check if user is authenticated
    if (!userId) {
      console.log("User not authenticated");
      return new Response(JSON.stringify({
        message: {
          role: "assistant",
          content: "Please sign in to use booking features. कृपया साइन इन करें।"
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Processing request for user: ${userId}`);
    // Get user info to personalize responses
    const { data: userProfile, error: userError } = await supabase.from('profiles').select('full_name, email, phone').eq('id', userId).single();
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
        let bookingInfo;
        if (await isVenueAdmin(userId)) {
          const adminVenueIds = await getAdminVenueIds(userId);
          // Fetch venue names for these IDs
          let venueNames = [];
          let venuesData = [];
          if (adminVenueIds.length > 0) {
            const { data, error } = await supabase.from('venues').select('id, name').in('id', adminVenueIds);
            if (!error && data) {
              venueNames = data.map((v)=>v.name);
              venuesData = data;
            }
          }
          // Extract venue name from user message
          const requestedVenueName = extractVenueName(messages[messages.length - 1]?.content || "", venueNames);
          let filteredVenueIds = adminVenueIds;
          if (requestedVenueName) {
            // Use case-insensitive, partial match
            const venueObj = venuesData.find((v)=>requestedVenueName && v.name.toLowerCase().includes(requestedVenueName.toLowerCase()));
            if (venueObj) filteredVenueIds = [
              venueObj.id
            ];
          }
          // Extract date from user message
          const filterDate = extractDateFromMessage(messages[messages.length - 1]?.content || "");
          completeMessages.unshift({
            role: "system",
            content: `The current user is a venue admin for venues: ${venueNames.join(", ")} (IDs: ${adminVenueIds.join(", ")}). Only show bookings for these venues when asked for bookings.`
          });
          bookingInfo = await getAdminBookings(userId, filteredVenueIds, filterDate);
        } else {
          bookingInfo = await getUserBookings(userId);
        }
        if (bookingInfo && bookingInfo.success) {
          // Add booking information as a system message so the AI has context
          completeMessages.push({
            role: "system",
            content: `User has ${bookingInfo.upcoming.length} upcoming bookings and ${bookingInfo.past.length} past bookings. \n\nUpcoming bookings details: ${JSON.stringify(bookingInfo.upcoming)}\n\nPast bookings details: ${JSON.stringify(bookingInfo.past)}`
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
    // Check for support/help/faq/privacy/contact queries
    if (containsSupportQuery(messages[messages.length - 1]?.content || "")) {
      const supportMsg = isHinglish ? "Aapko madad, FAQ, Privacy Policy ya Contact ki zarurat hai? Kripya Homepage ke Support section mein navigate karein. (For help, FAQ, privacy policy, or contact, please navigate to the Support section on the Homepage.)" : "For Help Center, FAQ, Privacy Policy, or Contact options, please navigate to the Support section on the Homepage.";
      return new Response(JSON.stringify({
        message: {
          role: "assistant",
          content: supportMsg
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check for venue admin/owner contact queries
    if (containsVenueAdminContactQuery(messages[messages.length - 1]?.content || "")) {
      const venueAdminMsg = isHinglish ? 'Aap venue ke admin/owner se seedha baat kar sakte hain "Chat with Venue" option se, jo Book Now button ke neeche Venue details page par hai. Ya phir, Venue details page par diye gaye contact number par call kar sakte hain. (You can chat directly using the "Chat with Venue" option below the Book Now button in the Venue details page, or you can call them using the contact details provided in the Venue details page.)' : 'You can chat directly using the "Chat with Venue" option below the Book Now button in the Venue details page, or you can call them using the contact details provided in the Venue details page.';
      return new Response(JSON.stringify({
        message: {
          role: "assistant",
          content: venueAdminMsg
        }
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log("Sending request to OpenAI");
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: completeMessages,
        temperature: 0.7
      })
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
    return new Response(JSON.stringify({
      message: assistantResponse
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error in chat-assistant function:", error);
    return new Response(JSON.stringify({
      message: {
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please try again later."
      },
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200 // Return 200 for graceful error handling on the frontend
    });
  }
});
// Helper function to detect if message is in Hinglish
function detectHinglish(message) {
  // Common Hindi words and patterns
  const hindiPatterns = [
    /kya/i,
    /hai/i,
    /kaise/i,
    /mein/i,
    /hum/i,
    /aap/i,
    /main/i,
    /nahi/i,
    /karenge/i,
    /milega/i,
    /chahiye/i,
    /kitna/i,
    /kab/i,
    /kaisa/i
  ];
  // Check if message contains any Hindi patterns
  return hindiPatterns.some((pattern)=>pattern.test(message));
}
// Helper function to identify booking-related queries
function containsBookingQuery(message) {
  const bookingKeywords = [
    /book/i,
    /booking/i,
    /slot/i,
    /reserve/i,
    /court/i,
    /time/i,
    /schedule/i,
    /appointment/i,
    /reservation/i,
    /meri booking/i,
    /admin bookings?/i,
    /venue bookings?/i,
    /show me all bookings/i
  ];
  return bookingKeywords.some((keyword)=>keyword.test(message));
}
// Helper function to identify venue-related queries
function containsVenueQuery(message) {
  const venueKeywords = [
    /venue/i,
    /place/i,
    /ground/i,
    /court/i,
    /stadium/i,
    /arena/i,
    /location/i,
    /center/i,
    /centre/i,
    /where/i,
    /facility/i
  ];
  return venueKeywords.some((keyword)=>keyword.test(message));
}
// Helper function to identify sport-related queries
function containsSportQuery(message) {
  const sportKeywords = [
    /sport/i,
    /game/i,
    /play/i,
    /cricket/i,
    /football/i,
    /soccer/i,
    /basketball/i,
    /tennis/i,
    /badminton/i,
    /volleyball/i,
    /activity/i
  ];
  return sportKeywords.some((keyword)=>keyword.test(message));
}
// Helper function to detect challenge mode queries
function containsChallengeModeQuery(message) {
  if (!message) return false;
  const challengeKeywords = [
    /challenge mode/i,
    /challenge feature/i,
    /challenge section/i,
    /challenge kya hai/i,
    /challenge/i
  ];
  return challengeKeywords.some((pattern)=>pattern.test(message));
}
// Helper function to identify help/support/faq/privacy/contact queries
function containsSupportQuery(message) {
  if (!message) return false;
  const supportKeywords = [
    /help(\s|$)/i,
    /support(\s|$)/i,
    /faq(\s|$)/i,
    /frequently asked questions/i,
    /privacy(\s|$)/i,
    /privacy policy/i,
    /contact(\s|$)/i,
    /contact us/i,
    /samarthan/i,
    /madad/i,
    /sahayata/i,
    /niyam/i,
    /raabta/i,
    /kaise sampark kare/i,
    /kaise madad milegi/i,
    /kaise support milega/i,
    /kaise faq dekhu/i,
    /kaise privacy policy dekhu/i // How to see privacy policy
  ];
  return supportKeywords.some((pattern)=>pattern.test(message));
}
// Helper function to detect venue admin/owner contact queries
function containsVenueAdminContactQuery(message) {
  if (!message) return false;
  const patterns = [
    /contact.*(venue|ground|court).*(admin|owner|manager|incharge|person)/i,
    /how.*contact.*(venue|ground|court).*(admin|owner|manager|incharge|person)/i,
    /venue.*admin.*contact/i,
    /venue.*owner.*contact/i,
    /admin.*kaise/i,
    /owner.*kaise/i,
    /venue.*kaise contact/i,
    /kaise contact karu.*admin/i,
    /kaise baat karu.*admin/i,
    /venue.*admin.*baat/i,
    /venue.*admin.*message/i,
    /venue.*admin.*call/i,
    /venue.*owner.*baat/i,
    /venue.*owner.*call/i
  ];
  return patterns.some((pattern)=>pattern.test(message));
}
// Helper: Extract venue name from message
function extractVenueName(message, venueNames) {
  const lowerMsg = message.toLowerCase();
  return venueNames.find((name)=>lowerMsg.includes(name.toLowerCase()));
}
// Helper: Extract date from message (supports 'today', 'tomorrow', and formats like 'may 16')
function extractDateFromMessage(message) {
  const lowerMsg = message.toLowerCase();
  const today = new Date();
  if (lowerMsg.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  if (lowerMsg.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  // Match formats like "may 16"
  const dateMatch = lowerMsg.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i);
  if (dateMatch) {
    const year = today.getFullYear();
    const dateStr = `${dateMatch[0]} ${year}`;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed)) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return null;
}
// Function to get user bookings using Supabase client
async function getUserBookings(userId) {
  try {
    console.log("Fetching bookings for user:", userId);
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    // Get upcoming bookings with venue and court details
    const { data: upcomingBookings, error: upcomingError } = await supabase.from('bookings').select(`
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
      `).eq('user_id', userId).gte('booking_date', today).order('booking_date', {
      ascending: true
    }).limit(5);
    if (upcomingError) throw upcomingError;
    // Get past bookings with venue and court details
    const { data: pastBookings, error: pastError } = await supabase.from('bookings').select(`
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
      `).eq('user_id', userId).lt('booking_date', today).order('booking_date', {
      ascending: false
    }).limit(5);
    if (pastError) throw pastError;
    // Format bookings for better readability in assistant responses
    const formattedUpcoming = upcomingBookings?.map((booking)=>({
        date: booking.booking_date,
        time: `${booking.start_time} - ${booking.end_time}`,
        court: booking.courts?.name || 'Unknown court',
        venue: booking.courts?.venues?.name || 'Unknown venue',
        sport: booking.courts?.sports?.name || 'Unknown sport',
        status: booking.status,
        price: booking.total_price
      })) || [];
    const formattedPast = pastBookings?.map((booking)=>({
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
    return {
      success: false,
      error: error.message
    };
  }
}
// Function to get venues using Supabase client
async function getVenues() {
  try {
    const { data: venues, error } = await supabase.from('venues').select(`
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
      `).eq('is_active', true).order('name', {
      ascending: true
    });
    if (error) throw error;
    // Format venues for better readability
    const formattedVenues = venues?.map((venue)=>{
      // Extract unique sports from this venue
      const uniqueSports = new Set();
      venue.sports?.forEach((court)=>{
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
    return {
      success: false,
      error: error.message
    };
  }
}
// Function to get sports using Supabase client
async function getSports() {
  try {
    const { data: sports, error } = await supabase.from('sports').select(`
        id,
        name,
        description
      `).eq('is_active', true).order('name', {
      ascending: true
    });
    if (error) throw error;
    return {
      success: true,
      sports: sports
    };
  } catch (error) {
    console.error("Error in getSports:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
// Helper: Get venue IDs for which the user is an admin
async function getAdminVenueIds(userId) {
  const { data, error } = await supabase.from('venue_admins').select('venue_id').eq('user_id', userId);
  if (error) throw error;
  return data?.map((v)=>v.venue_id) || [];
}
// Helper: Check if user is an admin (has venues assigned)
async function isVenueAdmin(userId) {
  const venueIds = await getAdminVenueIds(userId);
  return venueIds.length > 0;
}
// Helper: Get all court IDs for a venue, grouped by court_group_id
async function getCourtIdsByGroupForVenue(venueId) {
  const { data: courts, error } = await supabase.from('courts').select('id, court_group_id').eq('venue_id', venueId).eq('is_active', true);
  if (error) throw error;
  // Group court IDs by court_group_id (null means not grouped)
  const groupMap = new Map();
  for (const court of courts){
    const groupId = court.court_group_id || court.id;
    if (!groupMap.has(groupId)) groupMap.set(groupId, []);
    groupMap.get(groupId).push(court.id);
  }
  return groupMap;
}
// Update getAdminBookings to aggregate by court_group_id
async function getAdminBookings(userId, filteredVenueIds = null, filterDate = null) {
  const venueIds = filteredVenueIds || await getAdminVenueIds(userId);
  if (!venueIds.length) return {
    success: true,
    upcoming: [],
    past: []
  };
  let allBookings = [];
  for (const venueId of venueIds){
    const groupMap = await getCourtIdsByGroupForVenue(venueId);
    for (const [groupId, courtIds] of groupMap.entries()){
      let query = supabase.from('bookings').select(`
          id, booking_date, start_time, end_time, total_price, status,
          courts:court_id (
            id, name, venue_id, venues:venue_id (id, name, location), sports:sport_id (id, name), court_group_id
          )
        `).in('court_id', courtIds).order('booking_date', {
        ascending: true
      });
      if (filterDate) {
        query = query.eq('booking_date', filterDate);
      }
      const { data: bookings, error } = await query;
      if (error) throw error;
      // For each group, only include unique bookings by time slot (avoid double-counting)
      // (Assume no overlapping bookings for the same group and time slot due to your triggers)
      allBookings.push(...bookings || []);
    }
  }
  // Format bookings for assistant
  const formatted = allBookings.map((booking)=>({
      date: booking.booking_date,
      time: `${booking.start_time} - ${booking.end_time}`,
      court: booking.courts?.name || 'Unknown court',
      venue: booking.courts?.venues?.name || 'Unknown venue',
      sport: booking.courts?.sports?.name || 'Unknown sport',
      status: booking.status,
      price: booking.total_price
    }));
  // Split into upcoming and past based on today
  const today = new Date().toISOString().split('T')[0];
  let upcoming = [], past = [];
  if (filterDate) {
    // If filtering by date, treat all as upcoming for that date
    upcoming = formatted;
  } else {
    upcoming = formatted.filter((b)=>b.date >= today);
    past = formatted.filter((b)=>b.date < today);
  }
  return {
    success: true,
    upcoming,
    past
  };
}
