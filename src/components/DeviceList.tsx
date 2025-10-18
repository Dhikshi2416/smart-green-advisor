import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AirVent, Refrigerator, Tv, Lightbulb, Zap } from "lucide-react";
import { AddDeviceDialog } from "./AddDeviceDialog";

interface Device {
  id: string;
  name: string;
  icon: React.ReactNode;
  consumption: number;
  maxConsumption: number;
  onConsumptionChange: (value: number) => void;
}

interface DeviceListProps {
  devices: Device[];
}

const DeviceItem = ({ device }: { device: Device }) => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border last:border-0 transition-all hover:bg-muted/50 rounded-lg">
      <div className="p-2 rounded-lg bg-primary/10 transition-transform hover:scale-110 hover:bg-primary/20">
        {device.icon}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{device.name}</span>
          <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
            {device.consumption.toFixed(1)} kWh
          </span>
        </div>
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
      </div>
    </div>
  );
};

export const DeviceList = ({ devices }: DeviceListProps) => {
  const totalPower = devices.reduce((sum, d) => sum + d.consumption, 0);
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Device Simulator</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-primary">{totalPower.toFixed(1)} kWh</span>
          </div>
          <AddDeviceDialog />
        </div>
      </div>
      <div className="space-y-2">
        {devices.map((device) => (
          <DeviceItem key={device.id} device={device} />
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
