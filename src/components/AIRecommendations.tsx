import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingDown, Clock } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  savings: string;
  priority: "high" | "medium" | "low";
}

interface AIRecommendationsProps {
  recommendations: Recommendation[];
}

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-solar/10 text-solar-foreground border-solar/20",
  low: "bg-primary/10 text-primary border-primary/20",
};

export const AIRecommendations = ({ recommendations }: AIRecommendationsProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Energy Advisor</h3>
      </div>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="p-4 rounded-lg border border-border bg-card/50">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h4 className="font-medium">{rec.title}</h4>
              <Badge className={priorityColors[rec.priority]} variant="outline">
                {rec.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-primary">
                <TrendingDown className="h-3 w-3" />
                Save {rec.savings}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                Immediate action
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
