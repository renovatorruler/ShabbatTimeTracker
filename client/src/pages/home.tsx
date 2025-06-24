import { useState } from "react";
import { LocationWidget } from "@/components/location-widget";
import { ShabbatTimesDisplay } from "@/components/shabbat-times-display";
import { SummaryCard } from "@/components/summary-card";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type { ShabbatResponse } from "@shared/schema";

export default function Home() {
  const [locationData, setLocationData] = useState<{ homeLocation: string; locations: string[] } | null>(null);

  const { data: shabbatData, isLoading, error } = useQuery<ShabbatResponse>({
    queryKey: ["/api/shabbat-times", locationData],
    enabled: !!locationData,
    queryFn: async () => {
      const response = await fetch("/api/shabbat-times", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch Shabbat times");
      }

      return response.json();
    },
  });

  const handleFormSubmit = (data: { homeLocation: string; locations: string[] }) => {
    setLocationData(data);
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Shabbat Times</h1>
              <p className="text-sm text-text-secondary">Track Shabbat across multiple locations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <LocationWidget onSubmit={handleFormSubmit} isLoading={isLoading} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="text-red-400">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{(error as Error).message}</p>
              </div>
            </div>
          </div>
        )}

        {shabbatData && (
          <>
            {/* Current Date Display */}
            <div className="text-center mb-6">
              <p className="text-text-secondary">Showing times for</p>
              <p className="text-xl font-semibold text-text-primary">{shabbatData.currentDate}</p>
            </div>

            <ShabbatTimesDisplay locations={shabbatData.locations} />
            <SummaryCard summary={shabbatData.summary} homeTimezone={shabbatData.locations[0]?.timezone || 'Home Time'} />
          </>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 py-6 border-t border-gray-200">
          <p className="text-text-secondary text-sm">
            Times provided by Hebcal Jewish calendar API.{" "}
            <a 
              href="https://www.hebcal.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              Learn more about accuracy
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
