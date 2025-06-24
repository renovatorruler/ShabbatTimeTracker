import { useState } from "react";
import { Plus, Trash2, Home, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
// No longer using LocationAutocomplete - using simple input with autoComplete="off"

interface LocationWidgetProps {
  onSubmit: (data: { homeLocation: string; locations: string[] }) => void;
  isLoading?: boolean;
}

interface LocationEntry {
  id: string;
  value: string;
  type: 'home' | 'other';
}

interface LocationSuggestion {
  value: string;
  label: string;
}

export function LocationWidget({ onSubmit, isLoading }: LocationWidgetProps) {
  const [locations, setLocations] = useState<LocationEntry[]>([
    { id: 'home', value: '', type: 'home' },
    { id: '1', value: '', type: 'other' },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [suggestions, setSuggestions] = useState<{ [key: string]: LocationSuggestion[] }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [activeField, setActiveField] = useState<string | null>(null);

  const getLocationIcon = (type: string, index: number) => {
    if (type === 'home') return <Home className="h-4 w-4" />;
    if (index === 1) return <MapPin className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };

  const getLocationColor = (type: string, index: number) => {
    if (type === 'home') return "text-primary";
    if (index === 1) return "text-secondary";
    return "text-warning";
  };

  const fetchSuggestions = async (query: string, fieldId: string) => {
    if (query.length < 2) {
      setSuggestions(prev => ({ ...prev, [fieldId]: [] }));
      setShowSuggestions(prev => ({ ...prev, [fieldId]: false }));
      return;
    }

    try {
      const response = await fetch(`/api/locations/suggest?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(prev => ({ ...prev, [fieldId]: data.suggestions || [] }));
      setShowSuggestions(prev => ({ ...prev, [fieldId]: true }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const updateLocation = (id: string, value: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, value } : loc
    ));
    
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }

    // Fetch suggestions immediately if we have enough characters
    if (value.length >= 2) {
      fetchSuggestions(value, id);
    } else {
      setSuggestions(prev => ({ ...prev, [id]: [] }));
      setShowSuggestions(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSuggestionClick = (fieldId: string, suggestion: LocationSuggestion) => {
    updateLocation(fieldId, suggestion.label);
    setShowSuggestions(prev => ({ ...prev, [fieldId]: false }));
    setActiveField(null);
  };

  const handleInputFocus = (fieldId: string, value: string) => {
    setActiveField(fieldId);
    if (value.length >= 2) {
      fetchSuggestions(value, fieldId);
      setShowSuggestions(prev => ({ ...prev, [fieldId]: true }));
    }
  };

  const handleInputBlur = (fieldId: string) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (activeField === fieldId) {
        setShowSuggestions(prev => ({ ...prev, [fieldId]: false }));
        setActiveField(null);
      }
    }, 200);
  };

  const addLocation = () => {
    const newId = Date.now().toString();
    setLocations(prev => [...prev, { id: newId, value: '', type: 'other' }]);
  };

  const removeLocation = (id: string) => {
    if (locations.length > 2) { // Keep at least home + one other
      setLocations(prev => prev.filter(loc => loc.id !== id));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
      // Clean up suggestion state for removed location
      setSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[id];
        return newSuggestions;
      });
      setShowSuggestions(prev => {
        const newShowSuggestions = { ...prev };
        delete newShowSuggestions[id];
        return newShowSuggestions;
      });
      if (activeField === id) {
        setActiveField(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    const homeLocation = locations.find(loc => loc.type === 'home');
    const otherLocations = locations.filter(loc => loc.type === 'other' && loc.value.trim());

    if (!homeLocation?.value.trim()) {
      newErrors.home = 'Home location is required';
    }

    if (otherLocations.length === 0) {
      newErrors.general = 'At least one additional location is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit({
        homeLocation: homeLocation!.value.trim(),
        locations: otherLocations.map(loc => loc.value.trim()),
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Configure Locations</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {locations.map((location, index) => (
            <div key={location.id} className="relative space-y-2">
              <Label className="block text-sm font-medium text-text-primary">
                <span className={`inline-flex items-center space-x-2 ${getLocationColor(location.type, index)}`}>
                  {getLocationIcon(location.type, index)}
                  <span>
                    {location.type === 'home' ? 'Home Location *' : `Location ${index} *`}
                  </span>
                </span>
              </Label>
              
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={location.type === 'home' 
                      ? "e.g., San Juan, Puerto Rico or 00901" 
                      : "e.g., New York, NY or London, UK"
                    }
                    value={location.value}
                    onChange={(e) => updateLocation(location.id, e.target.value)}
                    onFocus={() => handleInputFocus(location.id, location.value)}
                    onBlur={() => handleInputBlur(location.id)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    autoComplete="off"
                  />
                  
                  {showSuggestions[location.id] && suggestions[location.id]?.length > 0 && activeField === location.id && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                      {suggestions[location.id].map((suggestion, suggestionIndex) => (
                        <button
                          key={suggestionIndex}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-none bg-transparent cursor-pointer"
                          onClick={() => handleSuggestionClick(location.id, suggestion)}
                        >
                          {suggestion.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {location.type === 'other' && locations.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeLocation(location.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {errors[location.id] && (
                <p className="text-red-500 text-sm">{errors[location.id]}</p>
              )}
            </div>
          ))}
          
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addLocation}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Location</span>
            </Button>
            
            <Button type="submit" disabled={isLoading} className="min-w-32">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Loading...</span>
                </div>
              ) : (
                "Get Shabbat Times"
              )}
            </Button>
          </div>
          
          {errors.general && (
            <p className="text-red-500 text-sm text-center">{errors.general}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}