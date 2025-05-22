// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @deno-types="https://esm.sh/v135/@supabase/supabase-js@2.39.7/dist/module/index.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// In-memory cache: { [venue_id]: { data, timestamp } }
const weatherCache: Record<string, { data: any; timestamp: number }> = {}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY") || ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // or set to 'https://www.grid2play.com' for more security
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getAuthHeaders() {
  return {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };
}

export default serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders })
  }

  const { venue_id, daily } = body
  if (!venue_id) {
    return new Response(JSON.stringify({ error: "Missing venue_id" }), { status: 400, headers: corsHeaders })
  }

  // Get user info from JWT (from Authorization header)
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: corsHeaders })
  }
  const jwt = authHeader.replace("Bearer ", "")

  // 1. Is venue admin?
  const adminRes = await fetch(`${SUPABASE_URL}/rest/v1/venue_admins?venue_id=eq.${venue_id}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  })
  const adminData = await adminRes.json()

  // 2. Is admin or super_admin?
  const roleRes = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?or=(role.eq.admin,role.eq.super_admin)`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  })
  const roleData = await roleRes.json()

  if ((!Array.isArray(adminData) || adminData.length === 0) && (!Array.isArray(roleData) || roleData.length === 0)) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: corsHeaders })
  }

  // Get venue lat/long
  const venueRes = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue_id}&select=latitude,longitude,location`, {
    headers: getAuthHeaders()
  })
  const venueArr = await venueRes.json()
  const venue = venueArr[0]
  if (!venue) {
    return new Response(JSON.stringify({ error: "Venue not found" }), { status: 404, headers: corsHeaders })
  }
  const { latitude, longitude, location } = venue
  if (!latitude || !longitude) {
    return new Response(JSON.stringify({ error: "Venue missing coordinates" }), { status: 400, headers: corsHeaders })
  }

  // Check cache (30 min)
  const cacheKey = venue_id
  const now = Date.now()
  if (
    weatherCache[cacheKey] &&
    now - weatherCache[cacheKey].timestamp < 30 * 60 * 1000
  ) {
    return new Response(JSON.stringify(weatherCache[cacheKey].data), {
      headers: { "Content-Type": "application/json", "X-Cache": "HIT", ...corsHeaders },
    })
  }

  // Fetch weather from Open-Meteo
  try {
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,weathercode&current_weather=true&forecast_days=2&timezone=auto`;
    if (daily) {
      url += `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=3`;
    }
    const res = await fetch(url)
    const data = await res.json()

    // Current weather
    const current = data.current_weather
    // Next 12-24 hours forecast (hourly)
    const nowHourIdx = data.hourly.time.findIndex((t: string) => t === current.time)
    const nextHours = data.hourly.time.slice(nowHourIdx + 1, nowHourIdx + 13)
    const forecast = nextHours.map((time: string, i: number) => ({
      time,
      temp: data.hourly.temperature_2m[nowHourIdx + 1 + i],
      precipitation: data.hourly.precipitation[nowHourIdx + 1 + i],
      weathercode: data.hourly.weathercode[nowHourIdx + 1 + i],
    }))
    // Detect severe weather (rain > 5mm or weathercode for storms)
    const severe = forecast.filter(f => f.precipitation > 5 || [95, 96, 99].includes(f.weathercode)).map(f => ({
      time: f.time,
      precipitation: f.precipitation,
      weathercode: f.weathercode,
    }))

    // 3-day daily summary (if requested)
    let dailySummary = undefined
    if (daily && data.daily) {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weatherIcons: Record<number, string> = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌦️', 55: '🌦️', 56: '🌧️', 57: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌧️', 67: '🌧️',
        71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌦️', 81: '🌦️', 82: '🌦️',
        85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
      }
      dailySummary = data.daily.time.map((date: string, i: number) => {
        const d = new Date(date)
        const code = data.daily.weathercode[i]
        let summary = ''
        if ([95,96,99].includes(code)) summary = 'Thunderstorm';
        else if (code === 0) summary = 'Clear';
        else if ([1,2,3].includes(code)) summary = 'Partly Cloudy';
        else if ([61,63,65,80,81,82].includes(code)) summary = 'Rain Showers';
        else if ([51,53,55,56,57,66,67].includes(code)) summary = 'Drizzle';
        else if ([71,73,75,77,85,86].includes(code)) summary = 'Snow';
        else if ([45,48].includes(code)) summary = 'Fog';
        else summary = 'Mixed';
        return {
          date,
          day: daysOfWeek[d.getDay()],
          temp_max: data.daily.temperature_2m_max[i],
          temp_min: data.daily.temperature_2m_min[i],
          rain: data.daily.precipitation_sum[i],
          icon: weatherIcons[code] || '',
          summary,
        }
      })
    }

    const response = {
      current: {
        temp: current.temperature,
        weathercode: current.weathercode,
        windspeed: current.windspeed,
        time: current.time,
      },
      forecast,
      severe,
      lat: latitude,
      lon: longitude,
      location,
      daily: dailySummary,
    }
    weatherCache[cacheKey] = { data: response, timestamp: now }
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json", "X-Cache": "MISS", ...corsHeaders },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "Weather fetch failed", details: e.message }), { status: 500, headers: corsHeaders })
  }
})