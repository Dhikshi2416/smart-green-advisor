import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnergyMetrics } from "@/components/EnergyMetrics";
import { EnergyChart } from "@/components/EnergyChart";
import { DeviceList, getDeviceIcon } from "@/components/DeviceList";
import { AIRecommendations } from "@/components/AIRecommendations";
import { InteractiveAdvisor } from "@/components/InteractiveAdvisor";
import { Sun, Leaf, LayoutDashboard, Zap, TrendingUp, Lightbulb, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState([
    { id: "ac", name: "Air Conditioning", consumption: 2.5, maxConsumption: 5.0, type: "ac" },
    { id: "fridge", name: "Refrigerator", consumption: 1.2, maxConsumption: 2.0, type: "fridge" },
    { id: "tv", name: "Television", consumption: 0.3, maxConsumption: 1.0, type: "tv" },
    { id: "lights", name: "Smart Lights", consumption: 0.5, maxConsumption: 1.5, type: "lights" },
  ]);

  const [solarGeneration, setSolarGeneration] = useState(3.2);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load user devices
  useEffect(() => {
    if (!user) return;

    const loadDevices = async () => {
      const { data, error } = await supabase
        .from("user_devices")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load devices",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        setDevices(data.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          consumption: Number(d.consumption),
          maxConsumption: 5.0, // Default max consumption
        })));
      }
    };

    loadDevices();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("user_devices_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_devices",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
  const [chartData, setChartData] = useState<Array<{ time: string; consumption: number; solar: number }>>([]);

  // Generate initial chart data
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
        const consumption = Math.random() * 3 + 2;
        const solar = hour.getHours() >= 6 && hour.getHours() <= 18 
          ? Math.random() * 4 + 1 
          : 0;
        data.push({ time: hourStr, consumption, solar });
      }
      return data;
    };
    setChartData(generateChartData());
  }, []);

  // Simulate solar generation changes
  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 18) {
        setSolarGeneration(prev => Math.max(0, prev + (Math.random() - 0.5) * 0.5));
      } else {
        setSolarGeneration(0);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalConsumption = devices.reduce((sum, device) => sum + device.consumption, 0);
  const netUsage = Math.max(0, totalConsumption - solarGeneration);
  const savings = solarGeneration * 0.15 * 30; // $0.15/kWh * 30 days

  const handleDeviceChange = async (deviceId: string, value: number) => {
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, consumption: value } : d));
    
    // Update in database
    await supabase
      .from("user_devices")
      .update({ consumption: value })
      .eq("id", deviceId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <Zap className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const recommendations = [
    {
      id: "1",
      title: "Optimize AC Usage",
      description: "Your AC is consuming peak power during solar generation hours. Consider increasing usage between 10 AM - 3 PM when solar is abundant.",
      savings: "$23/month",
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Schedule Heavy Appliances",
      description: "Run washing machine and dishwasher during peak solar hours to maximize renewable energy usage.",
      savings: "$15/month",
      priority: "medium" as const,
    },
    {
      id: "3",
      title: "Smart Lighting Adjustment",
      description: "Reduce lighting by 20% during evening hours. Your current usage is 15% above optimal levels.",
      savings: "$8/month",
      priority: "low" as const,
    },
  ];

  const devicesWithHandlers = devices.map(device => ({
    ...device,
    icon: getDeviceIcon(device.type),
    onConsumptionChange: (value: number) => handleDeviceChange(device.id, value),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-gradient-subtle backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary shadow-elegant hover:scale-105 transition-transform">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Green AI Smart Home</h1>
                <p className="text-sm text-muted-foreground">Energy Advisor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-solar/10 border border-solar/20 animate-pulse">
                <Sun className="h-5 w-5 text-solar" />
                <span className="text-sm font-medium">Solar: {solarGeneration.toFixed(1)} kW</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2 py-3">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 py-3">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-2 py-3">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">AI Advisor</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <EnergyMetrics
              totalConsumption={totalConsumption}
              solarGeneration={solarGeneration}
              netUsage={netUsage}
              savings={savings}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnergyChart data={chartData} />
              <AIRecommendations recommendations={recommendations.slice(0, 2)} />
            </div>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DeviceList devices={devicesWithHandlers} />
              <EnergyChart data={chartData} />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <EnergyMetrics
              totalConsumption={totalConsumption}
              solarGeneration={solarGeneration}
              netUsage={netUsage}
              savings={savings}
            />
            <EnergyChart data={chartData} />
          </TabsContent>

          {/* AI Advisor Tab */}
          <TabsContent value="advisor" className="space-y-6 animate-fade-in">
            <InteractiveAdvisor recommendations={recommendations} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
