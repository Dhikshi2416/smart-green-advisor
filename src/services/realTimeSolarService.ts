// Real-time Solar Panel Monitoring Service
import { supabase } from "@/integrations/supabase/client";

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
  status: 'online' | 'offline' | 'error' | 'maintenance';
  location?: string;
  tilt?: number;
  azimuth?: number;
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
    cloudCover: number;
  };
  dailyGeneration?: number;
  monthlyGeneration?: number;
  lifetimeGeneration?: number;
}

export interface SolarInverterData {
  id: string;
  name: string;
  isConnected: boolean;
  inputPower: number;
  outputPower: number;
  efficiency: number;
  temperature: number;
  voltage: number;
  current: number;
  frequency: number;
  lastUpdate: Date;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  model?: string;
  brand?: string;
  firmwareVersion?: string;
}

export interface SolarBatteryData {
  id: string;
  name: string;
  isConnected: boolean;
  chargeLevel: number;
  capacity: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  cycles: number;
  health: number;
  lastUpdate: Date;
  status: 'online' | 'offline' | 'charging' | 'discharging' | 'idle' | 'error';
  model?: string;
  brand?: string;
}

class RealTimeSolarService {
  private solarPanels: Map<string, SolarPanelData> = new Map();
  private inverters: Map<string, SolarInverterData> = new Map();
  private batteries: Map<string, SolarBatteryData> = new Map();
  private solarListeners: Set<(solar: SolarPanelData[]) => void> = new Set();
  private inverterListeners: Set<(inverters: SolarInverterData[]) => void> = new Set();
  private batteryListeners: Set<(batteries: SolarBatteryData[]) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private weatherData: any = null;

  constructor() {
    this.startRealTimeMonitoring();
    this.fetchWeatherData();
  }

  /**
   * Start real-time monitoring of solar system
   */
  private startRealTimeMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.updateInterval = setInterval(() => {
      this.updateSolarPanels();
      this.updateInverters();
      this.updateBatteries();
    }, 2000); // Update every 2 seconds for solar data
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
   * Connect to a solar panel system
   */
  async connectSolarPanel(panelInfo: {
    name: string;
    location?: string;
    tilt?: number;
    azimuth?: number;
    ipAddress?: string;
    serialNumber?: string;
  }): Promise<SolarPanelData> {
    try {
      const panelId = `solar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const panel: SolarPanelData = {
        id: panelId,
        name: panelInfo.name,
        isConnected: true,
        generation: 0,
        efficiency: 0,
        temperature: 25,
        voltage: 0,
        current: 0,
        power: 0,
        lastUpdate: new Date(),
        status: 'online',
        location: panelInfo.location,
        tilt: panelInfo.tilt,
        azimuth: panelInfo.azimuth,
        dailyGeneration: 0,
        monthlyGeneration: 0,
        lifetimeGeneration: 0
      };

      this.solarPanels.set(panelId, panel);
      this.notifySolarListeners();
      
      // Save to database
      await this.saveSolarPanelToDatabase(panel);
      
      // Start real-time data polling
      this.startSolarPanelPolling(panel);
      
      return panel;
    } catch (error) {
      console.error('Failed to connect solar panel:', error);
      throw new Error(`Failed to connect solar panel: ${error}`);
    }
  }

  /**
   * Connect to a solar inverter
   */
  async connectInverter(inverterInfo: {
    name: string;
    model?: string;
    brand?: string;
    ipAddress?: string;
    serialNumber?: string;
  }): Promise<SolarInverterData> {
    try {
      const inverterId = `inverter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const inverter: SolarInverterData = {
        id: inverterId,
        name: inverterInfo.name,
        isConnected: true,
        inputPower: 0,
        outputPower: 0,
        efficiency: 0,
        temperature: 25,
        voltage: 0,
        current: 0,
        frequency: 50,
        lastUpdate: new Date(),
        status: 'online',
        model: inverterInfo.model,
        brand: inverterInfo.brand,
        firmwareVersion: '1.0.0'
      };

      this.inverters.set(inverterId, inverter);
      this.notifyInverterListeners();
      
      // Start real-time data polling
      this.startInverterPolling(inverter);
      
      return inverter;
    } catch (error) {
      console.error('Failed to connect inverter:', error);
      throw new Error(`Failed to connect inverter: ${error}`);
    }
  }

  /**
   * Connect to a solar battery
   */
  async connectBattery(batteryInfo: {
    name: string;
    capacity: number;
    model?: string;
    brand?: string;
    ipAddress?: string;
    serialNumber?: string;
  }): Promise<SolarBatteryData> {
    try {
      const batteryId = `battery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const battery: SolarBatteryData = {
        id: batteryId,
        name: batteryInfo.name,
        isConnected: true,
        chargeLevel: 0,
        capacity: batteryInfo.capacity,
        voltage: 0,
        current: 0,
        power: 0,
        temperature: 25,
        cycles: 0,
        health: 100,
        lastUpdate: new Date(),
        status: 'idle',
        model: batteryInfo.model,
        brand: batteryInfo.brand
      };

      this.batteries.set(batteryId, battery);
      this.notifyBatteryListeners();
      
      // Start real-time data polling
      this.startBatteryPolling(battery);
      
      return battery;
    } catch (error) {
      console.error('Failed to connect battery:', error);
      throw new Error(`Failed to connect battery: ${error}`);
    }
  }

  /**
   * Start polling solar panel for real-time data
   */
  private startSolarPanelPolling(panel: SolarPanelData) {
    const pollPanel = async () => {
      if (!panel.isConnected) return;

      try {
        const realTimeData = await this.fetchSolarPanelData(panel);
        
        const updatedPanel = {
          ...panel,
          ...realTimeData,
          lastUpdate: new Date(),
          status: 'online' as const
        };

        this.solarPanels.set(panel.id, updatedPanel);
        this.notifySolarListeners();
        
        // Update database
        await this.updateSolarPanelInDatabase(updatedPanel);
        
      } catch (error) {
        console.error(`Failed to poll solar panel ${panel.name}:`, error);
        panel.status = 'error';
        this.solarPanels.set(panel.id, panel);
        this.notifySolarListeners();
      }
    };

    // Poll immediately and then every 5 seconds
    pollPanel();
    setInterval(pollPanel, 5000);
  }

  /**
   * Start polling inverter for real-time data
   */
  private startInverterPolling(inverter: SolarInverterData) {
    const pollInverter = async () => {
      if (!inverter.isConnected) return;

      try {
        const realTimeData = await this.fetchInverterData(inverter);
        
        const updatedInverter = {
          ...inverter,
          ...realTimeData,
          lastUpdate: new Date(),
          status: 'online' as const
        };

        this.inverters.set(inverter.id, updatedInverter);
        this.notifyInverterListeners();
        
      } catch (error) {
        console.error(`Failed to poll inverter ${inverter.name}:`, error);
        inverter.status = 'error';
        this.inverters.set(inverter.id, inverter);
        this.notifyInverterListeners();
      }
    };

    pollInverter();
    setInterval(pollInverter, 3000);
  }

  /**
   * Start polling battery for real-time data
   */
  private startBatteryPolling(battery: SolarBatteryData) {
    const pollBattery = async () => {
      if (!battery.isConnected) return;

      try {
        const realTimeData = await this.fetchBatteryData(battery);
        
        const updatedBattery = {
          ...battery,
          ...realTimeData,
          lastUpdate: new Date()
        };

        this.batteries.set(battery.id, updatedBattery);
        this.notifyBatteryListeners();
        
      } catch (error) {
        console.error(`Failed to poll battery ${battery.name}:`, error);
        battery.status = 'error';
        this.batteries.set(battery.id, battery);
        this.notifyBatteryListeners();
      }
    };

    pollBattery();
    setInterval(pollBattery, 4000);
  }

  /**
   * Fetch real-time solar panel data
   */
  private async fetchSolarPanelData(panel: SolarPanelData): Promise<Partial<SolarPanelData>> {
    try {
      // Simulate real solar panel data based on time of day and weather
      const now = new Date();
      const hour = now.getHours();
      const isDaytime = hour >= 6 && hour <= 18;
      
      if (!isDaytime) {
        return {
          generation: 0,
          efficiency: 0,
          power: 0,
          voltage: 0,
          current: 0,
          temperature: this.getAmbientTemperature(),
          status: 'online' as const
        };
      }

      // Calculate solar generation based on time of day
      const solarIntensity = this.calculateSolarIntensity(hour, panel.tilt, panel.azimuth);
      const weatherFactor = this.getWeatherFactor();
      const generation = solarIntensity * weatherFactor * 0.8; // 80% efficiency factor
      
      // Calculate other parameters
      const voltage = 24 + (generation * 2); // Simulate voltage based on generation
      const current = generation / voltage;
      const power = voltage * current;
      const efficiency = (generation / 5.0) * 100; // Assume max 5kW panel
      const temperature = this.getPanelTemperature(generation);

      return {
        generation: Math.max(0, generation),
        efficiency: Math.min(100, Math.max(0, efficiency)),
        power: Math.max(0, power),
        voltage: Math.max(0, voltage),
        current: Math.max(0, current),
        temperature: temperature,
        weather: this.weatherData,
        status: 'online' as const
      };
    } catch (error) {
      console.error(`Solar panel ${panel.name} fetch error:`, error);
      return {
        status: 'offline' as const,
        isConnected: false
      };
    }
  }

  /**
   * Fetch real-time inverter data
   */
  private async fetchInverterData(inverter: SolarInverterData): Promise<Partial<SolarInverterData>> {
    try {
      // Simulate inverter data
      const totalPanelPower = Array.from(this.solarPanels.values())
        .reduce((sum, panel) => sum + panel.power, 0);
      
      const efficiency = Math.random() * 10 + 90; // 90-100% efficiency
      const outputPower = totalPanelPower * (efficiency / 100);
      
      return {
        inputPower: totalPanelPower,
        outputPower: outputPower,
        efficiency: efficiency,
        temperature: 30 + Math.random() * 20, // 30-50°C
        voltage: 230 + Math.random() * 20, // 230-250V
        current: outputPower / 230,
        frequency: 50 + Math.random() * 0.5, // 50-50.5 Hz
        status: 'online' as const
      };
    } catch (error) {
      console.error(`Inverter ${inverter.name} fetch error:`, error);
      return {
        status: 'offline' as const,
        isConnected: false
      };
    }
  }

  /**
   * Fetch real-time battery data
   */
  private async fetchBatteryData(battery: SolarBatteryData): Promise<Partial<SolarBatteryData>> {
    try {
      // Simulate battery data
      const totalGeneration = Array.from(this.solarPanels.values())
        .reduce((sum, panel) => sum + panel.generation, 0);
      
      const isCharging = totalGeneration > 0 && battery.chargeLevel < 95;
      const isDischarging = totalGeneration === 0 && battery.chargeLevel > 5;
      
      let newChargeLevel = battery.chargeLevel;
      if (isCharging) {
        newChargeLevel = Math.min(100, battery.chargeLevel + Math.random() * 2);
      } else if (isDischarging) {
        newChargeLevel = Math.max(0, battery.chargeLevel - Math.random() * 1);
      }
      
      const voltage = 12 + (newChargeLevel / 100) * 12; // 12-24V
      const current = isCharging ? Math.random() * 10 : (isDischarging ? -Math.random() * 5 : 0);
      const power = voltage * current;
      
      return {
        chargeLevel: newChargeLevel,
        voltage: voltage,
        current: current,
        power: power,
        temperature: 25 + Math.random() * 10, // 25-35°C
        cycles: battery.cycles + (isCharging ? 0.001 : 0), // Increment cycles slowly
        health: Math.max(80, battery.health - Math.random() * 0.01), // Gradual degradation
        status: isCharging ? 'charging' as const : 
                isDischarging ? 'discharging' as const : 'idle' as const
      };
    } catch (error) {
      console.error(`Battery ${battery.name} fetch error:`, error);
      return {
        status: 'error' as const,
        isConnected: false
      };
    }
  }

  /**
   * Calculate solar intensity based on time and panel orientation
   */
  private calculateSolarIntensity(hour: number, tilt?: number, azimuth?: number): number {
    // Simplified solar intensity calculation
    const maxIntensity = 5.0; // Maximum 5kW
    const timeFactor = Math.sin((hour - 6) * Math.PI / 12); // Peak at noon
    const tiltFactor = tilt ? Math.cos((tilt - 30) * Math.PI / 180) : 1;
    const azimuthFactor = azimuth ? Math.cos((azimuth - 180) * Math.PI / 180) : 1;
    
    return Math.max(0, maxIntensity * timeFactor * tiltFactor * azimuthFactor);
  }

  /**
   * Get weather factor for solar generation
   */
  private getWeatherFactor(): number {
    if (!this.weatherData) return 0.8; // Default 80% on clear day
    
    const cloudCover = this.weatherData.cloudCover || 0;
    const condition = this.weatherData.condition || 'clear';
    
    switch (condition) {
      case 'clear': return 1.0;
      case 'partly-cloudy': return 0.8;
      case 'cloudy': return 0.6;
      case 'overcast': return 0.3;
      case 'rain': return 0.1;
      case 'snow': return 0.05;
      default: return 0.8;
    }
  }

  /**
   * Get ambient temperature
   */
  private getAmbientTemperature(): number {
    if (!this.weatherData) return 25;
    return this.weatherData.temperature || 25;
  }

  /**
   * Get panel temperature based on generation
   */
  private getPanelTemperature(generation: number): number {
    const ambient = this.getAmbientTemperature();
    const heatingFactor = generation * 0.5; // Panels heat up when generating
    return ambient + heatingFactor + Math.random() * 5; // Add some variation
  }

  /**
   * Fetch weather data
   */
  private async fetchWeatherData() {
    try {
      // This would be a real weather API call
      // For now, simulate weather data
      this.weatherData = {
        condition: ['clear', 'partly-cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        temperature: 20 + Math.random() * 15, // 20-35°C
        humidity: 40 + Math.random() * 40, // 40-80%
        windSpeed: Math.random() * 10, // 0-10 m/s
        cloudCover: Math.random() * 100 // 0-100%
      };
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  }

  /**
   * Get all solar panels
   */
  getSolarPanels(): SolarPanelData[] {
    return Array.from(this.solarPanels.values());
  }

  /**
   * Get all inverters
   */
  getInverters(): SolarInverterData[] {
    return Array.from(this.inverters.values());
  }

  /**
   * Get all batteries
   */
  getBatteries(): SolarBatteryData[] {
    return Array.from(this.batteries.values());
  }

  /**
   * Get total solar generation
   */
  getTotalGeneration(): number {
    return Array.from(this.solarPanels.values())
      .reduce((sum, panel) => sum + panel.generation, 0);
  }

  /**
   * Get total battery charge
   */
  getTotalBatteryCharge(): number {
    return Array.from(this.batteries.values())
      .reduce((sum, battery) => sum + battery.chargeLevel, 0);
  }

  /**
   * Add solar panel listener
   */
  addSolarListener(listener: (panels: SolarPanelData[]) => void) {
    this.solarListeners.add(listener);
  }

  /**
   * Remove solar panel listener
   */
  removeSolarListener(listener: (panels: SolarPanelData[]) => void) {
    this.solarListeners.delete(listener);
  }

  /**
   * Add inverter listener
   */
  addInverterListener(listener: (inverters: SolarInverterData[]) => void) {
    this.inverterListeners.add(listener);
  }

  /**
   * Remove inverter listener
   */
  removeInverterListener(listener: (inverters: SolarInverterData[]) => void) {
    this.inverterListeners.delete(listener);
  }

  /**
   * Add battery listener
   */
  addBatteryListener(listener: (batteries: SolarBatteryData[]) => void) {
    this.batteryListeners.add(listener);
  }

  /**
   * Remove battery listener
   */
  removeBatteryListener(listener: (batteries: SolarBatteryData[]) => void) {
    this.batteryListeners.delete(listener);
  }

  /**
   * Notify solar listeners
   */
  private notifySolarListeners() {
    const panels = this.getSolarPanels();
    this.solarListeners.forEach(listener => listener(panels));
  }

  /**
   * Notify inverter listeners
   */
  private notifyInverterListeners() {
    const inverters = this.getInverters();
    this.inverterListeners.forEach(listener => listener(inverters));
  }

  /**
   * Notify battery listeners
   */
  private notifyBatteryListeners() {
    const batteries = this.getBatteries();
    this.batteryListeners.forEach(listener => listener(batteries));
  }

  /**
   * Update all solar panels
   */
  private async updateSolarPanels() {
    this.notifySolarListeners();
  }

  /**
   * Update all inverters
   */
  private async updateInverters() {
    this.notifyInverterListeners();
  }

  /**
   * Update all batteries
   */
  private async updateBatteries() {
    this.notifyBatteryListeners();
  }

  /**
   * Save solar panel to database (currently disabled - table not created)
   */
  private async saveSolarPanelToDatabase(panel: SolarPanelData): Promise<void> {
    // TODO: Create solar_panels table in database if needed
    console.log('Solar panel save skipped - table not implemented:', panel.name);
  }

  /**
   * Update solar panel in database (currently disabled - table not created)
   */
  private async updateSolarPanelInDatabase(panel: SolarPanelData): Promise<void> {
    // TODO: Create solar_panels table in database if needed
    console.log('Solar panel update skipped - table not implemented:', panel.name);
  }
}

export const realTimeSolarService = new RealTimeSolarService();
