import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, AlertTriangle, Sun, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PowerAlertModal } from "./PowerAlertModal";
import { solarAdvisor, SolarRecommendation, SolarData } from "@/services/solarAdvisor";

interface VoiceAssistantProps {
  devices: Array<{ name: string; consumption: number; type: string; isOn: boolean }>;
  solarGeneration: number;
  totalConsumption: number;
}

export const VoiceAssistant = ({ devices, solarGeneration, totalConsumption }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoAlertEnabled, setAutoAlertEnabled] = useState(true);
  const [currentAlert, setCurrentAlert] = useState<SolarRecommendation | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertHistory, setAlertHistory] = useState<SolarRecommendation[]>([]);
  const { toast } = useToast();
  const previousConsumption = useRef(totalConsumption);
  const lastAlertTime = useRef(0);
  const alertCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const speak = (text: string, priority: 'normal' | 'urgent' = 'normal') => {
    if ('speechSynthesis' in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = priority === 'urgent' ? 0.9 : 1.0;
      utterance.pitch = priority === 'urgent' ? 1.1 : 1.0;
      utterance.volume = priority === 'urgent' ? 0.9 : 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const getAIAdvice = async () => {
    try {
      const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const { data, error } = await supabase.functions.invoke('energy-advisor', {
        body: {
          deviceData: devices,
          solarGeneration,
          currentTime
        }
      });

      if (error) throw error;

      const advice = data.advice;
      setResponse(advice);
      speak(advice);

      toast({
        title: "Energy Advisor",
        description: "Recommendation ready",
      });
    } catch (error) {
      console.error('Error getting AI advice:', error);
      toast({
        title: "Error",
        description: "Failed to get energy advice",
        variant: "destructive",
      });
    }
  };

  // Enhanced auto-alert system with solar recommendations
  useEffect(() => {
    if (!autoAlertEnabled) return;

    // Clear existing interval
    if (alertCheckInterval.current) {
      clearInterval(alertCheckInterval.current);
    }

    // Set up continuous monitoring
    alertCheckInterval.current = setInterval(() => {
      checkForAlerts();
    }, 10000); // Check every 10 seconds

    return () => {
      if (alertCheckInterval.current) {
        clearInterval(alertCheckInterval.current);
      }
    };
  }, [autoAlertEnabled, devices, solarGeneration, totalConsumption]);

  const checkForAlerts = () => {
    const timeSinceLastAlert = Date.now() - lastAlertTime.current;
    
    // Don't spam alerts - wait at least 2 minutes between alerts
    if (timeSinceLastAlert < 120000) return;

    const solarData: SolarData = {
      currentConsumption: totalConsumption,
      solarGeneration: solarGeneration,
      devices: devices,
      timeOfDay: new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit'
      }),
      date: new Date()
    };

    const recommendations = solarAdvisor.analyzeEnergySituation(solarData);
    
    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      
      // Only show high priority alerts immediately, others with delay
      if (topRecommendation.priority === 'high' || timeSinceLastAlert > 300000) { // 5 minutes for medium/low
        triggerAlert(topRecommendation);
      }
    }
  };

  const triggerAlert = (recommendation: SolarRecommendation) => {
    setCurrentAlert(recommendation);
    setShowAlertModal(true);
    setAlertHistory(prev => [recommendation, ...prev.slice(0, 4)]); // Keep last 5 alerts
    
    // Voice alert with appropriate priority
    speak(recommendation.voiceMessage, recommendation.priority === 'high' ? 'urgent' : 'normal');
    
    lastAlertTime.current = Date.now();
    
    // Toast notification
    const toastConfig = {
      title: getAlertIcon(recommendation.type) + " " + getAlertTitle(recommendation.type),
      description: recommendation.message,
      variant: recommendation.priority === 'high' ? 'destructive' : 'default' as const,
    };
    
    toast(toastConfig);
  };

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'high_consumption': return '⚡';
      case 'solar_opportunity': return '☀️';
      case 'peak_hours': return '⏰';
      case 'cost_saving': return '💰';
      default: return '🔔';
    }
  };

  const getAlertTitle = (type: string): string => {
    switch (type) {
      case 'high_consumption': return 'High Consumption Alert';
      case 'solar_opportunity': return 'Solar Opportunity';
      case 'peak_hours': return 'Peak Solar Hours';
      case 'cost_saving': return 'Cost Saving Opportunity';
      default: return 'Energy Alert';
    }
  };

  const handleImplementSuggestion = (suggestion: string) => {
    // Implement the suggestion logic here
    toast({
      title: "Suggestion Applied",
      description: `Applied: ${suggestion}`,
    });
    
    // Speak confirmation
    speak(`Applied suggestion: ${suggestion}`);
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("Listening...");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setIsListening(false);
        
        // Automatically get advice after user speaks
        getAIAdvice();
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "Error",
          description: "Speech recognition failed",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Card className="bg-gradient-subtle border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          AI Voice Energy Advisor
        </CardTitle>
        <CardDescription>
          Ask for device usage recommendations to maximize solar energy savings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Auto-alerts</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAlertEnabled}
                onChange={(e) => setAutoAlertEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">
                {autoAlertEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>

          {/* Alert History */}
          {alertHistory.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Alerts</span>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {alertHistory.slice(0, 3).map((alert, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{getAlertIcon(alert.type)}</span>
                    <span className="truncate">{alert.message}</span>
                    <Badge 
                      variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startListening}
            disabled={isListening || isSpeaking}
            className="flex-1"
            variant={isListening ? "destructive" : "default"}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2 animate-pulse" />
                Listening...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Ask for Advice
              </>
            )}
          </Button>
          <Button
            onClick={getAIAdvice}
            disabled={isListening || isSpeaking}
            variant="outline"
          >
            Get Advice
          </Button>
        </div>

        {transcript && (
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="text-xs text-muted-foreground mb-1">You said:</div>
            <div className="text-sm">{transcript}</div>
          </div>
        )}

        {response && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              AI Advisor:
            </div>
            <div className="text-sm whitespace-pre-wrap">{response}</div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          💡 Tip: Ask questions like "When should I use my AC?" or "How can I save power today?"
        </div>
      </CardContent>
    </Card>

    {/* Power Alert Modal */}
    {currentAlert && (
      <PowerAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        alertType={currentAlert.type}
        data={{
          currentConsumption: totalConsumption,
          solarGeneration: solarGeneration,
          highConsumptionDevices: devices.filter(d => d.isOn && d.consumption > 1.5),
          timeOfDay: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
          solarEfficiency: solarAdvisor.calculateSolarEfficiency ? 
            solarAdvisor.calculateSolarEfficiency(solarGeneration, totalConsumption) : 0,
          potentialSavings: currentAlert.potentialSavings
        }}
        onImplementSuggestion={handleImplementSuggestion}
      />
    )}
  </>
  );
};
