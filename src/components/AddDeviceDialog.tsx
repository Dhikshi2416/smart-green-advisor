import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wifi, Bluetooth, Loader2, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deviceScanner, ScannedDevice } from "@/services/deviceScanner";
import { DeviceScanningInfo } from "./DeviceScanningInfo";
import { realTimeDeviceService } from "@/services/realTimeDeviceService";

interface Device {
  name: string;
  type: string;
  signal?: number;
}

const DEVICE_TYPES = [
  { value: "light", label: "Smart Light" },
  { value: "thermostat", label: "Thermostat" },
  { value: "tv", label: "Smart TV" },
  { value: "refrigerator", label: "Refrigerator" },
  { value: "ac", label: "Air Conditioner" },
  { value: "washer", label: "Washing Machine" },
  { value: "outlet", label: "Smart Outlet" },
];

// Helper function to determine device type from device name
const getDeviceTypeFromName = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('light') || lowerName.includes('bulb') || lowerName.includes('lamp')) {
    return 'light';
  } else if (lowerName.includes('thermostat') || lowerName.includes('temperature')) {
    return 'thermostat';
  } else if (lowerName.includes('tv') || lowerName.includes('television')) {
    return 'tv';
  } else if (lowerName.includes('fridge') || lowerName.includes('refrigerator')) {
    return 'refrigerator';
  } else if (lowerName.includes('ac') || lowerName.includes('air') || lowerName.includes('conditioner')) {
    return 'ac';
  } else if (lowerName.includes('washer') || lowerName.includes('washing')) {
    return 'washer';
  } else if (lowerName.includes('outlet') || lowerName.includes('switch') || lowerName.includes('plug')) {
    return 'outlet';
  } else if (lowerName.includes('speaker') || lowerName.includes('homepod') || lowerName.includes('echo')) {
    return 'speaker';
  } else {
    return 'outlet'; // Default fallback
  }
};

export function AddDeviceDialog() {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<ScannedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ScannedDevice | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState(deviceScanner.getCapabilities());
  const { toast } = useToast();

  const handleScan = async (type: "wifi" | "bluetooth") => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    setScanError(null);

    try {
      let devices: ScannedDevice[] = [];

      if (type === "bluetooth") {
        if (!capabilities.bluetooth) {
          throw new Error("Bluetooth is not available on this device. Please use a supported browser like Chrome, Edge, or Opera.");
        }
        devices = await deviceScanner.scanBluetoothDevices({
          timeout: 10000,
          includeUnnamed: true
        });
      } else {
        if (!capabilities.wifi) {
          throw new Error("WiFi scanning is limited by browser security. Some devices may not be discoverable.");
        }
        devices = await deviceScanner.scanWiFiDevices({
          timeout: 15000,
          includeUnnamed: false
        });
      }

      setDiscoveredDevices(devices);
      
      if (devices.length === 0) {
        toast({
          title: "No devices found",
          description: type === "bluetooth" 
            ? "Make sure your Bluetooth devices are in pairing mode and nearby."
            : "No smart home devices found on your network. Try adding devices manually.",
          variant: "default"
        });
      } else {
        toast({
          title: "Scan complete",
          description: `Found ${devices.length} ${type} device${devices.length > 1 ? 's' : ''}`,
        });
      }
    } catch (error: any) {
      setScanError(error.message);
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddDevice = async (device: ScannedDevice, connectionType: string) => {
    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add devices",
          variant: "destructive",
        });
        return;
      }

      // Determine device type from name or use a default
      const deviceType = getDeviceTypeFromName(device.name);
      
      // Connect to the real device using the real-time service
      let connectedDevice;
      if (connectionType === 'wifi') {
        connectedDevice = await realTimeDeviceService.connectWiFiDevice({
          name: device.name,
          type: deviceType,
          ipAddress: device.address || '192.168.1.100', // Default IP if not provided
          brand: device.manufacturer,
          model: device.name
        });
      } else {
        connectedDevice = await realTimeDeviceService.connectBluetoothDevice({
          name: device.name,
          type: deviceType,
          bluetoothId: device.id,
          brand: device.manufacturer,
          model: device.name
        });
      }

      toast({
        title: "Device Connected!",
        description: `${device.name} has been connected and added to your home`,
      });
      setOpen(false);
      setDiscoveredDevices([]);
      setSelectedDevice(null);
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to device",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add devices",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("user_devices").insert({
        user_id: user.id,
        name,
        type,
        consumption: 0,
        status: "offline",
        connection_type: "manual",
      });

      if (error) throw error;

      toast({
        title: "Device added!",
        description: `${name} has been added to your home`,
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add device",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Scan for devices or add manually
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scan">Scan for Devices</TabsTrigger>
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
            <TabsTrigger value="info">Info & Help</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            {/* Device Capabilities Info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Device Capabilities</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${capabilities.bluetooth ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {capabilities.bluetooth ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  Bluetooth
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${capabilities.wifi ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {capabilities.wifi ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  WiFi
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${capabilities.webRTC ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {capabilities.webRTC ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  Network
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleScan("wifi")}
                disabled={isScanning || !capabilities.wifi}
              >
                <Wifi className={`h-8 w-8 ${capabilities.wifi ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>Scan WiFi</span>
                {!capabilities.wifi && <span className="text-xs text-muted-foreground">Limited</span>}
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleScan("bluetooth")}
                disabled={isScanning || !capabilities.bluetooth}
              >
                <Bluetooth className={`h-8 w-8 ${capabilities.bluetooth ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>Scan Bluetooth</span>
                {!capabilities.bluetooth && <span className="text-xs text-muted-foreground">Not Available</span>}
              </Button>
            </div>

            {isScanning && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Scanning for devices...</span>
              </div>
            )}

            {scanError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Scan Error</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">{scanError}</p>
              </div>
            )}

            {discoveredDevices.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Discovered Devices</h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {discoveredDevices.map((device, index) => (
                    <div
                      key={device.id || index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{device.name}</p>
                          <div className={`px-2 py-1 rounded text-xs ${
                            device.type === 'bluetooth' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {device.type.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {device.signal && (
                            <p>Signal: {device.signal}%</p>
                          )}
                          {device.address && (
                            <p>Address: {device.address}</p>
                          )}
                          {device.manufacturer && (
                            <p>Manufacturer: {device.manufacturer}</p>
                          )}
                          {device.services && device.services.length > 0 && (
                            <p>Services: {device.services.length} available</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddDevice(device, device.type)}
                        disabled={isAdding}
                      >
                        {isAdding ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Living Room Light"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Device Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Device"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <DeviceScanningInfo capabilities={capabilities} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
