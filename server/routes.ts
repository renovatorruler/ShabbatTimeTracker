import type { Express } from "express";
import { createServer, type Server } from "http";
import { locationInputSchema } from "@shared/schema";
import { z } from "zod";

interface HebcalEvent {
  title: string;
  date: string;
  hebrew: string;
  category: string;
}

interface HebcalResponse {
  title: string;
  date: string;
  location: {
    title: string;
    city: string;
    tzid: string;
    latitude: number;
    longitude: number;
    cc: string;
  };
  items: HebcalEvent[];
}

async function fetchLocationCoords(location: string): Promise<{ lat: number; lng: number; name: string; timezone: string }> {
  try {
    // First try OpenStreetMap Nominatim for reliable geocoding
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    const geocodeResponse = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'Shabbat Times App (contact@example.com)'
      }
    });
    
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding failed: ${geocodeResponse.statusText}`);
    }
    
    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.length) {
      throw new Error(`Location not found: ${location}`);
    }
    
    const lat = parseFloat(geocodeData[0].lat);
    const lng = parseFloat(geocodeData[0].lon);
    
    // Extract a clean location name
    const displayParts = geocodeData[0].display_name.split(',');
    const cityName = displayParts[0].trim();
    const country = displayParts[displayParts.length - 1].trim();
    const cleanName = displayParts.length > 2 ? `${cityName}, ${country}` : `${cityName}, ${country}`;
    
    return {
      lat,
      lng,
      name: cleanName,
      timezone: 'UTC', // Will be determined by Hebcal
    };
  } catch (error) {
    console.error(`Error geocoding location ${location}:`, error);
    throw new Error(`Could not find location: ${location}`);
  }
}

async function fetchShabbatTimes(location: string): Promise<{
  name: string;
  timezone: string;
  shabbatStart: string;
  shabbatEnd: string;
  date: string;
  coordinates?: { lat: number; lng: number };
}> {
  try {
    // First get coordinates and proper location name
    const coords = await fetchLocationCoords(location);
    
    // Get Shabbat times from Hebcal API using coordinates
    const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=&M=on&lg=s&geo=pos&pos=${coords.lat},${coords.lng}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Hebcal API error: ${response.statusText}`);
    }
    
    const data: HebcalResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error(`No Shabbat times found for ${location}`);
    }
    
    // Find candle lighting and Havdalah times
    const candleLighting = data.items.find(item => 
      item.title.includes('Candle lighting') || 
      item.category === 'candles'
    );
    
    const havdalah = data.items.find(item => 
      item.title.includes('Havdalah') || 
      item.category === 'havdalah'
    );
    
    if (!candleLighting || !havdalah) {
      throw new Error(`Incomplete Shabbat times for ${location}`);
    }
    
    // Extract time from title (format: "Candle lighting: 6:45pm")
    const startTimeMatch = candleLighting.title.match(/(\d{1,2}:\d{2}[ap]m)/i);
    const endTimeMatch = havdalah.title.match(/(\d{1,2}:\d{2}[ap]m)/i);
    
    if (!startTimeMatch || !endTimeMatch) {
      throw new Error(`Could not parse times for ${location}`);
    }
    
    return {
      name: data.location?.title || coords.name,
      timezone: data.location?.tzid || coords.timezone,
      shabbatStart: formatTime(startTimeMatch[1]),
      shabbatEnd: formatTime(endTimeMatch[1]),
      date: candleLighting.date,
      coordinates: coords,
    };
  } catch (error) {
    console.error(`Error fetching Shabbat times for ${location}:`, error);
    throw error;
  }
}

function formatTime(timeStr: string): string {
  // Convert from "6:45pm" to "6:45 PM"
  return timeStr.replace(/([ap])m/i, (match, meridiem) => 
    ` ${meridiem.toUpperCase()}M`
  );
}

function convertTimeToTimezone(timeStr: string, date: string, fromTz: string, toTz: string): string {
  try {
    // Parse the time string (e.g., "6:45 PM")
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return timeStr;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const meridiem = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    
    // Create date object in the source timezone
    const dateTimeStr = `${date} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    const sourceTime = new Date(`${dateTimeStr} UTC`); // We'll adjust for timezone manually
    
    // For now, do a simple offset calculation
    // This is a simplified approach - in production you'd want to use a proper timezone library
    const offsetMap: { [key: string]: number } = {
      'America/Puerto_Rico': -4, // AST
      'America/New_York': -5, // EST (winter) / -4 (summer) 
      'Europe/Lisbon': 0, // WET (winter) / +1 (summer)
      'America/Chicago': -6,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'UTC': 0,
    };
    
    const fromOffset = offsetMap[fromTz] || 0;
    const toOffset = offsetMap[toTz] || 0;
    const hoursDiff = toOffset - fromOffset;
    
    let convertedHours = hours + hoursDiff;
    let dayName = '';
    
    // Handle day overflow
    if (convertedHours >= 24) {
      convertedHours -= 24;
      dayName = 'Saturday';
    } else if (convertedHours < 0) {
      convertedHours += 24;
      dayName = 'Thursday';
    } else {
      dayName = 'Friday';
    }
    
    // Convert back to 12-hour format
    let displayHours = convertedHours;
    let displayMeridiem = 'AM';
    
    if (convertedHours === 0) {
      displayHours = 12;
    } else if (convertedHours > 12) {
      displayHours = convertedHours - 12;
      displayMeridiem = 'PM';
    } else if (convertedHours === 12) {
      displayMeridiem = 'PM';
    }
    
    const timeOnly = `${displayHours}:${minutes.toString().padStart(2, '0')} ${displayMeridiem}`;
    
    // Only add day if it's different from Friday (for start) or Saturday (for end)
    if (timeStr.includes('PM') && dayName !== 'Friday') {
      return `${timeOnly} ${dayName}`;
    } else if (timeStr.includes('PM') && dayName === 'Saturday') {
      return `${timeOnly} Saturday`;
    }
    
    return timeOnly;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return timeStr;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/shabbat-times", async (req, res) => {
    try {
      const validatedInput = locationInputSchema.parse(req.body);
      
      const locations = [
        validatedInput.homeLocation,
        validatedInput.secondaryLocation,
        validatedInput.tertiaryLocation,
      ].filter(Boolean) as string[];
      
      console.log('Processing locations:', locations);
      
      // Fetch Shabbat times for all locations
      const shabbatData: any[] = [];
      
      // Process each location individually to avoid caching issues
      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        console.log(`Fetching data for location ${i}: ${location}`);
        
        const times = await fetchShabbatTimes(location);
        console.log(`Received data for ${location}:`, times.name, times.timezone);
        
        if (i === 0) {
          // Home location
          shabbatData.push({
            ...times,
            shabbatStartInHomeTime: times.shabbatStart + ' Friday',
            shabbatEndInHomeTime: times.shabbatEnd + ' Saturday',
          });
        } else {
          // Other locations - convert to home timezone
          const homeLocationData = shabbatData[0]; // Use already fetched home data
          shabbatData.push({
            ...times,
            shabbatStartInHomeTime: convertTimeToTimezone(
              times.shabbatStart, 
              times.date, 
              times.timezone, 
              homeLocationData.timezone
            ),
            shabbatEndInHomeTime: convertTimeToTimezone(
              times.shabbatEnd, 
              times.date, 
              times.timezone, 
              homeLocationData.timezone
            ),
          });
        }
      }
      
      // Find earliest start and latest end for summary
      const homeLocation = shabbatData[0];
      const allStartTimes = shabbatData.map(location => ({
        time: location.shabbatStart,
        location: location.name,
        homeTime: location.shabbatStartInHomeTime,
      }));
      
      const allEndTimes = shabbatData.map(location => ({
        time: location.shabbatEnd,
        location: location.name,
        homeTime: location.shabbatEndInHomeTime,
      }));
      
      // For simplicity, use the home location as reference for earliest/latest
      const earliestStart = allStartTimes[0]; // Home location
      const latestEnd = allEndTimes[0]; // Home location
      
      const response = {
        currentDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        locations: shabbatData,
        summary: {
          earliestStart: `${earliestStart.time} (${earliestStart.location} time)`,
          latestEnd: `${latestEnd.time} (${latestEnd.location} time)`,
          earliestStartTime: earliestStart.homeTime,
          latestEndTime: latestEnd.homeTime,
        },
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching Shabbat times:', error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch Shabbat times' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
