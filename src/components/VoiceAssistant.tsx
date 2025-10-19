import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { toast } = useToast();
  const previousConsumption = useRef(totalConsumption);
  const lastAlertTime = useRef(0);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
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

  // Auto-trigger voice advice when consumption increases significantly
  useEffect(() => {
    if (!autoAlertEnabled) return;

    const consumptionIncrease = totalConsumption - previousConsumption.current;
    const timeSinceLastAlert = Date.now() - lastAlertTime.current;
    
    // Trigger if consumption increased by more than 1 kWh and it's been at least 30 seconds since last alert
    if (consumptionIncrease > 1.0 && timeSinceLastAlert > 30000) {
      const highConsumptionDevices = devices
        .filter(d => d.isOn && d.consumption > 2.0)
        .map(d => d.name)
        .join(", ");

      if (highConsumptionDevices) {
        const alertMessage = `Alert! Your power consumption has increased significantly. High consumption devices: ${highConsumptionDevices}. Consider switching to solar energy or reducing usage.`;
        
        speak(alertMessage);
        setResponse(alertMessage);
        setTranscript("Auto-alert: High power consumption detected");
        
        lastAlertTime.current = Date.now();
        
        toast({
          title: "⚡ High Consumption Alert",
          description: "AI advisor has suggestions to reduce power usage",
          variant: "default",
        });
      }
    }
    
    previousConsumption.current = totalConsumption;
  }, [totalConsumption, devices, autoAlertEnabled]);

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
  );
};
