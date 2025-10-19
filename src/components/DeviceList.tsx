import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AirVent, Refrigerator, Tv, Lightbulb, Zap, Power, Wifi, Bluetooth, AlertCircle, CheckCircle, Clock, MoreVertical, Trash2, Settings } from "lucide-react";
import { AddDeviceDialog } from "./AddDeviceDialog";
import { DeviceConsumptionHistory } from "./DeviceConsumptionHistory";
import { DeviceRemoveDialog } from "./DeviceRemoveDialog";
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
  // Real-time properties
  isConnected?: boolean;
  status?: 'online' | 'offline' | 'connecting' | 'error';
  connectionType?: 'wifi' | 'bluetooth' | 'zigbee' | 'z-wave';
  lastSeen?: Date;
  temperature?: number;
  mode?: string;
  fanSpeed?: number;
  brightness?: number;
  color?: string;
  brand?: string;
  model?: string;
  capabilities?: string[];
}

interface DeviceListProps {
  devices: Device[];
}

const DeviceItem = ({ device, onDeviceRemoved }: { device: Device; onDeviceRemoved: () => void }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const getStatusIcon = () => {
    if (!device.isConnected) return <AlertCircle className="h-3 w-3 text-red-500" />;
    if (device.status === 'online') return <CheckCircle className="h-3 w-3 text-green-500" />;
    if (device.status === 'connecting') return <Clock className="h-3 w-3 text-yellow-500 animate-spin" />;
    return <AlertCircle className="h-3 w-3 text-red-500" />;
  };

  const getConnectionIcon = () => {
    switch (device.connectionType) {
      case 'wifi': return <Wifi className="h-3 w-3" />;
      case 'bluetooth': return <Bluetooth className="h-3 w-3" />;
      default: return <Zap className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    if (!device.isConnected) return 'border-red-200 bg-red-50';
    if (device.status === 'online') return 'border-green-200 bg-green-50';
    if (device.status === 'connecting') return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <>
      <div className={`flex items-center gap-4 p-4 border-b border-border last:border-0 transition-all hover:bg-muted/50 rounded-lg hover:shadow-lg hover:-translate-x-1 hover:border-primary/50 group cursor-pointer ${getStatusColor()}`}>
        <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${device.isOn ? 'bg-primary/10 hover:bg-primary/20 animate-pulse-glow' : 'bg-muted'}`}>
          {device.icon}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium group-hover:text-primary transition-colors">{device.name}</span>
                {device.brand && (
                  <Badge variant="outline" className="text-xs">
                    {device.brand}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={device.isOn}
                  onCheckedChange={device.onToggle}
                  disabled={!device.isConnected}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowHistory(!showHistory)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Device
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Real-time device status and info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="capitalize">{device.status || 'unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              {getConnectionIcon()}
              <span className="capitalize">{device.connectionType || 'unknown'}</span>
            </div>
            {device.lastSeen && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(device.lastSeen).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Device-specific real-time data */}
          {(device.temperature || device.mode || device.fanSpeed || device.brightness) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {device.temperature && (
                <span>🌡️ {device.temperature}°C</span>
              )}
              {device.mode && (
                <span>⚙️ {device.mode}</span>
              )}
              {device.fanSpeed && (
                <span>🌀 Speed {device.fanSpeed}</span>
              )}
              {device.brightness && (
                <span>💡 {device.brightness}%</span>
              )}
            </div>
          )}

          {device.isOn && device.isConnected && (
            <>
              <Slider
                value={[device.consumption]}
                max={device.maxConsumption}
                step={0.1}
                onValueChange={(values) => device.onConsumptionChange(values[0])}
                className="w-full cursor-pointer"
                disabled={true} // Real-time consumption is read-only
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 kWh</span>
                <span>{device.maxConsumption.toFixed(1)} kWh</span>
              </div>
            </>
          )}

          {!device.isConnected && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Device disconnected. Check your network connection.
            </div>
          )}
        </div>
      </div>
      {showHistory && (
        <div className="px-4 pb-4">
          <DeviceConsumptionHistory deviceId={device.id} deviceName={device.name} />
        </div>
      )}

      {/* Remove Device Dialog */}
      <DeviceRemoveDialog
        isOpen={showRemoveDialog}
        onClose={() => setShowRemoveDialog(false)}
        device={{
          id: device.id,
          name: device.name,
          type: device.type,
          brand: device.brand,
          isConnected: device.isConnected || false
        }}
        onDeviceRemoved={onDeviceRemoved}
      />
    </>
  );
};

export const DeviceList = ({ devices, onDeviceRemoved }: DeviceListProps & { onDeviceRemoved: () => void }) => {
  const totalPower = devices.reduce((sum, d) => sum + d.consumption, 0);
  
  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 hover-glow card-gradient border-2 hover:border-primary/50">
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
            <Zap className="h-5 w-5 text-primary animate-bounce-subtle" />
          </div>
          <h3 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">Smart Devices</h3>
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
            <DeviceItem device={device} onDeviceRemoved={onDeviceRemoved} />
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
