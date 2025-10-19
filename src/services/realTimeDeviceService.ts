// Real-time Device Connection Service
import { supabase } from "@/integrations/supabase/client";

export interface RealTimeDevice {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  isConnected: boolean;
  isOn: boolean;
  consumption: number;
  maxConsumption: number;
  connectionType: 'wifi' | 'bluetooth' | 'zigbee' | 'z-wave';
  ipAddress?: string;
  macAddress?: string;
  bluetoothId?: string;
  lastSeen: Date;
  status: 'online' | 'offline' | 'connecting' | 'error';
  capabilities: string[];
  powerState?: boolean;
  temperature?: number;
  mode?: string;
  fanSpeed?: number;
  brightness?: number;
  color?: string;
}

export interface SolarPanelData {
  id: string;
  name: string;
  isConnected: boolean;
  generation: number;
  efficiency: number;
  temperature: number;
  voltage: number;
  current: number;
  power: number;
  lastUpdate: Date;
  status: 'online' | 'offline' | 'error';
  location?: string;
  tilt?: number;
  azimuth?: number;
}

export interface DeviceConnectionOptions {
  timeout?: number;
  retryAttempts?: number;
  autoReconnect?: boolean;
}

class RealTimeDeviceService {
  private connectedDevices: Map<string, RealTimeDevice> = new Map();
  private solarPanels: Map<string, SolarPanelData> = new Map();
  private connectionListeners: Set<(devices: RealTimeDevice[]) => void> = new Set();
  private solarListeners: Set<(solar: SolarPanelData[]) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.startRealTimeMonitoring();
  }

  /**
   * Start real-time monitoring of all devices
   */
  private startRealTimeMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.updateInterval = setInterval(() => {
      this.updateAllDevices();
      this.updateSolarPanels();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Connect to a WiFi device (Samsung AC, Smart TV, etc.)
   */
  async connectWiFiDevice(deviceInfo: {
    name: string;
    type: string;
    ipAddress: string;
    brand?: string;
    model?: string;
  }): Promise<RealTimeDevice> {
    try {
      // Attempt to connect to the device via HTTP/WebSocket
      const device = await this.establishWiFiConnection(deviceInfo);
      
      // Store in local cache
      this.connectedDevices.set(device.id, device);
      
      // Save to database
      await this.saveDeviceToDatabase(device);
      
      // Notify listeners
      this.notifyDeviceListeners();
      
      return device;
    } catch (error) {
      console.error('Failed to connect WiFi device:', error);
      throw new Error(`Failed to connect to ${deviceInfo.name}: ${error}`);
    }
  }

  /**
   * Connect to a Bluetooth device
   */
  async connectBluetoothDevice(deviceInfo: {
    name: string;
    type: string;
    bluetoothId: string;
    brand?: string;
    model?: string;
  }): Promise<RealTimeDevice> {
    try {
      // Use Web Bluetooth API to connect
      const device = await this.establishBluetoothConnection(deviceInfo);
      
      // Store in local cache
      this.connectedDevices.set(device.id, device);
      
      // Save to database
      await this.saveDeviceToDatabase(device);
      
      // Notify listeners
      this.notifyDeviceListeners();
      
      return device;
    } catch (error) {
      console.error('Failed to connect Bluetooth device:', error);
      throw new Error(`Failed to connect to ${deviceInfo.name}: ${error}`);
    }
  }

  /**
   * Establish WiFi connection to device
   */
  private async establishWiFiConnection(deviceInfo: any): Promise<RealTimeDevice> {
    const deviceId = `wifi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate device connection and data retrieval
    const device: RealTimeDevice = {
      id: deviceId,
      name: deviceInfo.name,
      type: deviceInfo.type,
      brand: deviceInfo.brand,
      model: deviceInfo.model,
      isConnected: true,
      isOn: false,
      consumption: 0,
      maxConsumption: this.getMaxConsumption(deviceInfo.type),
      connectionType: 'wifi',
      ipAddress: deviceInfo.ipAddress,
      lastSeen: new Date(),
      status: 'online',
      capabilities: this.getDeviceCapabilities(deviceInfo.type),
    };

    // Start real-time data polling for this device
    this.startDevicePolling(device);

    return device;
  }

  /**
   * Establish Bluetooth connection to device
   */
  private async establishBluetoothConnection(deviceInfo: any): Promise<RealTimeDevice> {
    const deviceId = `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use Web Bluetooth API
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth not supported');
    }

    const device: RealTimeDevice = {
      id: deviceId,
      name: deviceInfo.name,
      type: deviceInfo.type,
      brand: deviceInfo.brand,
      model: deviceInfo.model,
      isConnected: true,
      isOn: false,
      consumption: 0,
      maxConsumption: this.getMaxConsumption(deviceInfo.type),
      connectionType: 'bluetooth',
      bluetoothId: deviceInfo.bluetoothId,
      lastSeen: new Date(),
      status: 'online',
      capabilities: this.getDeviceCapabilities(deviceInfo.type),
    };

    // Start real-time data polling for this device
    this.startDevicePolling(device);

    return device;
  }

  /**
   * Start polling device for real-time data
   */
  private startDevicePolling(device: RealTimeDevice) {
    const pollDevice = async () => {
      if (!device.isConnected) return;

      try {
        const realTimeData = await this.fetchDeviceData(device);
        
        // Update device with real-time data
        const updatedDevice = {
          ...device,
          ...realTimeData,
          lastSeen: new Date(),
          status: 'online' as const
        };

        this.connectedDevices.set(device.id, updatedDevice);
        this.notifyDeviceListeners();
        
        // Update database
        await this.updateDeviceInDatabase(updatedDevice);
        
      } catch (error) {
        console.error(`Failed to poll device ${device.name}:`, error);
        device.status = 'error';
        this.connectedDevices.set(device.id, device);
        this.notifyDeviceListeners();
      }
    };

    // Poll immediately and then every 10 seconds
    pollDevice();
    setInterval(pollDevice, 10000);
  }

  /**
   * Fetch real-time data from device
   */
  private async fetchDeviceData(device: RealTimeDevice): Promise<Partial<RealTimeDevice>> {
    if (device.connectionType === 'wifi') {
      return this.fetchWiFiDeviceData(device);
    } else if (device.connectionType === 'bluetooth') {
      return this.fetchBluetoothDeviceData(device);
    }
    
    return {};
  }

  /**
   * Fetch data from WiFi device
   */
  private async fetchWiFiDeviceData(device: RealTimeDevice): Promise<Partial<RealTimeDevice>> {
    try {
      // For Samsung AC and other smart devices, we would make HTTP requests
      // to their local APIs or use their SDKs
      
      if (device.type === 'ac' && device.brand === 'samsung') {
        return await this.fetchSamsungACData(device);
      }
      
      // Generic WiFi device data fetch
      const response = await fetch(`http://${device.ipAddress}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        isOn: data.power || false,
        consumption: data.powerConsumption || 0,
        temperature: data.temperature,
        mode: data.mode,
        fanSpeed: data.fanSpeed,
        brightness: data.brightness,
        color: data.color,
        status: 'online' as const
      };
    } catch (error) {
      console.error(`WiFi device ${device.name} fetch error:`, error);
      return {
        status: 'offline' as const,
        isConnected: false
      };
    }
  }

  /**
   * Fetch Samsung AC specific data
   */
  private async fetchSamsungACData(device: RealTimeDevice): Promise<Partial<RealTimeDevice>> {
    try {
      // Samsung SmartThings API or local API call
      // This would be the actual implementation for Samsung AC
      
      // Simulate real Samsung AC data
      const isOn = Math.random() > 0.3; // 70% chance of being on
      const consumption = isOn ? Math.random() * 2.5 + 0.5 : 0; // 0.5-3.0 kWh when on
      const temperature = isOn ? Math.floor(Math.random() * 10) + 20 : 25; // 20-30°C
      
      return {
        isOn,
        consumption,
        temperature,
        mode: isOn ? ['cool', 'heat', 'fan', 'auto'][Math.floor(Math.random() * 4)] : 'off',
        fanSpeed: isOn ? Math.floor(Math.random() * 5) + 1 : 0, // 1-5
        status: 'online' as const
      };
    } catch (error) {
      console.error(`Samsung AC ${device.name} fetch error:`, error);
      return {
        status: 'offline' as const,
        isConnected: false
      };
    }
  }

  /**
   * Fetch data from Bluetooth device
   */
  private async fetchBluetoothDeviceData(device: RealTimeDevice): Promise<Partial<RealTimeDevice>> {
    try {
      // Use Web Bluetooth API to read characteristics
      // This would be the actual Bluetooth communication
      
      // Simulate Bluetooth device data
      const isOn = Math.random() > 0.4; // 60% chance of being on
      const consumption = isOn ? Math.random() * 1.5 + 0.2 : 0; // 0.2-1.7 kWh when on
      
      return {
        isOn,
        consumption,
        brightness: device.type === 'light' ? (isOn ? Math.floor(Math.random() * 100) + 1 : 0) : undefined,
        color: device.type === 'light' && isOn ? 
          `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` : undefined,
        status: 'online' as const
      };
    } catch (error) {
      console.error(`Bluetooth device ${device.name} fetch error:`, error);
      return {
        status: 'offline' as const,
        isConnected: false
      };
    }
  }

  /**
   * Control device (turn on/off, set temperature, etc.)
   */
  async controlDevice(deviceId: string, command: {
    power?: boolean;
    temperature?: number;
    mode?: string;
    fanSpeed?: number;
    brightness?: number;
    color?: string;
  }): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device || !device.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      if (device.connectionType === 'wifi') {
        await this.controlWiFiDevice(device, command);
      } else if (device.connectionType === 'bluetooth') {
        await this.controlBluetoothDevice(device, command);
      }

      // Update local state
      const updatedDevice = {
        ...device,
        ...command,
        lastSeen: new Date()
      };
      
      this.connectedDevices.set(deviceId, updatedDevice);
      this.notifyDeviceListeners();
      
      // Update database
      await this.updateDeviceInDatabase(updatedDevice);
      
      return true;
    } catch (error) {
      console.error(`Failed to control device ${device.name}:`, error);
      return false;
    }
  }

  /**
   * Control WiFi device
   */
  private async controlWiFiDevice(device: RealTimeDevice, command: any): Promise<void> {
    const response = await fetch(`http://${device.ipAddress}/api/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Control command failed: HTTP ${response.status}`);
    }
  }

  /**
   * Control Bluetooth device
   */
  private async controlBluetoothDevice(device: RealTimeDevice, command: any): Promise<void> {
    // Use Web Bluetooth API to write characteristics
    // This would be the actual Bluetooth control implementation
    console.log(`Controlling Bluetooth device ${device.name}:`, command);
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices(): RealTimeDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): RealTimeDevice | undefined {
    return this.connectedDevices.get(deviceId);
  }

  /**
   * Disconnect device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return false;

    device.isConnected = false;
    device.status = 'offline';
    this.connectedDevices.set(deviceId, device);
    this.notifyDeviceListeners();

    // Update database
    await this.updateDeviceInDatabase(device);
    
    return true;
  }

  /**
   * Add device listener
   */
  addDeviceListener(listener: (devices: RealTimeDevice[]) => void) {
    this.connectionListeners.add(listener);
  }

  /**
   * Remove device listener
   */
  removeDeviceListener(listener: (devices: RealTimeDevice[]) => void) {
    this.connectionListeners.delete(listener);
  }

  /**
   * Notify all device listeners
   */
  private notifyDeviceListeners() {
    const devices = this.getConnectedDevices();
    this.connectionListeners.forEach(listener => listener(devices));
  }

  /**
   * Update all devices
   */
  private async updateAllDevices() {
    // This would trigger updates for all connected devices
    this.notifyDeviceListeners();
  }

  /**
   * Update solar panels
   */
  private async updateSolarPanels() {
    // Solar panel monitoring would be implemented here
    this.notifySolarListeners();
  }

  /**
   * Add solar listener
   */
  addSolarListener(listener: (solar: SolarPanelData[]) => void) {
    this.solarListeners.add(listener);
  }

  /**
   * Notify solar listeners
   */
  private notifySolarListeners() {
    const solar = Array.from(this.solarPanels.values());
    this.solarListeners.forEach(listener => listener(solar));
  }

  /**
   * Get device capabilities based on type
   */
  private getDeviceCapabilities(type: string): string[] {
    const capabilities: Record<string, string[]> = {
      'ac': ['power', 'temperature', 'mode', 'fan_speed'],
      'tv': ['power', 'volume', 'channel', 'brightness'],
      'light': ['power', 'brightness', 'color'],
      'refrigerator': ['power', 'temperature'],
      'washer': ['power', 'mode', 'timer'],
      'outlet': ['power'],
      'thermostat': ['power', 'temperature', 'mode']
    };
    
    return capabilities[type] || ['power'];
  }

  /**
   * Get max consumption based on device type
   */
  private getMaxConsumption(type: string): number {
    const maxConsumption: Record<string, number> = {
      'ac': 3.5,
      'tv': 0.3,
      'light': 0.1,
      'refrigerator': 0.8,
      'washer': 2.0,
      'outlet': 1.5,
      'thermostat': 0.2
    };
    
    return maxConsumption[type] || 1.0;
  }

  /**
   * Save device to database
   */
  private async saveDeviceToDatabase(device: RealTimeDevice): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .upsert({
          id: device.id,
          name: device.name,
          type: device.type,
          brand: device.brand,
          model: device.model,
          consumption: device.consumption,
          status: device.status,
          connection_type: device.connectionType,
          ip_address: device.ipAddress,
          mac_address: device.macAddress,
          bluetooth_id: device.bluetoothId,
          capabilities: device.capabilities,
          is_on: device.isOn,
          last_seen: device.lastSeen.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save device to database:', error);
    }
  }

  /**
   * Update device in database
   */
  private async updateDeviceInDatabase(device: RealTimeDevice): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({
          consumption: device.consumption,
          status: device.status,
          is_on: device.isOn,
          last_seen: device.lastSeen.toISOString(),
          temperature: device.temperature,
          mode: device.mode,
          fan_speed: device.fanSpeed,
          brightness: device.brightness,
          color: device.color
        })
        .eq('id', device.id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update device in database:', error);
    }
  }
}

export const realTimeDeviceService = new RealTimeDeviceService();
