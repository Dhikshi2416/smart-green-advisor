import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AirVent, Refrigerator, Tv, Lightbulb, Zap, Power } from "lucide-react";
import { AddDeviceDialog } from "./AddDeviceDialog";
import { DeviceConsumptionHistory } from "./DeviceConsumptionHistory";
import { useState } from "react";

interface Device {
  id: string;
  name: string;
  icon: React.ReactNode;
  consumption: number;
  maxConsumption: number;
  isOn: boolean;
  onConsumptionChange: (value: number) => void;
  onToggle: (isOn: boolean) => void;
}

interface DeviceListProps {
  devices: Device[];
}

const DeviceItem = ({ device }: { device: Device }) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 p-4 border-b border-border last:border-0 transition-all hover:bg-muted/50 rounded-lg hover:shadow-lg hover:-translate-x-1 hover:border-primary/50 group cursor-pointer">
        <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${device.isOn ? 'bg-primary/10 hover:bg-primary/20 animate-pulse-glow' : 'bg-muted'}`}>
          {device.icon}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium group-hover:text-primary transition-colors">{device.name}</span>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={device.isOn}
                  onCheckedChange={device.onToggle}
                />
                <Power className={`h-4 w-4 transition-all ${device.isOn ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded group-hover:bg-primary/20 group-hover:scale-105 transition-all">
                {device.isOn ? device.consumption.toFixed(1) : "0.0"} kWh
              </span>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-primary hover:text-primary/80 hover:scale-110 transition-all underline"
              >
                History
              </button>
            </div>
          </div>
          {device.isOn && (
            <>
              <Slider
                value={[device.consumption]}
                max={device.maxConsumption}
                step={0.1}
                onValueChange={(values) => device.onConsumptionChange(values[0])}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 kWh</span>
                <span>{device.maxConsumption.toFixed(1)} kWh</span>
              </div>
            </>
          )}
        </div>
      </div>
      {showHistory && (
        <div className="px-4 pb-4">
          <DeviceConsumptionHistory deviceId={device.id} deviceName={device.name} />
        </div>
      )}
    </>
  );
};

export const DeviceList = ({ devices }: DeviceListProps) => {
  const totalPower = devices.reduce((sum, d) => sum + d.consumption, 0);
  
  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 hover-glow card-gradient border-2 hover:border-primary/50">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
            <Zap className="h-5 w-5 text-primary animate-bounce-subtle" />
          </div>
          <h3 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">Device Simulator</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-primary">{totalPower.toFixed(1)} kWh</span>
          </div>
          <AddDeviceDialog />
        </div>
      </div>
      <div className="space-y-2">
        {devices.map((device, index) => (
          <div key={device.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <DeviceItem device={device} />
          </div>
        ))}
      </div>
    </Card>
  );
};

export const getDeviceIcon = (deviceType: string) => {
  const icons: Record<string, React.ReactNode> = {
    ac: <AirVent className="h-5 w-5 text-primary" />,
    fridge: <Refrigerator className="h-5 w-5 text-primary" />,
    refrigerator: <Refrigerator className="h-5 w-5 text-primary" />,
    tv: <Tv className="h-5 w-5 text-primary" />,
    lights: <Lightbulb className="h-5 w-5 text-primary" />,
    light: <Lightbulb className="h-5 w-5 text-primary" />,
    thermostat: <AirVent className="h-5 w-5 text-primary" />,
    washer: <Zap className="h-5 w-5 text-primary" />,
    outlet: <Zap className="h-5 w-5 text-primary" />,
  };
  return icons[deviceType] || <Zap className="h-5 w-5 text-primary" />;
};
