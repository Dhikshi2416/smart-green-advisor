import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AirVent, Refrigerator, Tv, Lightbulb, Zap } from "lucide-react";

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
    <div className="flex items-center gap-4 p-4 border-b border-border last:border-0">
      <div className="p-2 rounded-lg bg-primary/10">
        {device.icon}
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{device.name}</span>
          <span className="text-sm text-muted-foreground">
            {device.consumption.toFixed(1)} kWh
          </span>
        </div>
        <Slider
          value={[device.consumption]}
          max={device.maxConsumption}
          step={0.1}
          onValueChange={(values) => device.onConsumptionChange(values[0])}
          className="w-full"
        />
      </div>
    </div>
  );
};

export const DeviceList = ({ devices }: DeviceListProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Device Simulator</h3>
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
    tv: <Tv className="h-5 w-5 text-primary" />,
    lights: <Lightbulb className="h-5 w-5 text-primary" />,
  };
  return icons[deviceType] || <Zap className="h-5 w-5 text-primary" />;
};
