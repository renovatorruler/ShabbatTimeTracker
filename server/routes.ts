import type { Express } from "express";
import { createServer, type Server } from "http";
import { locationInputSchema, legacyLocationInputSchema } from "@shared/schema";
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
const LOCATION_MAPPINGS: Record<string, { zip?: string; city?: string; country?: string; geonameid?: string }> = {
  'san juan, puerto rico': { zip: '00901' },
  'puerto rico': { zip: '00901' },
  'san juan': { zip: '00901' },
  'new york, ny': { zip: '10001' },
  'new york': { zip: '10001' },
  'london, uk': { geonameid: '2643743' },
  'london': { geonameid: '2643743' },
  'istanbul, turkey': { geonameid: '745044' },
  'istanbul': { geonameid: '745044' },
  'lisbon, portugal': { geonameid: '2267057' },
  'lisbon': { geonameid: '2267057' },
  'paris, france': { geonameid: '2988507' },
  'paris': { geonameid: '2988507' },
  'madrid, spain': { geonameid: '3117735' },
  'madrid': { geonameid: '3117735' },
  'rome, italy': { geonameid: '3169070' },
  'rome': { geonameid: '3169070' },
  'mumbai, india': { geonameid: '1275339' },
  'mumbai': { geonameid: '1275339' },
  'delhi, india': { geonameid: '1273294' },
  'delhi': { geonameid: '1273294' },
  'tel aviv, israel': { geonameid: '293397' },
  'tel aviv': { geonameid: '293397' },
  'jerusalem, israel': { geonameid: '281184' },
  'jerusalem': { geonameid: '281184' },
  'sydney, australia': { geonameid: '2147714' },
  'sydney': { geonameid: '2147714' },
  'toronto, canada': { geonameid: '6167865' },
  'toronto': { geonameid: '6167865' },
  'faro, portugal': { geonameid: '2268339' },
  'faro': { geonameid: '2268339' },
  'evora, portugal': { geonameid: '2267827' },
  'evora': { geonameid: '2267827' },
  'guaynabo, puerto rico': { geonameid: '4568127' },
  'guaynabo': { geonameid: '4568127' },
  'porto, portugal': { geonameid: '2735943' },
  'porto': { geonameid: '2735943' },
  'coimbra, portugal': { geonameid: '2740637' },
  'coimbra': { geonameid: '2740637' },
  'braga, portugal': { geonameid: '2742416' },
  'braga': { geonameid: '2742416' },
  'caguas, puerto rico': { geonameid: '4568415' },
  'caguas': { geonameid: '4568415' },
  'bayamon, puerto rico': { geonameid: '4568543' },
  'bayamon': { geonameid: '4568543' },
  'ponce, puerto rico': { geonameid: '4566735' },
  'ponce': { geonameid: '4566735' },
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
  
  if (isZipCode(location)) {
    // For zip codes, always use the geo=zip parameter
    url = `https://www.hebcal.com/shabbat?cfg=json&geo=zip&zip=${location.trim()}&M=on&lg=s`;
  } else {
    // Use mapping logic for location names
    const mapping = LOCATION_MAPPINGS[locationKey];
    if (mapping && mapping.zip) {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=zip&zip=${mapping.zip}&M=on&lg=s`;
    } else if (mapping && mapping.geonameid) {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=geoname&geonameid=${mapping.geonameid}&M=on&lg=s`;
    } else if (mapping && mapping.city && mapping.country) {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(mapping.city + ', ' + mapping.country)}&M=on&lg=s`;
    } else {
      url = `https://www.hebcal.com/shabbat?cfg=json&geo=pos&pos=${encodeURIComponent(location)}&M=on&lg=s`;
    }
  }
  
  try {
    const response = await fetch(url);
    
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
    
    // Extract time from title (format: "Candle lighting: 6:45pm" or "Candle lighting: 20:47")
    const startTimeMatch = candleLighting.title.match(/(\d{1,2}:\d{2}(?:[ap]m)?)/i);
    const endTimeMatch = havdalah.title.match(/(\d{1,2}:\d{2}(?:[ap]m)?)/i);
    
    if (!startTimeMatch || !endTimeMatch) {
      throw new Error(`Could not parse times for ${location}: start="${candleLighting.title}", end="${havdalah.title}"`);
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
    
    return result;
    
  } catch (error) {
    console.error(`Error fetching Shabbat times for ${location}:`, error);
    throw error;
  }
}

function formatTime(timeStr: string): string {
  // Handle 24-hour format (20:47) or 12-hour format (6:45pm)
  if (timeStr.includes('m')) {
    // Convert from "6:45pm" to "6:45 PM"
    return timeStr.replace(/([ap])m/i, (match, meridiem) => 
      ` ${meridiem.toUpperCase()}M`
    );
  } else {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const meridiem = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${meridiem}`;
  }
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
    
    // Enhanced timezone offset map with more locations
    const offsetMap: { [key: string]: number } = {
      'America/Puerto_Rico': -4, // AST
      'America/New_York': -4, // EDT (summer) 
      'Europe/Lisbon': 1, // WEST (summer)
      'Europe/London': 1, // BST (summer)
      'Europe/Paris': 2, // CEST (summer)
      'Europe/Madrid': 2, // CEST (summer)
      'Europe/Rome': 2, // CEST (summer)
      'Europe/Istanbul': 3, // TRT
      'Asia/Kolkata': 5.5, // IST (India)
      'Asia/Calcutta': 5.5, // IST (India)
      'Australia/Sydney': 10, // AEST
      'America/Toronto': -4, // EDT (summer)
      'America/Chicago': -5, // CDT (summer)
      'America/Los_Angeles': -7, // PDT (summer)
      'Asia/Jerusalem': 3, // IDT (summer)
      'Asia/Tel_Aviv': 3, // IDT (summer)
      'UTC': 0,
    };
    
    const fromOffset = offsetMap[fromTz];
    const toOffset = offsetMap[toTz];
    
    if (fromOffset === undefined || toOffset === undefined) {
      console.log(`Missing timezone offset for ${fromTz} or ${toTz}`);
      return `${timeStr} (timezone conversion unavailable)`;
    }
    
    const hoursDiff = toOffset - fromOffset;
    
    // Split hoursDiff into whole hours and fractional hours
    const wholeHours = Math.floor(hoursDiff);
    const fractionalHours = hoursDiff - wholeHours;
    
    let convertedHours = hours + wholeHours;
    let convertedMinutes = minutes + (fractionalHours * 60);
    
    // Handle minute overflow/underflow
    if (convertedMinutes >= 60) {
      convertedHours += Math.floor(convertedMinutes / 60);
      convertedMinutes = convertedMinutes % 60;
    } else if (convertedMinutes < 0) {
      convertedHours -= Math.ceil(Math.abs(convertedMinutes) / 60);
      convertedMinutes = 60 + (convertedMinutes % 60);
    }
    
    let dayAdjustment = '';
    
    // Handle day overflow
    if (convertedHours >= 24) {
      convertedHours -= 24;
      dayAdjustment = ' (+1 day)';
    } else if (convertedHours < 0) {
      convertedHours += 24;
      dayAdjustment = ' (-1 day)';
    }
    
    // Convert back to 12-hour format
    let displayHours = convertedHours;
    let displayMeridiem = 'AM';
    
    if (convertedHours === 0) {
      displayHours = 12;
      displayMeridiem = 'AM';
    } else if (convertedHours > 12) {
      displayHours = convertedHours - 12;
      displayMeridiem = 'PM';
    } else if (convertedHours === 12) {
      displayMeridiem = 'PM';
    } else if (convertedHours > 0) {
      displayMeridiem = 'AM';
    }
    
    return `${displayHours}:${Math.round(convertedMinutes).toString().padStart(2, '0')} ${displayMeridiem}${dayAdjustment}`;
  } catch (error) {
    console.error('Error converting timezone:', error);
    return timeStr;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auto-complete endpoint for location suggestions
  app.get("/api/locations/suggest", (req, res) => {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const searchTerm = query.toLowerCase();
    const suggestions = Object.keys(LOCATION_MAPPINGS)
      .filter(location => 
        location.includes(searchTerm) && 
        !location.match(/^\d{5}$/) // Exclude zip codes from suggestions
      )
      .sort((a, b) => {
        // Prioritize exact matches and common cities
        const aStartsWith = a.startsWith(searchTerm);
        const bStartsWith = b.startsWith(searchTerm);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.length - b.length; // Shorter names first
      })
      .slice(0, 8) // Limit to 8 suggestions
      .map(location => ({
        value: location,
        label: location.split(',').map(part => 
          part.trim().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        ).join(', ')
      }));
    
    res.json({ suggestions });
  });

  app.post("/api/shabbat-times", async (req, res) => {
    try {
      // Support both new and legacy formats
      let locations: string[];
      let validatedInput: any;
      
      if (req.body.locations) {
        // New format
        validatedInput = locationInputSchema.parse(req.body);
        locations = [validatedInput.homeLocation, ...validatedInput.locations];
      } else {
        // Legacy format
        const legacyInput = legacyLocationInputSchema.parse(req.body);
        locations = [
          legacyInput.homeLocation,
          legacyInput.secondaryLocation,
          legacyInput.tertiaryLocation,
        ].filter(Boolean) as string[];
        validatedInput = { homeLocation: legacyInput.homeLocation };
      }
      
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
      
      // Convert times to Date objects for proper comparison across timezones
      const parseTimeWithTimezone = (timeStr: string, dateStr: string, timezone: string): Date => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return new Date();
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const meridiem = match[3].toUpperCase();
        
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        
        // Create date in UTC and adjust for timezone offset
        const baseDate = new Date(dateStr);
        baseDate.setUTCHours(hours, minutes, 0, 0);
        
        // Apply timezone offset (simplified)
        const offsetMap: { [key: string]: number } = {
          'America/Puerto_Rico': -4,
          'Europe/Lisbon': 1,
          'Asia/Kolkata': 5.5,
        };
        
        const offset = offsetMap[timezone] || 0;
        baseDate.setUTCHours(baseDate.getUTCHours() - offset);
        
        return baseDate;
      };
      
      // Simpler approach: Compare start times directly since they're all Friday evening
      // Mumbai starts earliest in the day (7:01 PM), followed by Faro (8:37 PM), then Puerto Rico (6:46 PM but in different timezone)
      const parseSimpleTime = (timeStr: string): number => {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const meridiem = match[3].toUpperCase();
        
        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      };
      
      // Convert all times to UTC for proper comparison
      const timesWithUTC = allStartTimes.map((item, index) => {
        const locationData = shabbatData[index];
        const offsetMap: { [key: string]: number } = {
          'America/Puerto_Rico': -4,
          'Europe/Lisbon': 1,
          'Asia/Kolkata': 5.5,
        };
        const offset = offsetMap[locationData.timezone] || 0;
        const localMinutes = parseSimpleTime(item.time);
        const utcMinutes = localMinutes - (offset * 60);
        return { ...item, utcMinutes, locationData };
      });
      
      const endTimesWithUTC = allEndTimes.map((item, index) => {
        const locationData = shabbatData[index];
        const offsetMap: { [key: string]: number } = {
          'America/Puerto_Rico': -4,
          'Europe/Lisbon': 1,
          'Asia/Kolkata': 5.5,
        };
        const offset = offsetMap[locationData.timezone] || 0;
        const localMinutes = parseSimpleTime(item.time);
        const utcMinutes = localMinutes - (offset * 60);
        return { ...item, utcMinutes, locationData };
      });
      
      const earliestStart = timesWithUTC.reduce((earliest, current) => 
        current.utcMinutes < earliest.utcMinutes ? current : earliest
      );
      
      const latestEnd = endTimesWithUTC.reduce((latest, current) => 
        current.utcMinutes > latest.utcMinutes ? current : latest
      );
      
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
