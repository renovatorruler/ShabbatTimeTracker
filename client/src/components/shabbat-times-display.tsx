import { Home, MapPin, Globe, Sun, Moon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ShabbatTimes } from "@shared/schema";

interface ShabbatTimesDisplayProps {
  locations: ShabbatTimes[];
}

export function ShabbatTimesDisplay({ locations }: ShabbatTimesDisplayProps) {
  const getLocationIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Home className="text-xl" />;
      case 1:
        return <MapPin className="text-xl" />;
      case 2:
        return <Globe className="text-xl" />;
      default:
        return <MapPin className="text-xl" />;
    }
  };

  const getLocationBgColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-primary";
      case 1:
        return "bg-secondary";
      case 2:
        return "bg-warning";
      default:
        return "bg-primary";
    }
  };

  const getLocationTextColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-blue-100";
      case 1:
        return "text-purple-100";
      case 2:
        return "text-orange-100";
      default:
        return "text-blue-100";
    }
  };

  return (
    <div className="space-y-6">
      {locations.map((location, index) => (
        <Card key={index} className="overflow-hidden">
          <div className={`${getLocationBgColor(index)} text-white px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getLocationIcon(index)}
                <div>
                  <h3 className="text-lg font-semibold">{location.name}</h3>
                  <p className={`${getLocationTextColor(index)} text-sm`}>{location.timezone}</p>
                </div>
              </div>
              {index === 0 && (
                <div className="text-right">
                  <p className={`${getLocationTextColor(index)} text-sm`}>Your Home</p>
                </div>
              )}
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Shabbat Start */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success bg-opacity-10 rounded-full mb-3">
                  <Sun className="text-success text-xl" />
                </div>
                <h4 className="font-semibold text-text-primary mb-2">Shabbat Starts</h4>
                <p className="text-2xl font-bold text-text-primary">{location.shabbatStart}</p>
                <p className="text-sm text-text-secondary">Friday, Local Time</p>
              </div>
              
              {/* Shabbat End */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary bg-opacity-10 rounded-full mb-3">
                  <Moon className="text-secondary text-xl" />
                </div>
                <h4 className="font-semibold text-text-primary mb-2">Shabbat Ends</h4>
                <p className="text-2xl font-bold text-text-primary">{location.shabbatEnd}</p>
                <p className="text-sm text-text-secondary">Saturday, Local Time</p>
              </div>
            </div>
            
            {/* Time Conversion Display - only for non-home locations */}
            {index > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-text-primary mb-3 flex items-center">
                  <Clock className="mr-2 text-warning h-4 w-4" />
                  In Your Time Zone
                </h5>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Starts:</span>
                    <span className="font-medium text-text-primary">{location.shabbatStartInHomeTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ends:</span>
                    <span className="font-medium text-text-primary">{location.shabbatEndInHomeTime}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
