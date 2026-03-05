// Real-time Device Connection Service - Uses actual database data only
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

class RealTimeDeviceService {
  private connectedDevices: Map<string, RealTimeDevice> = new Map();
  private connectionListeners: Set<(devices: RealTimeDevice[]) => void> = new Set();
  private solarListeners: Set<(solar: SolarPanelData[]) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.startRealTimeMonitoring();
  }

  private startRealTimeMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    // Poll database every 5 seconds for real-time updates
    this.updateInterval = setInterval(() => {
      this.syncDevicesFromDatabase();
    }, 5000);
  }

  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Sync devices from the database (real data only)
   */
  private async syncDevicesFromDatabase() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbDevices, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (dbDevices) {
        this.connectedDevices.clear();
        for (const dbDevice of dbDevices) {
          const device: RealTimeDevice = {
            id: dbDevice.id,
            name: dbDevice.name,
            type: dbDevice.type,
            isConnected: dbDevice.status === 'online',
            isOn: dbDevice.is_on,
            consumption: dbDevice.consumption,
            maxConsumption: this.getMaxConsumption(dbDevice.type),
            connectionType: dbDevice.connection_type as any,
            lastSeen: new Date(dbDevice.updated_at || dbDevice.created_at || Date.now()),
            status: dbDevice.status as any,
            capabilities: this.getDeviceCapabilities(dbDevice.type),
          };
          this.connectedDevices.set(device.id, device);
        }
        this.notifyDeviceListeners();
      }
    } catch (error) {
      console.error('Failed to sync devices from database:', error);
    }
  }

  /**
   * Connect to a WiFi device
   */
  async connectWiFiDevice(deviceInfo: {
    name: string;
    type: string;
    ipAddress: string;
    brand?: string;
    model?: string;
  }): Promise<RealTimeDevice> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save to database first
      const { data: dbDevice, error } = await supabase
        .from('user_devices')
        .insert({
          name: deviceInfo.name,
          type: deviceInfo.type,
          user_id: user.id,
          connection_type: 'wifi',
          status: 'online',
          is_on: false,
          consumption: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const device: RealTimeDevice = {
        id: dbDevice.id,
        name: dbDevice.name,
        type: dbDevice.type,
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        isConnected: true,
        isOn: false,
        consumption: 0,
        maxConsumption: this.getMaxConsumption(dbDevice.type),
        connectionType: 'wifi',
        ipAddress: deviceInfo.ipAddress,
        lastSeen: new Date(),
        status: 'online',
        capabilities: this.getDeviceCapabilities(dbDevice.type),
      };

      this.connectedDevices.set(device.id, device);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!('bluetooth' in navigator)) {
        throw new Error('Bluetooth not supported');
      }

      const { data: dbDevice, error } = await supabase
        .from('user_devices')
        .insert({
          name: deviceInfo.name,
          type: deviceInfo.type,
          user_id: user.id,
          connection_type: 'bluetooth',
          status: 'online',
          is_on: false,
          consumption: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const device: RealTimeDevice = {
        id: dbDevice.id,
        name: dbDevice.name,
        type: dbDevice.type,
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        isConnected: true,
        isOn: false,
        consumption: 0,
        maxConsumption: this.getMaxConsumption(dbDevice.type),
        connectionType: 'bluetooth',
        bluetoothId: deviceInfo.bluetoothId,
        lastSeen: new Date(),
        status: 'online',
        capabilities: this.getDeviceCapabilities(dbDevice.type),
      };

      this.connectedDevices.set(device.id, device);
      this.notifyDeviceListeners();
      return device;
    } catch (error) {
      console.error('Failed to connect Bluetooth device:', error);
      throw new Error(`Failed to connect to ${deviceInfo.name}: ${error}`);
    }
  }

  /**
   * Control device - updates database directly
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
    if (!device) throw new Error('Device not found');

    try {
      const updateData: any = {};
      if (command.power !== undefined) {
        updateData.is_on = command.power;
        // When turning off, set consumption to 0
        if (!command.power) updateData.consumption = 0;
      }

      const { error } = await supabase
        .from('user_devices')
        .update(updateData)
        .eq('id', deviceId);

      if (error) throw error;

      // Update local state
      if (command.power !== undefined) {
        device.isOn = command.power;
        if (!command.power) device.consumption = 0;
      }
      device.lastSeen = new Date();
      this.connectedDevices.set(deviceId, device);
      this.notifyDeviceListeners();

      return true;
    } catch (error) {
      console.error(`Failed to control device ${device.name}:`, error);
      return false;
    }
  }

  getConnectedDevices(): RealTimeDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  getDevice(deviceId: string): RealTimeDevice | undefined {
    return this.connectedDevices.get(deviceId);
  }

  async disconnectDevice(deviceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ status: 'offline', is_on: false, consumption: 0 })
        .eq('id', deviceId);

      if (error) throw error;

      const device = this.connectedDevices.get(deviceId);
      if (device) {
        device.isConnected = false;
        device.status = 'offline';
        device.isOn = false;
        device.consumption = 0;
        this.connectedDevices.set(deviceId, device);
      }
      this.notifyDeviceListeners();
      return true;
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      return false;
    }
  }

  addDeviceListener(listener: (devices: RealTimeDevice[]) => void) {
    this.connectionListeners.add(listener);
  }

  removeDeviceListener(listener: (devices: RealTimeDevice[]) => void) {
    this.connectionListeners.delete(listener);
  }

  addSolarListener(listener: (solar: SolarPanelData[]) => void) {
    this.solarListeners.add(listener);
  }

  removeSolarListener(listener: (solar: SolarPanelData[]) => void) {
    this.solarListeners.delete(listener);
  }

  private notifyDeviceListeners() {
    const devices = this.getConnectedDevices();
    this.connectionListeners.forEach(listener => listener(devices));
  }

  private notifySolarListeners() {
    // No solar panels connected - always empty
    this.solarListeners.forEach(listener => listener([]));
  }

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

  private getMaxConsumption(type: string): number {
    const maxConsumption: Record<string, number> = {
      'ac': 3.5, 'tv': 0.3, 'light': 0.1, 'refrigerator': 0.8,
      'washer': 2.0, 'outlet': 1.5, 'thermostat': 0.2
    };
    return maxConsumption[type] || 1.0;
  }
}

export const realTimeDeviceService = new RealTimeDeviceService();
