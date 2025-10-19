import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, Chrome, Globe, Smartphone } from "lucide-react";

interface DeviceScanningInfoProps {
  capabilities: {
    bluetooth: boolean;
    wifi: boolean;
    webRTC: boolean;
    webUSB: boolean;
    webSerial: boolean;
  };
}

export function DeviceScanningInfo({ capabilities }: DeviceScanningInfoProps) {
  return (
    <div className="space-y-4">
      {/* Browser Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Browser Compatibility
          </CardTitle>
          <CardDescription>
            Device scanning capabilities vary by browser and platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Chrome className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Chrome/Edge</span>
              </div>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">Bluetooth</Badge>
                <Badge variant="secondary" className="text-xs">WiFi</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Firefox</span>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">Limited</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Mobile</span>
              </div>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">Bluetooth</Badge>
                <Badge variant="outline" className="text-xs">WiFi</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Safari</span>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-xs">Limited</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Current Device Capabilities
          </CardTitle>
          <CardDescription>
            What your current browser and device can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              capabilities.bluetooth ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              {capabilities.bluetooth ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Bluetooth</span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              capabilities.wifi ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              {capabilities.wifi ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">WiFi</span>
            </div>
            
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              capabilities.webRTC ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}>
              {capabilities.webRTC ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm font-medium">Network</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Important Notes</AlertTitle>
        <AlertDescription className="space-y-2">
          <p><strong>Bluetooth Scanning:</strong> Requires user permission and works best with Chrome/Edge on desktop or mobile.</p>
          <p><strong>WiFi Scanning:</strong> Limited by browser security. We use network discovery methods to find smart home devices.</p>
          <p><strong>Device Compatibility:</strong> Not all devices will be discoverable. Some may require specific apps or setup.</p>
          <p><strong>Privacy:</strong> Device scanning only works with devices that are in pairing/discovery mode.</p>
        </AlertDescription>
      </Alert>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Bluetooth Issues:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Make sure Bluetooth is enabled on your device</li>
              <li>• Ensure devices are in pairing mode</li>
              <li>• Try refreshing the page and scanning again</li>
              <li>• Use Chrome or Edge for best compatibility</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">WiFi Issues:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Ensure you're on the same network as your devices</li>
              <li>• Some devices may not be discoverable via web browsers</li>
              <li>• Try the manual device addition option</li>
              <li>• Check if devices support UPnP or mDNS</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
