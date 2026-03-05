// Real-time Solar Panel Monitoring Service - No fake data
// Solar data is 0 until actual solar panels are connected

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
}

class RealTimeSolarService {
  private solarPanels: Map<string, SolarPanelData> = new Map();
  private solarListeners: Set<(solar: SolarPanelData[]) => void> = new Set();

  /**
   * Get all solar panels (empty until real panels are connected)
   */
  getSolarPanels(): SolarPanelData[] {
    return Array.from(this.solarPanels.values());
  }

  /**
   * Get total solar generation (0 if no panels connected)
   */
  getTotalGeneration(): number {
    return Array.from(this.solarPanels.values())
      .reduce((sum, panel) => sum + panel.generation, 0);
  }

  addSolarListener(listener: (panels: SolarPanelData[]) => void) {
    this.solarListeners.add(listener);
  }

  removeSolarListener(listener: (panels: SolarPanelData[]) => void) {
    this.solarListeners.delete(listener);
  }

  private notifySolarListeners() {
    const panels = this.getSolarPanels();
    this.solarListeners.forEach(listener => listener(panels));
  }

  /**
   * Connect a solar panel (for future use when solar_panels table is created)
   */
  async connectSolarPanel(panelInfo: {
    name: string;
    location?: string;
    tilt?: number;
    azimuth?: number;
  }): Promise<SolarPanelData> {
    const panelId = `solar_${Date.now()}`;
    const panel: SolarPanelData = {
      id: panelId,
      name: panelInfo.name,
      isConnected: true,
      generation: 0,
      efficiency: 0,
      temperature: 0,
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
    return panel;
  }
}

export const realTimeSolarService = new RealTimeSolarService();
