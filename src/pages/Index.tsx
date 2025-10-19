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

    // Set up real-time device listeners
    const handleDeviceUpdate = (connectedDevices: RealTimeDevice[]) => {
      setDevices(connectedDevices);
    };

    const handleSolarUpdate = (panels: SolarPanelData[]) => {
      setSolarPanels(panels);
      const totalGeneration = panels.reduce((sum, panel) => sum + panel.generation, 0);
      setSolarGeneration(totalGeneration);
    };

    // Add listeners
    realTimeDeviceService.addDeviceListener(handleDeviceUpdate);
    realTimeSolarService.addSolarListener(handleSolarUpdate);

    // Load existing devices from database
    loadExistingDevices();

    return () => {
      realTimeDeviceService.removeDeviceListener(handleDeviceUpdate);
      realTimeSolarService.removeSolarListener(handleSolarUpdate);
    };
  }, [user]);

  const loadExistingDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("user_devices")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert database devices to real-time devices
        for (const deviceData of data) {
          const realTimeDevice: RealTimeDevice = {
            id: deviceData.id,
            name: deviceData.name,
            type: deviceData.type,
            brand: deviceData.brand,
            model: deviceData.model,
            isConnected: deviceData.status === 'online',
            isOn: deviceData.is_on ?? false,
            consumption: Number(deviceData.consumption) || 0,
            maxConsumption: Number(deviceData.max_consumption) || 5.0,
            connectionType: deviceData.connection_type || 'wifi',
            ipAddress: deviceData.ip_address,
            macAddress: deviceData.mac_address,
            bluetoothId: deviceData.bluetooth_id,
            lastSeen: new Date(deviceData.last_seen || new Date()),
            status: deviceData.status || 'offline',
            capabilities: deviceData.capabilities || [],
            temperature: deviceData.temperature,
            mode: deviceData.mode,
            fanSpeed: deviceData.fan_speed,
            brightness: deviceData.brightness,
            color: deviceData.color
          };

          // Add to real-time service
          realTimeDeviceService.getConnectedDevicesMap().set(deviceData.id, realTimeDevice);
        }
      }
    } catch (error) {
      console.error('Failed to load existing devices:', error);
      toast({
        title: "Error",
        description: "Failed to load existing devices",
        variant: "destructive",
      });
    }
  };
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

  // Real-time solar generation is handled by the solar service

  const totalConsumption = devices.reduce((sum, device) => 
    sum + (device.isOn ? device.consumption : 0), 0
  );
  const netUsage = Math.max(0, totalConsumption - solarGeneration);
  const savings = solarGeneration * 6 * 30; // ₹6/kWh * 30 days (average Indian electricity rate)

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

    // Record consumption every hour
    const interval = setInterval(recordConsumption, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [devices, user]);

  const handleDeviceChange = async (deviceId: string, value: number) => {
    // For real-time devices, consumption is automatically managed
    // This function is kept for compatibility but consumption is read-only
    toast({
      title: "Info",
      description: "Consumption is automatically monitored in real-time",
    });
  };

  const handleDeviceToggle = useCallback(async (deviceId: string, isOn: boolean) => {
    try {
      setIsConnecting(true);
      
      // Use real-time device service to control device
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
    // Refresh devices from real-time service
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

  const recommendations = [
    {
      id: "1",
      title: "Optimize AC Usage",
      description: "Your AC is consuming peak power during solar generation hours. Consider increasing usage between 10 AM - 3 PM when solar is abundant.",
      savings: "₹1,840/month",
      priority: "high" as const,
    },
    {
      id: "2",
      title: "Schedule Heavy Appliances",
      description: "Run washing machine and dishwasher during peak solar hours to maximize renewable energy usage.",
      savings: "₹1,200/month",
      priority: "medium" as const,
    },
    {
      id: "3",
      title: "Smart Lighting Adjustment",
      description: "Reduce lighting by 20% during evening hours. Your current usage is 15% above optimal levels.",
      savings: "₹640/month",
      priority: "low" as const,
    },
  ];

  const devicesWithHandlers = devices.map(device => ({
    ...device,
    icon: getDeviceIcon(device.type),
    onConsumptionChange: (value: number) => handleDeviceChange(device.id, value),
    onToggle: (isOn: boolean) => handleDeviceToggle(device.id, isOn),
    // Real-time device properties
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
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-solar/10 border border-solar/20 animate-pulse-glow hover-lift">
                <Sun className="h-5 w-5 text-solar animate-rotate-slow" />
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
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="lg:col-span-2">
                <EnergyChart data={chartData} />
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
                <EnergyChart data={chartData} />
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
                <VoiceAssistant 
                  devices={devices} 
                  solarGeneration={solarGeneration}
                  totalConsumption={totalConsumption}
                />
              </div>
              <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <InteractiveAdvisor recommendations={recommendations} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
