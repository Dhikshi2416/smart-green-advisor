import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingDown, Clock, MessageSquare, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  savings: string;
  priority: "high" | "medium" | "low";
  implemented?: boolean;
}

interface InteractiveAdvisorProps {
  recommendations: Recommendation[];
}

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-solar/10 text-solar-foreground border-solar/20",
  low: "bg-primary/10 text-primary border-primary/20",
};

export const InteractiveAdvisor = ({ recommendations }: InteractiveAdvisorProps) => {
  const [implementedIds, setImplementedIds] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ type: 'user' | 'ai', message: string }>>([
    { type: 'ai', message: "Hello! I'm your AI Energy Advisor. I can help you optimize your energy usage. Ask me anything about your energy consumption!" }
  ]);

  const handleImplement = (id: string) => {
    setImplementedIds(prev => new Set(prev).add(id));
  };

  const handleAskQuestion = () => {
    if (!question.trim()) return;
    
    setChatMessages(prev => [...prev, { type: 'user', message: question }]);
    
    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your current usage patterns, I recommend running heavy appliances during peak solar hours (10 AM - 3 PM) to maximize renewable energy usage.",
        "Great question! Your AC consumes the most energy. Consider setting it to 24°C instead of 22°C to save up to 15% on cooling costs.",
        "I've analyzed your data. Shifting your washing machine and dishwasher schedules to midday can save you approximately $18/month.",
        "Your lighting is quite efficient! However, consider using motion sensors for outdoor lights to reduce unnecessary usage by up to 30%."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { type: 'ai', message: randomResponse }]);
    }, 1000);
    
    setQuestion("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* AI Recommendations Panel */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Smart Recommendations</h3>
            <p className="text-xs text-muted-foreground">AI-powered energy saving tips</p>
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {recommendations.map((rec, index) => {
              const isImplemented = implementedIds.has(rec.id);
              return (
                <div 
                  key={rec.id} 
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isImplemented 
                      ? 'bg-primary/5 border-primary/30 opacity-75' 
                      : 'bg-gradient-subtle border-border hover:shadow-md hover:border-primary/30'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      {isImplemented && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      {rec.title}
                    </h4>
                    <Badge className={priorityColors[rec.priority]} variant="outline">
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {rec.description}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                        <TrendingDown className="h-3 w-3" />
                        Save {rec.savings}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Immediate
                      </span>
                    </div>
                    {!isImplemented && (
                      <Button 
                        size="sm" 
                        onClick={() => handleImplement(rec.id)}
                        className="h-7 text-xs"
                      >
                        Mark Done
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Interactive Chat Panel */}
      <Card className="p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-gradient-primary animate-pulse">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Chat Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask me anything about energy</p>
          </div>
        </div>

        <ScrollArea className="flex-1 h-[400px] pr-4 mb-4">
          <div className="space-y-4">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user' 
                      ? 'bg-primary text-primary-foreground ml-4' 
                      : 'bg-muted mr-4'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.type === 'ai' && <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input 
            placeholder="Ask about energy optimization..." 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            className="flex-1"
          />
          <Button 
            onClick={handleAskQuestion}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Suggestions: "How can I reduce my AC costs?" • "When should I run my dishwasher?" • "Solar optimization tips"
          </p>
        </div>
      </Card>
    </div>
  );
};