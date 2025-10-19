import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { realTimeDeviceService } from "@/services/realTimeDeviceService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeviceRemoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  device: {
    id: string;
    name: string;
    type: string;
    brand?: string;
    isConnected: boolean;
  };
  onDeviceRemoved: () => void;
}

export function DeviceRemoveDialog({ 
  isOpen, 
  onClose, 
  device, 
  onDeviceRemoved 
}: DeviceRemoveDialogProps) {
  const { toast } = useToast();

  const handleRemoveDevice = async () => {
    try {
      // Disconnect from real-time service
      await realTimeDeviceService.disconnectDevice(device.id);
      
      // Remove from database
      const { error } = await supabase
        .from("user_devices")
        .delete()
        .eq("id", device.id);

      if (error) throw error;

      // Remove consumption history
      await supabase
        .from("device_consumption_history")
        .delete()
        .eq("device_id", device.id);

      toast({
        title: "Device Removed",
        description: `${device.name} has been removed from your home`,
      });

      onDeviceRemoved();
      onClose();
    } catch (error: any) {
      console.error('Failed to remove device:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove device",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>Remove Device</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this device from your home?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Device Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{device.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Type: {device.type}</p>
                  {device.brand && <p>Brand: {device.brand}</p>}
                  <p>Status: {device.isConnected ? 'Connected' : 'Disconnected'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Warning</p>
                <p className="text-red-700 mt-1">
                  This action will permanently remove the device and all its data including:
                </p>
                <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                  <li>Device connection and settings</li>
                  <li>Consumption history and analytics</li>
                  <li>All saved preferences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemoveDevice}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Device
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
