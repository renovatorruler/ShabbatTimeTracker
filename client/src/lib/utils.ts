import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeStr: string): string {
  // Convert from "6:45pm" to "6:45 PM"
  return timeStr.replace(/([ap])m/i, (match, meridiem) => 
    ` ${meridiem.toUpperCase()}M`
  );
}

export function getCurrentShabbatDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days until Friday (5)
  let daysUntilFriday = 5 - dayOfWeek;
  if (daysUntilFriday <= 0) {
    daysUntilFriday += 7; // Next Friday
  }
  
  const friday = new Date(today);
  friday.setDate(today.getDate() + daysUntilFriday);
  
  return friday.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
