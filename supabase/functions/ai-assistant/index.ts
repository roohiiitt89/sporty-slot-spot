import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface Message {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

interface Venue {
  id: string;
  name: string;
  contact_number?: string;
  has_chat_support: boolean;
  business_hours?: string;
  address?: string;
  rating?: number;
  sports?: Array<{
    sport: {
      name: string;
    };
  }>;
}

interface VenueContactResponse {
  success: boolean;
  message: string;
  venue_details?: {
    name: string;
    contact_number?: string;
    has_chat_support: boolean;
    business_hours?: string;
    address?: string;
    rating?: number;
    sports: string;
  };
}

// Additional Types
interface Booking {
  id: string;
  venue_id: string;
  user_id: string;
  slot_date: string;
  slot_time: string;
  sport_id: string;
  status: string;
  venue?: Venue;
  sport?: {
    name: string;
  };
}

interface Sport {
  id: string;
  name: string;
  icon?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

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

IMPORTANT: For ANY venue contact related queries:
- ALWAYS use the get_venue_contact function first
- NEVER provide venue information without calling get_venue_contact
- If the venue name is mentioned, extract it and use get_venue_contact
- Format the response using the exact information returned by get_venue_contact
- Always mention both chat and phone options when available
- Include business hours if provided

When handling contact queries:
1. First try to fetch venue-specific contact details using get_venue_contact
2. Use the exact response from get_venue_contact function
3. Always mention the venue details page as a reliable source of information
4. Include any additional venue context that might be helpful

You can use functions to access real data from our database when needed.

IMPORTANT: You already know who the user is. DO NOT ask users for their user ID, email, or any identifying information.
Instead, use the authenticated user information already provided to this function.
`;

const HINGLISH_SYSTEM_PROMPT = `
${SYSTEM_PROMPT}

If the user writes in Hinglish (Hindi-English mix), please respond in Hinglish as well. 
Be friendly and conversational. Use phrases like:
- "Kya help chahiye aapko?" (What help do you need?)
- "Main check kar raha hoon" (I'm checking)
- "Yeh raha aapka booking details" (Here are your booking details)

Always maintain a polite and helpful tone in either language.
`;

// Function to handle venue contact information
async function getVenueContact(supabase: SupabaseClient, venue_name: string): Promise<VenueContactResponse> {
  try {
    // Clean up the venue name for better matching
    const cleanVenueName = venue_name.trim().replace(/[\/\\]/g, ' ').replace(/box/i, 'BOX');
    
    // First try exact match
    let { data: venues, error } = await supabase
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
      .or(`name.ilike.${cleanVenueName},name.ilike.%${cleanVenueName}%,name.ilike.%${venue_name}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching venue:', error);
      throw error;
    }

    // If no exact match found, try fuzzy match
    if (!venues || venues.length === 0) {
      const { data: fuzzyVenues, error: fuzzyError } = await supabase
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
        .textSearch('name', cleanVenueName, {
          type: 'websearch',
          config: 'english'
        });

      if (fuzzyError) throw fuzzyError;
      
      if (!fuzzyVenues || fuzzyVenues.length === 0) {
        return {
          success: false,
          message: `For venue "${venue_name}", you can contact them in two ways:\n\n` +
                  "1. Use the chat option available below the 'Book Now' button on the venue details page\n" +
                  "2. Check the contact number on the venue details page\n\n" +
                  "All contact information is available on the venue details page for quick access."
        };
      }
      
      venues = fuzzyVenues;
    }

    const venue = venues[0]; // Get the first matching venue

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
      success: true,
      message: contactMessage,
      venue_details: {
        name: venue.name,
        contact_number: venue.contact_number,
        has_chat_support: venue.has_chat_support,
        business_hours: venue.business_hours,
        address: venue.address,
        rating: venue.rating,
        sports
      }
    };
  } catch (error) {
    console.error('Error in getVenueContact:', error);
    return {
      success: false,
      message: `For venue "${venue_name}", you can contact them in two ways:\n\n` +
              "1. Use the chat option available below the 'Book Now' button on the venue details page\n" +
              "2. Check the contact number on the venue details page\n\n" +
              "All contact information is available on the venue details page for quick access."
    };
  }
}

// Function to get user's booking history
async function getUserBookings(supabase: SupabaseClient, userId: string): Promise<any> {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        venue:venues(*),
        sport:sports(*)
      `)
      .eq('user_id', userId)
      .order('slot_date', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      bookings: bookings || [],
      message: bookings && bookings.length > 0
        ? `Found ${bookings.length} bookings`
        : "No bookings found"
    };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return {
      success: false,
      message: "Failed to fetch booking history"
    };
  }
}

// Function to get venue information
async function getVenueInfo(supabase: SupabaseClient, venue_name: string): Promise<any> {
  try {
    const { data: venues, error } = await supabase
      .from('venues')
      .select(`
        *,
        sports:venue_sports(
          sport:sports(*)
        )
      `)
      .ilike('name', `%${venue_name}%`);

    if (error) throw error;

    return {
      success: true,
      venues: venues || [],
      message: venues && venues.length > 0
        ? `Found ${venues.length} matching venues`
        : "No venues found"
    };
  } catch (error) {
    console.error('Error fetching venue info:', error);
    return {
      success: false,
      message: "Failed to fetch venue information"
    };
  }
}

// Function to get available slots
async function getAvailableSlots(supabase: SupabaseClient, venue_id: string, date: string): Promise<any> {
  try {
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .eq('venue_id', venue_id)
      .eq('date', date)
      .eq('is_available', true);

    if (error) throw error;

    return {
      success: true,
      slots: slots || [],
      message: slots && slots.length > 0
        ? `Found ${slots.length} available slots`
        : "No available slots found for this date"
    };
  } catch (error) {
    console.error('Error fetching slots:', error);
    return {
      success: false,
      message: "Failed to fetch available slots"
    };
  }
}

// Function to get sports information
async function getSportsInfo(supabase: SupabaseClient): Promise<any> {
  try {
    const { data: sports, error } = await supabase
      .from('sports')
      .select('*');

    if (error) throw error;

    return {
      success: true,
      sports: sports || [],
      message: sports && sports.length > 0
        ? `Found ${sports.length} sports`
        : "No sports found"
    };
  } catch (error) {
    console.error('Error fetching sports:', error);
    return {
      success: false,
      message: "Failed to fetch sports information"
    };
  }
}

// Function to get nearby venues
async function getNearbyVenues(supabase: SupabaseClient, latitude: number, longitude: number, radius: number = 5): Promise<any> {
  try {
    // Using PostGIS to calculate distance and find nearby venues
    const { data: venues, error } = await supabase
      .rpc('get_venues_within_radius', {
        lat: latitude,
        lng: longitude,
        radius_km: radius
      });

    if (error) throw error;

    return {
      success: true,
      venues: venues || [],
      message: venues && venues.length > 0
        ? `Found ${venues.length} venues within ${radius}km`
        : "No venues found in this area"
    };
  } catch (error) {
    console.error('Error fetching nearby venues:', error);
    return {
      success: false,
      message: "Failed to fetch nearby venues"
    };
  }
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const { messages, userId } = await req.json();
    
    // Check if user is authenticated
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          message: { 
            role: "assistant", 
            content: "Please sign in to use the chat assistant. कृपया साइन इन करें।" 
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect language
    let selectedSystemPrompt = SYSTEM_PROMPT;
    if (messages && messages.length > 0) {
      const latestUserMsg = messages[messages.length - 1].content || '';
      const hindiPatterns = ['kya', 'hai', 'main', 'mujhe', 'aap', 'kaise', 'nahi', 'karo', 'kar', 'mein'];
      const mightBeHinglish = hindiPatterns.some(pattern => 
        latestUserMsg.toLowerCase().includes(pattern)
      );
      
      if (mightBeHinglish) {
        selectedSystemPrompt = HINGLISH_SYSTEM_PROMPT;
      }
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Prepare messages
    const completeMessages: Message[] = [
      { role: "system", content: selectedSystemPrompt },
      ...messages
    ];

    // Add user context
    completeMessages.unshift({
      role: "system",
      content: `The current user has user_id: ${userId}. Use this to fetch their data without asking them for it.`
    });

    // Define available functions
    const functions = [
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
      },
      {
        name: "get_user_bookings",
        description: "Get booking history for the current user",
        parameters: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              description: "User ID to fetch bookings for"
            }
          },
          required: ["user_id"]
        }
      },
      {
        name: "get_venue_info",
        description: "Get detailed information about a venue",
        parameters: {
          type: "object",
          properties: {
            venue_name: {
              type: "string",
              description: "Name of the venue to search for"
            }
          },
          required: ["venue_name"]
        }
      },
      {
        name: "get_available_slots",
        description: "Get available slots for a venue on a specific date",
        parameters: {
          type: "object",
          properties: {
            venue_id: {
              type: "string",
              description: "ID of the venue"
            },
            date: {
              type: "string",
              description: "Date to check availability for (YYYY-MM-DD)"
            }
          },
          required: ["venue_id", "date"]
        }
      },
      {
        name: "get_sports_info",
        description: "Get information about available sports",
        parameters: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "get_nearby_venues",
        description: "Find venues near a specific location",
        parameters: {
          type: "object",
          properties: {
            latitude: {
              type: "number",
              description: "Latitude of the location"
            },
            longitude: {
              type: "number",
              description: "Longitude of the location"
            },
            radius: {
              type: "number",
              description: "Search radius in kilometers (default: 5)"
            }
          },
          required: ["latitude", "longitude"]
        }
      }
    ];

    // Update the OpenAI API call to force function calling for contact queries
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: completeMessages,
        temperature: 0.7,
        functions,
        function_call: messages[messages.length - 1].content.toLowerCase().includes('contact') 
          ? { name: 'get_venue_contact' }
          : "auto",
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const responseMessage = data.choices[0].message;
    let result = { message: responseMessage };

    // Handle function calls
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      let functionResult;
      switch (functionName) {
        case 'get_venue_contact':
          functionResult = await getVenueContact(supabase, functionArgs.venue_name);
          break;
        case 'get_user_bookings':
          functionResult = await getUserBookings(supabase, functionArgs.user_id);
          break;
        case 'get_venue_info':
          functionResult = await getVenueInfo(supabase, functionArgs.venue_name);
          break;
        case 'get_available_slots':
          functionResult = await getAvailableSlots(supabase, functionArgs.venue_id, functionArgs.date);
          break;
        case 'get_sports_info':
          functionResult = await getSportsInfo(supabase);
          break;
        case 'get_nearby_venues':
          functionResult = await getNearbyVenues(
            supabase,
            functionArgs.latitude,
            functionArgs.longitude,
            functionArgs.radius
          );
          break;
      }

      // Second call to OpenAI with function result
      const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
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
    return new Response(
      JSON.stringify({ 
        message: { 
          role: "assistant", 
          content: "I encountered an error. Please try again later." 
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
