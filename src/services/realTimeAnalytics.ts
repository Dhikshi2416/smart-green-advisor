// Real-time Analytics Service
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsData {
  consumption: {
    hourly: Array<{ hour: string; consumption: number; solar: number; net: number }>;
    daily: Array<{ date: string; consumption: number; solar: number; savings: number }>;
    monthly: Array<{ month: string; consumption: number; solar: number; savings: number }>;
  };
  devices: {
    topConsumers: Array<{ name: string; consumption: number; percentage: number }>;
    efficiency: Array<{ name: string; efficiency: number; status: string }>;
    trends: Array<{ name: string; trend: 'up' | 'down' | 'stable'; change: number }>;
  };
  solar: {
    generation: Array<{ time: string; generation: number; efficiency: number }>;
    weather: Array<{ date: string; condition: string; generation: number }>;
    savings: {
      daily: number;
      monthly: number;
      yearly: number;
      total: number;
    };
  };
  insights: Array<{
    type: 'saving' | 'efficiency' | 'optimization' | 'alert';
    title: string;
    description: string;
    impact: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

class RealTimeAnalyticsService {
  private analyticsCache: Map<string, any> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.startAnalyticsMonitoring();
  }

  /**
   * Start real-time analytics monitoring
   */
  private startAnalyticsMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.updateInterval = setInterval(() => {
      this.updateAnalyticsCache();
    }, 30000); // Update every 30 seconds
  }

  /**
   * Stop analytics monitoring
   */
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(userId: string): Promise<AnalyticsData> {
    try {
      // Check cache first
      const cacheKey = `analytics_${userId}`;
      const cached = this.analyticsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.data;
      }

      // Fetch fresh data
      const [consumptionData, deviceData, solarData, insights] = await Promise.all([
        this.getConsumptionAnalytics(userId),
        this.getDeviceAnalytics(userId),
        this.getSolarAnalytics(userId),
        this.getInsights(userId)
      ]);

      const analyticsData: AnalyticsData = {
        consumption: consumptionData,
        devices: deviceData,
        solar: solarData,
        insights
      };

      // Cache the data
      this.analyticsCache.set(cacheKey, {
        data: analyticsData,
        timestamp: Date.now()
      });

      return analyticsData;
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      throw new Error('Failed to load analytics data');
    }
  }

  /**
   * Get consumption analytics
   */
  private async getConsumptionAnalytics(userId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get hourly data for today
    const hourlyData = await this.getHourlyConsumptionData(userId, startOfDay);
    
    // Get daily data for last 30 days
    const dailyData = await this.getDailyConsumptionData(userId, 30);
    
    // Get monthly data for last 12 months
    const monthlyData = await this.getMonthlyConsumptionData(userId, 12);

    return {
      hourly: hourlyData,
      daily: dailyData,
      monthly: monthlyData
    };
  }

  /**
   * Get device analytics
   */
  private async getDeviceAnalytics(userId: string) {
    // Get device consumption data
    const { data: deviceData, error } = await supabase
      .from('user_devices')
      .select('name, consumption, status, type')
      .eq('user_id', userId)
      .eq('is_on', true);

    if (error) throw error;

    const totalConsumption = deviceData?.reduce((sum, d) => sum + (d.consumption || 0), 0) || 0;

    // Top consumers
    const topConsumers = deviceData
      ?.map(d => ({
        name: d.name,
        consumption: d.consumption || 0,
        percentage: totalConsumption > 0 ? ((d.consumption || 0) / totalConsumption) * 100 : 0
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 5) || [];

    // Device efficiency
    const efficiency = deviceData?.map(d => ({
      name: d.name,
      efficiency: this.calculateDeviceEfficiency(d),
      status: d.status || 'offline'
    })) || [];

    // Device trends (simplified - would need historical data)
    const trends = deviceData?.map(d => ({
      name: d.name,
      trend: this.calculateDeviceTrend(d),
      change: Math.random() * 20 - 10 // Simulated change percentage
    })) || [];

    return {
      topConsumers,
      efficiency,
      trends
    };
  }

  /**
   * Get solar analytics
   */
  private async getSolarAnalytics(userId: string) {
    // Get solar panel data (simulated for now)
    const solarData: any[] = [];
    // TODO: Add solar_panels table to database if needed

    const now = new Date();
    const hourlyGeneration = this.generateHourlySolarData(now);
    const weatherData = this.generateWeatherData(7); // Last 7 days

    // Calculate savings
    const dailyGeneration = solarData?.reduce((sum, panel) => sum + (panel.generation || 0), 0) || 0;
    const electricityRate = 8.5; // ₹8.5 per kWh (Indian average)
    
    const savings = {
      daily: dailyGeneration * electricityRate,
      monthly: dailyGeneration * electricityRate * 30,
      yearly: dailyGeneration * electricityRate * 365,
      total: dailyGeneration * electricityRate * 365 * 2 // 2 years lifetime
    };

    return {
      generation: hourlyGeneration,
      weather: weatherData,
      savings
    };
  }

  /**
   * Get insights and recommendations
   */
  private async getInsights(userId: string) {
    const insights = [];

    // Get current consumption data
    const { data: devices } = await supabase
      .from('user_devices')
      .select('name, consumption, type, is_on')
      .eq('user_id', userId);

    const totalConsumption = devices?.reduce((sum, d) => sum + (d.is_on ? (d.consumption || 0) : 0), 0) || 0;
    const hour = new Date().getHours();

    // High consumption insight
    if (totalConsumption > 3.0) {
      insights.push({
        type: 'alert' as const,
        title: 'High Energy Consumption',
        description: `Your current consumption is ${totalConsumption.toFixed(1)} kWh. Consider reducing usage during peak hours.`,
        impact: 15,
        priority: 'high' as const
      });
    }

    // Solar opportunity insight
    if (hour >= 10 && hour <= 15) {
      insights.push({
        type: 'optimization' as const,
        title: 'Peak Solar Hours',
        description: 'You\'re in peak solar generation hours. Perfect time to run heavy appliances.',
        impact: 25,
        priority: 'medium' as const
      });
    }

    // Device efficiency insight
    const acDevices = devices?.filter(d => d.type === 'ac' && d.is_on) || [];
    if (acDevices.length > 0) {
      insights.push({
        type: 'efficiency' as const,
        title: 'AC Optimization',
        description: 'Consider increasing AC temperature by 2°C to save 15% on cooling costs.',
        impact: 20,
        priority: 'medium' as const
      });
    }

    // Cost saving insight
    if (totalConsumption > 0) {
      const potentialSavings = totalConsumption * 0.2 * 8.5 * 30; // 20% reduction
      insights.push({
        type: 'saving' as const,
        title: 'Monthly Savings Opportunity',
        description: `You could save ₹${potentialSavings.toFixed(0)} per month by optimizing device usage.`,
        impact: 30,
        priority: 'high' as const
      });
    }

    return insights;
  }

  /**
   * Get hourly consumption data
   */
  private async getHourlyConsumptionData(userId: string, startDate: Date) {
    const hourlyData = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(startDate.getTime() + i * 60 * 60 * 1000);
      const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
      
      // Simulate realistic consumption patterns
      const baseConsumption = this.getBaseConsumptionForHour(hour.getHours());
      const consumption = baseConsumption + (Math.random() - 0.5) * 0.5;
      const solar = this.getSolarGenerationForHour(hour.getHours());
      const net = Math.max(0, consumption - solar);
      
      hourlyData.push({
        hour: hourStr,
        consumption: Math.max(0, consumption),
        solar: Math.max(0, solar),
        net: Math.max(0, net)
      });
    }
    
    return hourlyData;
  }

  /**
   * Get daily consumption data
   */
  private async getDailyConsumptionData(userId: string, days: number) {
    const dailyData = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Simulate daily consumption with weekend patterns
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseConsumption = isWeekend ? 15 : 12; // Higher on weekends
      const consumption = baseConsumption + (Math.random() - 0.5) * 4;
      const solar = 8 + (Math.random() - 0.5) * 3; // Solar generation
      const savings = solar * 8.5; // ₹8.5 per kWh
      
      dailyData.push({
        date: dateStr,
        consumption: Math.max(0, consumption),
        solar: Math.max(0, solar),
        savings: Math.max(0, savings)
      });
    }
    
    return dailyData;
  }

  /**
   * Get monthly consumption data
   */
  private async getMonthlyConsumptionData(userId: string, months: number) {
    const monthlyData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Simulate monthly consumption with seasonal patterns
      const isSummer = date.getMonth() >= 4 && date.getMonth() <= 8; // May to September
      const baseConsumption = isSummer ? 450 : 350; // Higher in summer
      const consumption = baseConsumption + (Math.random() - 0.5) * 100;
      const solar = 200 + (Math.random() - 0.5) * 50; // Solar generation
      const savings = solar * 8.5; // ₹8.5 per kWh
      
      monthlyData.push({
        month: monthStr,
        consumption: Math.max(0, consumption),
        solar: Math.max(0, solar),
        savings: Math.max(0, savings)
      });
    }
    
    return monthlyData;
  }

  /**
   * Generate hourly solar data
   */
  private generateHourlySolarData(now: Date) {
    const hourlyData = [];
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
      const generation = this.getSolarGenerationForHour(hour.getHours());
      const efficiency = generation > 0 ? (generation / 5.0) * 100 : 0; // Assume 5kW max
      
      hourlyData.push({
        time: hourStr,
        generation: Math.max(0, generation),
        efficiency: Math.min(100, Math.max(0, efficiency))
      });
    }
    
    return hourlyData;
  }

  /**
   * Generate weather data
   */
  private generateWeatherData(days: number) {
    const weatherData = [];
    const conditions = ['clear', 'partly-cloudy', 'cloudy', 'overcast', 'rain'];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const generation = this.getGenerationForWeather(condition);
      
      weatherData.push({
        date: dateStr,
        condition,
        generation: Math.max(0, generation)
      });
    }
    
    return weatherData;
  }

  /**
   * Get base consumption for hour
   */
  private getBaseConsumptionForHour(hour: number): number {
    if (hour >= 6 && hour <= 8) return 0.8; // Morning
    if (hour >= 9 && hour <= 17) return 1.2; // Day
    if (hour >= 18 && hour <= 22) return 2.0; // Evening
    return 0.5; // Night
  }

  /**
   * Get solar generation for hour
   */
  private getSolarGenerationForHour(hour: number): number {
    if (hour < 6 || hour > 18) return 0; // No solar at night
    const intensity = Math.sin((hour - 6) * Math.PI / 12); // Peak at noon
    return intensity * 3.5; // Max 3.5kW
  }

  /**
   * Get generation for weather condition
   */
  private getGenerationForWeather(condition: string): number {
    const factors = {
      'clear': 1.0,
      'partly-cloudy': 0.8,
      'cloudy': 0.6,
      'overcast': 0.3,
      'rain': 0.1
    };
    return 8 * (factors[condition] || 0.8); // Base 8kWh per day
  }

  /**
   * Calculate device efficiency
   */
  private calculateDeviceEfficiency(device: any): number {
    const maxConsumption = this.getMaxConsumptionForType(device.type);
    const currentConsumption = device.consumption || 0;
    return maxConsumption > 0 ? (currentConsumption / maxConsumption) * 100 : 0;
  }

  /**
   * Calculate device trend
   */
  private calculateDeviceTrend(device: any): 'up' | 'down' | 'stable' {
    // Simplified trend calculation
    const consumption = device.consumption || 0;
    if (consumption > 2.0) return 'up';
    if (consumption < 0.5) return 'down';
    return 'stable';
  }

  /**
   * Get max consumption for device type
   */
  private getMaxConsumptionForType(type: string): number {
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
   * Update analytics cache
   */
  private async updateAnalyticsCache() {
    // This would update the cache with fresh data
    // Implementation depends on specific requirements
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService();
