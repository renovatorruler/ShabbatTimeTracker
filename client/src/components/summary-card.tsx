import { Info, Lightbulb, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  summary: {
    earliestStart: string;
    latestEnd: string;
    earliestStartTime: string;
    latestEndTime: string;
    earliestStartInHomeTime: string;
    latestEndInHomeTime: string;
    earliestStartLocation: string;
    latestEndLocation: string;
  };
  homeTimezone: string;
}

export function SummaryCard({ summary, homeTimezone }: SummaryCardProps) {
  return (
    <Card className="bg-gradient-to-r from-primary to-secondary text-white mt-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Planning Summary
        </h3>
        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-2">Earliest Shabbat Start ({homeTimezone}):</p>
              <p className="font-semibold text-lg">{summary.earliestStartInHomeTime}</p>
              <p className="text-xs text-blue-200 mt-1">From: {summary.earliestStartLocation}</p>
            </div>
            
            <div>
              <p className="text-blue-100 text-sm mb-2">Latest Shabbat End ({homeTimezone}):</p>
              <p className="font-semibold text-lg">{summary.latestEndInHomeTime}</p>
              <p className="text-xs text-blue-200 mt-1">From: {summary.latestEndLocation}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white bg-opacity-10 rounded flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm">
                <strong>Tip:</strong> Schedule calls to end before the earliest start time and begin after the latest end time to avoid conflicts.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
