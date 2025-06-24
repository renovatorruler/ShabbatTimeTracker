import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Home, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { locationInputSchema, type LocationInput } from "@shared/schema";

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

  const handleSubmit = (data: LocationInput) => {
    onSubmit(data);
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Configure Locations</h2>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Home Location */}
          <div>
            <Label htmlFor="homeLocation" className="block text-sm font-medium text-text-primary mb-2">
              <Home className="inline h-4 w-4 mr-2 text-primary" />
              Home Location *
            </Label>
            <LocationAutocomplete
              id="homeLocation"
              placeholder="e.g., San Juan, Puerto Rico or 00901"
              value={form.watch("homeLocation") || ""}
              onChange={(value) => form.setValue("homeLocation", value)}
              className="w-full"
            />
            {form.formState.errors.homeLocation && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.homeLocation.message}</p>
            )}
          </div>

          {/* Secondary Location */}
          <div>
            <Label htmlFor="secondaryLocation" className="block text-sm font-medium text-text-primary mb-2">
              <MapPin className="inline h-4 w-4 mr-2 text-secondary" />
              Secondary Location *
            </Label>
            <LocationAutocomplete
              id="secondaryLocation"
              placeholder="e.g., New York, NY or 10001"
              value={form.watch("secondaryLocation") || ""}
              onChange={(value) => form.setValue("secondaryLocation", value)}
              className="w-full"
            />
            {form.formState.errors.secondaryLocation && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.secondaryLocation.message}</p>
            )}
          </div>

          {/* Tertiary Location */}
          <div>
            <Label htmlFor="tertiaryLocation" className="block text-sm font-medium text-text-primary mb-2">
              <Globe className="inline h-4 w-4 mr-2 text-warning" />
              Tertiary Location (Optional)
            </Label>
            <LocationAutocomplete
              id="tertiaryLocation"
              placeholder="e.g., London, UK or Istanbul, Turkey"
              value={form.watch("tertiaryLocation") || ""}
              onChange={(value) => form.setValue("tertiaryLocation", value)}
              className="w-full"
            />
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
