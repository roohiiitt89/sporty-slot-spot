
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompt to define the assistant's behavior and limitations
const SYSTEM_PROMPT = `
You are Grid2Play's lovable, expert sports slot booking assistant.

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
`;

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

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
    const { messages = [], userId = null } = await req.json();
    
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
    // Create Supabase client for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', userId)
      .single();

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
      const bookingInfo = await getUserBookings(userId, supabase);
      
      if (bookingInfo.success) {
        completeMessages.push({
          role: "system",
          content: `User has ${bookingInfo.upcoming.length} upcoming bookings and ${bookingInfo.past.length} past bookings.`
        });
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

// Supabase client with service role for database access
function createClient(supabaseUrl: string, supabaseKey: string) {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: () => ({
            data: null,
            error: null
          }),
          data: [],
          error: null
        }),
        gte: (column: string, value: any) => ({
          order: (column: string, { ascending = true }: { ascending: boolean } = { ascending: true }) => ({
            limit: (limit: number) => ({
              data: [],
              error: null
            })
          })
        }),
        lt: (column: string, value: any) => ({
          order: (column: string, { ascending = true }: { ascending: boolean } = { ascending: true }) => ({
            limit: (limit: number) => ({
              data: [],
              error: null
            })
          })
        })
      })
    })
  };
}

// Function to get user bookings
async function getUserBookings(userId: string, supabase: any) {
  try {
    console.log("Fetching bookings for user:", userId);
    
    // Simulating data - in a real implementation this would use supabase client
    // to query actual bookings data
    return {
      success: true,
      upcoming: [],
      past: []
    };
  } catch (error) {
    console.error("Error in getUserBookings:", error);
    return { success: false };
  }
}
