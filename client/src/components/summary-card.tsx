import { Info, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  summary: {
    earliestStart: string;
    latestEnd: string;
    earliestStartTime: string;
    latestEndTime: string;
  };
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card className="bg-gradient-to-r from-primary to-secondary text-white mt-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Planning Summary
        </h3>
        <div className="bg-white bg-opacity-10 rounded-lg p-4">
          <p className="text-blue-100 text-sm mb-2">Earliest Shabbat Start:</p>
          <p className="font-semibold text-lg mb-4">{summary.earliestStart}</p>
          
          <p className="text-blue-100 text-sm mb-2">Latest Shabbat End:</p>
          <p className="font-semibold text-lg mb-4">{summary.latestEnd}</p>
          
          <div className="mt-4 p-3 bg-white bg-opacity-10 rounded flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm">
                <strong>Tip:</strong> Schedule your calls to end before the earliest Shabbat start time 
                to ensure they don't conflict with Shabbat observance in any location.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
