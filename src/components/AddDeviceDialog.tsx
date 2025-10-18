import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wifi, Bluetooth, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export function AddDeviceDialog() {
  const [open, setOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleScan = async (type: "wifi" | "bluetooth") => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    // Simulate device discovery
    setTimeout(() => {
      const mockDevices: Device[] = [
        { name: `${type === "wifi" ? "WiFi" : "BT"} Light 1`, type: "light", signal: Math.floor(Math.random() * 30) + 70 },
        { name: `${type === "wifi" ? "WiFi" : "BT"} Thermostat`, type: "thermostat", signal: Math.floor(Math.random() * 30) + 70 },
        { name: `${type === "wifi" ? "WiFi" : "BT"} TV`, type: "tv", signal: Math.floor(Math.random() * 30) + 70 },
      ];
      setDiscoveredDevices(mockDevices);
      setIsScanning(false);
      toast({
        title: "Scan complete",
        description: `Found ${mockDevices.length} devices`,
      });
    }, 2000);
  };

  const handleAddDevice = async (device: Device, connectionType: string) => {
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

      const { error } = await supabase.from("user_devices").insert({
        user_id: user.id,
        name: device.name,
        type: device.type,
        consumption: 0,
        status: "online",
        connection_type: connectionType,
      });

      if (error) throw error;

      toast({
        title: "Device added!",
        description: `${device.name} has been added to your home`,
      });
      setOpen(false);
      setDiscoveredDevices([]);
      setSelectedDevice(null);
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">Scan for Devices</TabsTrigger>
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleScan("wifi")}
                disabled={isScanning}
              >
                <Wifi className="h-8 w-8" />
                <span>Scan WiFi</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleScan("bluetooth")}
                disabled={isScanning}
              >
                <Bluetooth className="h-8 w-8" />
                <span>Scan Bluetooth</span>
              </Button>
            </div>

            {isScanning && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Scanning for devices...</span>
              </div>
            )}

            {discoveredDevices.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Discovered Devices</h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {discoveredDevices.map((device, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Signal: {device.signal}%
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddDevice(device, device.name.startsWith("WiFi") ? "wifi" : "bluetooth")}
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
