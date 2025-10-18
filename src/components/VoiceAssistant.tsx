import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceAssistantProps {
  devices: Array<{ name: string; consumption: number; type: string }>;
  solarGeneration: number;
}

export const VoiceAssistant = ({ devices, solarGeneration }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

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
