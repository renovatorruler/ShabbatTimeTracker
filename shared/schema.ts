import { z } from "zod";

export const locationInputSchema = z.object({
  homeLocation: z.string().min(1, "Home location is required"),
  secondaryLocation: z.string().min(1, "Secondary location is required"),
  tertiaryLocation: z.string().optional(),
});

export type LocationInput = z.infer<typeof locationInputSchema>;

export const shabbatTimesSchema = z.object({
  name: z.string(),
  timezone: z.string(),
  shabbatStart: z.string(),
  shabbatEnd: z.string(),
  shabbatStartInHomeTime: z.string(),
  shabbatEndInHomeTime: z.string(),
  date: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export type ShabbatTimes = z.infer<typeof shabbatTimesSchema>;

export const shabbatResponseSchema = z.object({
  currentDate: z.string(),
  locations: z.array(shabbatTimesSchema),
  summary: z.object({
    earliestStart: z.string(),
    latestEnd: z.string(),
    earliestStartTime: z.string(),
    latestEndTime: z.string(),
  }),
});

export type ShabbatResponse = z.infer<typeof shabbatResponseSchema>;
