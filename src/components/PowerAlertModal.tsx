import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Sun, AlertTriangle, Clock, TrendingUp, Lightbulb } from "lucide-react";

interface PowerAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertType: 'high_consumption' | 'solar_opportunity' | 'peak_hours' | 'cost_saving';
  data: {
    currentConsumption: number;
    solarGeneration: number;
    highConsumptionDevices: Array<{ name: string; consumption: number; type: string }>;
    timeOfDay: string;
    solarEfficiency: number;
    potentialSavings: number;
  };
  onImplementSuggestion?: (suggestion: string) => void;
}

export function PowerAlertModal({ 
  isOpen, 
  onClose, 
  alertType, 
  data, 
  onImplementSuggestion 
}: PowerAlertModalProps) {
  
  const getAlertConfig = () => {
    switch (alertType) {
      case 'high_consumption':
        return {
          title: "⚡ High Power Consumption Alert",
          description: "Your power consumption has increased significantly",
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          color: "border-red-200 bg-red-50",
          urgency: "high"
        };
      case 'solar_opportunity':
        return {
          title: "☀️ Solar Power Opportunity",
          description: "Great time to use solar energy!",
          icon: <Sun className="h-6 w-6 text-yellow-500" />,
          color: "border-yellow-200 bg-yellow-50",
          urgency: "medium"
        };
      case 'peak_hours':
        return {
          title: "⏰ Peak Solar Hours",
          description: "Optimal time for high-energy devices",
          icon: <Clock className="h-6 w-6 text-blue-500" />,
          color: "border-blue-200 bg-blue-50",
          urgency: "low"
        };
      case 'cost_saving':
        return {
          title: "💰 Cost Saving Opportunity",
          description: "You can save money by adjusting usage",
          icon: <TrendingUp className="h-6 w-6 text-green-500" />,
          color: "border-green-200 bg-green-50",
          urgency: "medium"
        };
    }
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    if (alertType === 'high_consumption') {
      suggestions.push(
        "Turn off unnecessary devices to reduce consumption",
        "Consider using solar power for high-consumption devices",
        "Schedule heavy appliances for off-peak hours"
      );
    }
    
    if (alertType === 'solar_opportunity' || alertType === 'peak_hours') {
      suggestions.push(
        "Run your washing machine now to use solar power",
        "Turn on your AC - solar generation is at peak",
        "Charge your electric vehicle during solar hours",
        "Use your dishwasher and other heavy appliances now"
      );
    }
    
    if (alertType === 'cost_saving') {
      suggestions.push(
        "Shift device usage to solar peak hours (10 AM - 3 PM)",
        "Reduce AC temperature by 2°C to save energy",
        "Use smart scheduling for non-essential devices"
      );
    }
    
    return suggestions;
  };

  const config = getAlertConfig();
  const suggestions = getSuggestions();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <AlertDialogTitle className="text-xl">{config.title}</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {config.description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Card className={config.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{data.currentConsumption.toFixed(1)} kWh</div>
                  <div className="text-sm text-muted-foreground">Current Usage</div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{data.solarGeneration.toFixed(1)} kWh</div>
                  <div className="text-sm text-muted-foreground">Solar Generation</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Solar Efficiency</span>
                  <span>{data.solarEfficiency.toFixed(0)}%</span>
                </div>
                <Progress value={data.solarEfficiency} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* High Consumption Devices */}
          {data.highConsumptionDevices.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  High Consumption Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.highConsumptionDevices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <span className="font-medium">{device.name}</span>
                      <Badge variant="destructive">{device.consumption.toFixed(1)} kWh</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500" />
                Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{suggestion}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onImplementSuggestion?.(suggestion)}
                      className="flex-shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Potential Savings */}
          {data.potentialSavings > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">₹{data.potentialSavings.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Potential Monthly Savings</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Dismiss</AlertDialogCancel>
          <AlertDialogAction onClick={onClose}>
            Got it!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
