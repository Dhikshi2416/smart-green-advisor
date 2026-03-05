import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EnergyMetrics } from "@/components/EnergyMetrics";
import { EnergyChart } from "@/components/EnergyChart";
import { DeviceList, getDeviceIcon } from "@/components/DeviceList";
import { AIRecommendations } from "@/components/AIRecommendations";
import { InteractiveAdvisor } from "@/components/InteractiveAdvisor";
import { SolarPanelSimulation } from "@/components/SolarPanelSimulation";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { RealTimeAnalytics } from "@/components/RealTimeAnalytics";
import { Sun, Leaf, LayoutDashboard, Zap, TrendingUp, Lightbulb, LogOut, PanelTop } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { realTimeDeviceService, RealTimeDevice } from "@/services/realTimeDeviceService";
import { realTimeSolarService, SolarPanelData } from "@/services/realTimeSolarService";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devices, setDevices] = useState<RealTimeDevice[]>([]);
  const [solarPanels, setSolarPanels] = useState<SolarPanelData[]>([]);
  const [solarGeneration, setSolarGeneration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chartData, setChartData] = useState<Array<{ time: string; consumption: number; solar: number }>>([]);

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

  // Initialize real-time device monitoring
  useEffect(() => {
    if (!user) return;

    const handleDeviceUpdate = (connectedDevices: RealTimeDevice[]) => {
      setDevices(connectedDevices);
    };

    const handleSolarUpdate = (panels: SolarPanelData[]) => {
      setSolarPanels(panels);
      const totalGeneration = panels.reduce((sum, panel) => sum + panel.generation, 0);
      setSolarGeneration(totalGeneration);
    };

    realTimeDeviceService.addDeviceListener(handleDeviceUpdate);
    realTimeSolarService.addSolarListener(handleSolarUpdate);

    return () => {
      realTimeDeviceService.removeDeviceListener(handleDeviceUpdate);
      realTimeSolarService.removeSolarListener(handleSolarUpdate);
    };
  }, [user]);

  // Load real chart data from consumption history
  useEffect(() => {
    if (!user) return;

    const loadChartData = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const { data: historyData } = await supabase
        .from('device_consumption_history')
        .select('consumption, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', startOfDay.toISOString())
        .order('recorded_at', { ascending: true });

      // Build hourly data from real records
      const hourlyMap = new Map<string, number>();
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i.toString().padStart(2, '0') + ':00', 0);
      }

      if (historyData) {
        for (const record of historyData) {
          const hour = new Date(record.recorded_at).getHours();
          const key = hour.toString().padStart(2, '0') + ':00';
          hourlyMap.set(key, (hourlyMap.get(key) || 0) + Number(record.consumption));
        }
      }

      const data = Array.from(hourlyMap.entries()).map(([time, consumption]) => ({
        time,
        consumption: Number(consumption.toFixed(2)),
        solar: 0, // No solar panels connected
      }));

      setChartData(data);
    };

    loadChartData();
    // Refresh chart data every 30 seconds
    const interval = setInterval(loadChartData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const totalConsumption = devices.reduce((sum, device) => 
    sum + (device.isOn ? device.consumption : 0), 0
  );
  const netUsage = Math.max(0, totalConsumption - solarGeneration);
  const savings = solarGeneration * 6 * 30;

  // Record consumption history periodically
  useEffect(() => {
    if (!user) return;

    const recordConsumption = async () => {
      for (const device of devices) {
        if (device.isOn && device.consumption > 0) {
          await supabase
            .from("device_consumption_history")
            .insert({
              device_id: device.id,
              user_id: user.id,
              consumption: device.consumption,
            });
        }
      }
    };

    // Record every 5 minutes for real-time tracking
    const interval = setInterval(recordConsumption, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [devices, user]);

  const handleDeviceChange = async (deviceId: string, value: number) => {
    toast({
      title: "Info",
      description: "Consumption is automatically monitored in real-time",
    });
  };

  const handleDeviceToggle = useCallback(async (deviceId: string, isOn: boolean) => {
    try {
      setIsConnecting(true);
      const success = await realTimeDeviceService.controlDevice(deviceId, { power: isOn });
      if (success) {
        toast({
          title: "Device Updated",
          description: `Device ${isOn ? 'turned on' : 'turned off'} successfully`,
        });
      } else {
        throw new Error('Failed to control device');
      }
    } catch (error) {
      console.error('Device control error:', error);
      toast({
        title: "Error",
        description: "Failed to control device",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const handleDeviceRemoved = () => {
    const connectedDevices = realTimeDeviceService.getConnectedDevices();
    setDevices(connectedDevices);
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

  // Generate dynamic recommendations based on real device data
  const recommendations = generateRecommendations(devices, totalConsumption, solarGeneration);

  const devicesWithHandlers = devices.map(device => ({
    ...device,
    icon: getDeviceIcon(device.type),
    onConsumptionChange: (value: number) => handleDeviceChange(device.id, value),
    onToggle: (isOn: boolean) => handleDeviceToggle(device.id, isOn),
    isConnected: device.isConnected,
    status: device.status,
    connectionType: device.connectionType,
    lastSeen: device.lastSeen,
    temperature: device.temperature,
    mode: device.mode,
    fanSpeed: device.fanSpeed,
    brightness: device.brightness,
    color: device.color,
    brand: device.brand,
    model: device.model,
    capabilities: device.capabilities
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-gradient-subtle backdrop-blur-xl shadow-lg animate-slide-up">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="p-2 rounded-lg bg-gradient-primary shadow-elegant hover:scale-110 hover:rotate-12 transition-all duration-300 animate-float">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">GreenHome Genius</h1>
                <p className="text-sm text-muted-foreground">AI Advisor for Sustainable Homes</p>
              </div>
            </div>
            <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-solar/10 border border-solar/20 hover-lift">
                <Sun className="h-5 w-5 text-solar" />
                <span className="text-sm font-medium">Solar: {solarGeneration.toFixed(1)} kW</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="hover-lift">
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
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5 h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="solar" className="flex items-center gap-2 py-3">
              <PanelTop className="h-4 w-4" />
              <span className="hidden sm:inline">Solar</span>
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
          <TabsContent value="dashboard" className="space-y-6">
            <div className="animate-scale-in">
              <EnergyMetrics
                totalConsumption={totalConsumption}
                solarGeneration={solarGeneration}
                netUsage={netUsage}
                savings={savings}
                devicesCount={devices.filter(d => d.isOn).length}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:col-span-2">
                <EnergyChart data={chartData} hasDevices={devices.length > 0} />
              </div>
              <VoiceAssistant 
                devices={devices} 
                solarGeneration={solarGeneration}
                totalConsumption={totalConsumption}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <AIRecommendations recommendations={recommendations.slice(0, 2)} />
            </div>
          </TabsContent>

          {/* Solar Panel Tab */}
          <TabsContent value="solar" className="space-y-6">
            <div className="animate-scale-in">
              <SolarPanelSimulation 
                solarGeneration={solarGeneration}
                chartData={chartData}
              />
            </div>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-slide-up">
                <DeviceList devices={devicesWithHandlers} onDeviceRemoved={handleDeviceRemoved} />
              </div>
              <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <EnergyChart data={chartData} hasDevices={devices.length > 0} />
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <RealTimeAnalytics userId={user?.id || ''} />
          </TabsContent>

          {/* AI Advisor Tab */}
          <TabsContent value="advisor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-slide-up">
                <AIRecommendations recommendations={recommendations} />
              </div>
              <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <VoiceAssistant 
                  devices={devices} 
                  solarGeneration={solarGeneration}
                  totalConsumption={totalConsumption}
                />
              </div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <InteractiveAdvisor recommendations={recommendations} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/**
 * Generate recommendations dynamically from real device data
 */
function generateRecommendations(devices: RealTimeDevice[], totalConsumption: number, solarGeneration: number) {
  const recommendations: Array<{
    id: string;
    title: string;
    description: string;
    savings: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  if (devices.length === 0) {
    recommendations.push({
      id: "no-devices",
      title: "Connect Your Devices",
      description: "No devices are connected yet. Add your smart home devices to start monitoring energy consumption in real-time.",
      savings: "₹0/month",
      priority: "high",
    });
    return recommendations;
  }

  const activeDevices = devices.filter(d => d.isOn);
  const activeCount = activeDevices.length;

  if (totalConsumption > 3.0) {
    recommendations.push({
      id: "high-consumption",
      title: "High Energy Consumption Alert",
      description: `You have ${activeCount} devices consuming ${totalConsumption.toFixed(1)} kW. Consider turning off non-essential devices to reduce costs.`,
      savings: `₹${(totalConsumption * 0.3 * 8.5 * 30).toFixed(0)}/month`,
      priority: "high",
    });
  }

  const acDevices = activeDevices.filter(d => d.type === 'ac');
  if (acDevices.length > 0) {
    const acConsumption = acDevices.reduce((s, d) => s + d.consumption, 0);
    recommendations.push({
      id: "ac-optimize",
      title: "Optimize AC Usage",
      description: `${acDevices.length} AC unit(s) consuming ${acConsumption.toFixed(1)} kW. Increase temperature by 2°C to save 15% on cooling.`,
      savings: `₹${(acConsumption * 0.15 * 8.5 * 30).toFixed(0)}/month`,
      priority: "medium",
    });
  }

  if (solarGeneration === 0 && totalConsumption > 0) {
    recommendations.push({
      id: "solar-suggestion",
      title: "Consider Solar Panels",
      description: `You're using ${totalConsumption.toFixed(1)} kW entirely from the grid. Installing solar panels could offset your consumption significantly.`,
      savings: `₹${(totalConsumption * 0.6 * 8.5 * 30).toFixed(0)}/month`,
      priority: "medium",
    });
  }

  if (activeCount > 0 && totalConsumption <= 3.0) {
    recommendations.push({
      id: "efficient",
      title: "Good Energy Efficiency",
      description: `Your ${activeCount} active device(s) are consuming ${totalConsumption.toFixed(1)} kW, which is within optimal range. Keep it up!`,
      savings: "Optimized",
      priority: "low",
    });
  }

  return recommendations;
}

export default Index;
