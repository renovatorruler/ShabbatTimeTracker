import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Home, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { locationInputSchema, type LocationInput } from "@shared/schema";
import { useState } from "react";

interface LocationFormProps {
  onSubmit: (data: LocationInput) => void;
  isLoading?: boolean;
}

export function LocationForm({ onSubmit, isLoading }: LocationFormProps) {
  const form = useForm<LocationInput>({
    resolver: zodResolver(locationInputSchema),
    defaultValues: {
      homeLocation: "",
      secondaryLocation: "",
      tertiaryLocation: "",
    },
  });

  const [suggestions, setSuggestions] = useState<{[key: string]: string[]}>({});
  const [showSuggestions, setShowSuggestions] = useState<{[key: string]: boolean}>({});

  const fetchSuggestions = async (query: string, field: string) => {
    if (query.length < 2) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
      return;
    }

    try {
      const response = await fetch(`/api/locations/suggest?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(prev => ({ ...prev, [field]: data.suggestions?.map((s: any) => s.label) || [] }));
      setShowSuggestions(prev => ({ ...prev, [field]: true }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (field: keyof LocationInput, value: string) => {
    form.setValue(field, value);
    if (value.length >= 2) {
      setTimeout(() => fetchSuggestions(value, field), 300);
    } else {
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSuggestionClick = (field: keyof LocationInput, suggestion: string) => {
    form.setValue(field, suggestion);
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
  };

  const handleSubmit = (data: LocationInput) => {
    onSubmit(data);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Configure Locations</h2>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Home Location */}
          <div className="relative">
            <Label htmlFor="homeLocation" className="block text-sm font-medium text-text-primary mb-2">
              <Home className="inline h-4 w-4 mr-2 text-primary" />
              Home Location *
            </Label>
            <Input
              id="homeLocation"
              placeholder="e.g., San Juan, Puerto Rico or 00901"
              value={form.watch("homeLocation") || ""}
              onChange={(e) => handleInputChange("homeLocation", e.target.value)}
              onFocus={(e) => e.target.value.length >= 2 && fetchSuggestions(e.target.value, "homeLocation")}
              className="w-full"
              autoComplete="off"
            />
            {showSuggestions.homeLocation && suggestions.homeLocation?.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {suggestions.homeLocation.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-none bg-transparent cursor-pointer"
                    onClick={() => handleSuggestionClick("homeLocation", suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.homeLocation && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.homeLocation.message}</p>
            )}
          </div>

          {/* Secondary Location */}
          <div className="relative">
            <Label htmlFor="secondaryLocation" className="block text-sm font-medium text-text-primary mb-2">
              <MapPin className="inline h-4 w-4 mr-2 text-secondary" />
              Secondary Location *
            </Label>
            <Input
              id="secondaryLocation"
              placeholder="e.g., New York, NY or 10001"
              value={form.watch("secondaryLocation") || ""}
              onChange={(e) => handleInputChange("secondaryLocation", e.target.value)}
              onFocus={(e) => e.target.value.length >= 2 && fetchSuggestions(e.target.value, "secondaryLocation")}
              className="w-full"
              autoComplete="off"
            />
            {showSuggestions.secondaryLocation && suggestions.secondaryLocation?.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {suggestions.secondaryLocation.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-none bg-transparent cursor-pointer"
                    onClick={() => handleSuggestionClick("secondaryLocation", suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {form.formState.errors.secondaryLocation && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.secondaryLocation.message}</p>
            )}
          </div>

          {/* Tertiary Location */}
          <div className="relative">
            <Label htmlFor="tertiaryLocation" className="block text-sm font-medium text-text-primary mb-2">
              <Globe className="inline h-4 w-4 mr-2 text-warning" />
              Tertiary Location (Optional)
            </Label>
            <Input
              id="tertiaryLocation"
              placeholder="e.g., London, UK or Istanbul, Turkey"
              value={form.watch("tertiaryLocation") || ""}
              onChange={(e) => handleInputChange("tertiaryLocation", e.target.value)}
              onFocus={(e) => e.target.value.length >= 2 && fetchSuggestions(e.target.value, "tertiaryLocation")}
              className="w-full"
              autoComplete="off"
            />
            {showSuggestions.tertiaryLocation && suggestions.tertiaryLocation?.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {suggestions.tertiaryLocation.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-none bg-transparent cursor-pointer"
                    onClick={() => handleSuggestionClick("tertiaryLocation", suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-white hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Get Shabbat Times</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
