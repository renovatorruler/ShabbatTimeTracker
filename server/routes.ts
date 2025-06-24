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

// Location-specific zip codes and city mappings for accurate Hebcal API calls
const LOCATION_MAPPINGS: Record<string, { zip?: string; city?: string; country?: string }> = {
  'san juan, puerto rico': { zip: '00901' },
  'puerto rico': { zip: '00901' },
  'san juan': { zip: '00901' },
  'new york, ny': { zip: '10001' },
  'new york': { zip: '10001' },
  'london, uk': { city: 'London', country: 'UK' },
  'london': { city: 'London', country: 'UK' },
  'istanbul, turkey': { city: 'Istanbul', country: 'Turkey' },
  'istanbul': { city: 'Istanbul', country: 'Turkey' },
  'lisbon, portugal': { city: 'Lisbon', country: 'Portugal' },
  'lisbon': { city: 'Lisbon', country: 'Portugal' },
  // Direct zip code mappings
  '00901': { zip: '00901' },
  '00911': { zip: '00911' },
  '00912': { zip: '00912' },
  '10001': { zip: '10001' },
  '11223': { zip: '11223' },
  '78640': { zip: '78640' }
};

// Function to detect if input is a zip code
function isZipCode(input: string): boolean {
  const trimmed = input.trim();
  return /^\d{5}$/.test(trimmed);
}

async function fetchLocationCoords(location: string): Promise<{ lat: number; lng: number; name: string; timezone: string }> {
  const locationKey = location.toLowerCase();
  
  // Try location-specific mapping first
  const mapping = LOCATION_MAPPINGS[locationKey];
  if (mapping) {
    try {
      let url: string;
      if (mapping.zip) {
        url = `https://www.hebcal.com/shabbat?cfg=json&geo=zip&zip=${mapping.zip}&M=on&lg=s`;
      } else if (mapping.city && mapping.country) {
        url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(mapping.city + ', ' + mapping.country)}&M=on&lg=s`;
      } else {
        url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(location)}&M=on&lg=s`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data: HebcalResponse = await response.json();
        if (data.location) {
          return {
            lat: data.location.latitude,
            lng: data.location.longitude,
            name: data.location.title,
            timezone: data.location.tzid,
          };
        }
      }
    } catch (error) {
      console.log(`Mapped endpoint failed for ${location}, trying generic`);
    }
  }
  
  // Try general geocoding
  try {
    const testUrl = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(location)}&M=on&lg=s`;
    const testResponse = await fetch(testUrl);
    
    if (testResponse.ok) {
      const testData: HebcalResponse = await testResponse.json();
      if (testData.location) {
        return {
          lat: testData.location.latitude,
          lng: testData.location.longitude,
          name: testData.location.title,
          timezone: testData.location.tzid,
        };
      }
    }
  } catch (error) {
    console.log(`API call failed for ${location}`);
  }
  
  throw new Error(`Location not found: ${location}`);
}

async function fetchShabbatTimes(location: string): Promise<{
  name: string;
  timezone: string;
  shabbatStart: string;
  shabbatEnd: string;
  date: string;
  coordinates?: { lat: number; lng: number };
}> {
  const locationKey = location.toLowerCase().trim();
  
  // Check if input is a zip code first
  let url: string;
  console.log(`Checking if "${location}" is zip code: ${isZipCode(location)}`);
  
  if (isZipCode(location)) {
    // For zip codes, always use the geo=zip parameter
    url = `https://www.hebcal.com/shabbat?cfg=json&geo=zip&zip=${location.trim()}&M=on&lg=s`;
    console.log(`Using zip endpoint for ${location}`);
  } else {
    // Use mapping logic for location names
    const mapping = LOCATION_MAPPINGS[locationKey];
    if (mapping && mapping.zip) {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=zip&zip=${mapping.zip}&M=on&lg=s`;
    } else if (mapping && mapping.city && mapping.country) {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(mapping.city + ', ' + mapping.country)}&M=on&lg=s`;
    } else {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(location)}&M=on&lg=s`;
    }
  }
  
  console.log(`Fetching Shabbat times for ${location} from: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log(`Response status for ${location}: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data: HebcalResponse = await response.json();
    
    if (!data.location || !data.items || data.items.length === 0) {
      throw new Error(`No location or times data found for ${location}`);
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
    
    const result = {
      name: data.location.title,
      timezone: data.location.tzid,
      shabbatStart: formatTime(startTimeMatch[1]),
      shabbatEnd: formatTime(endTimeMatch[1]),
      date: candleLighting.date,
      coordinates: {
        lat: data.location.latitude,
        lng: data.location.longitude,
      },
    };
    
    console.log(`Successfully fetched data for ${location}:`, result.name, result.timezone);
    return result;
    
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
