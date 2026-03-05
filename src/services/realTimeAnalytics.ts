// Real-time Analytics Service - Uses actual database data only
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

  /**
   * Get comprehensive analytics data from real database
   */
  async getAnalyticsData(userId: string): Promise<AnalyticsData> {
    try {
      const cacheKey = `analytics_${userId}`;
      const cached = this.analyticsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.data;
      }

      const [consumptionData, deviceData, insights] = await Promise.all([
        this.getConsumptionAnalytics(userId),
        this.getDeviceAnalytics(userId),
        this.getInsights(userId)
      ]);

      // Solar data is 0 unless solar panels are connected (no solar_panels table yet)
      const solarData = this.getEmptySolarData();

      const analyticsData: AnalyticsData = {
        consumption: consumptionData,
        devices: deviceData,
        solar: solarData,
        insights
      };

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
   * Get consumption analytics from device_consumption_history
   */
  private async getConsumptionAnalytics(userId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [hourlyData, dailyData, monthlyData] = await Promise.all([
      this.getHourlyConsumptionData(userId, startOfDay),
      this.getDailyConsumptionData(userId, 30),
      this.getMonthlyConsumptionData(userId, 12)
    ]);

    return { hourly: hourlyData, daily: dailyData, monthly: monthlyData };
  }

  /**
   * Get device analytics from user_devices table
   */
  private async getDeviceAnalytics(userId: string) {
    const { data: deviceData, error } = await supabase
      .from('user_devices')
      .select('name, consumption, status, type, is_on')
      .eq('user_id', userId);

    if (error) throw error;

    const activeDevices = deviceData?.filter(d => d.is_on) || [];
    const totalConsumption = activeDevices.reduce((sum, d) => sum + (d.consumption || 0), 0);

    const topConsumers = activeDevices
      .map(d => ({
        name: d.name,
        consumption: d.consumption || 0,
        percentage: totalConsumption > 0 ? ((d.consumption || 0) / totalConsumption) * 100 : 0
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 5);

    const maxConsumptions: Record<string, number> = {
      'ac': 3.5, 'tv': 0.3, 'light': 0.1, 'refrigerator': 0.8,
      'washer': 2.0, 'outlet': 1.5, 'thermostat': 0.2
    };

    const efficiency = (deviceData || []).map(d => ({
      name: d.name,
      efficiency: d.is_on && d.consumption > 0
        ? Math.min(100, ((d.consumption || 0) / (maxConsumptions[d.type] || 1.0)) * 100)
        : 0,
      status: d.status || 'offline'
    }));

    // Calculate real trends from consumption history
    const trends = await this.getDeviceTrends(userId, deviceData || []);

    return { topConsumers, efficiency, trends };
  }

  /**
   * Get device trends from consumption history
   */
  private async getDeviceTrends(userId: string, devices: any[]) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const trends = [];
    for (const device of devices) {
      // Get recent consumption
      const { data: recentData } = await supabase
        .from('device_consumption_history')
        .select('consumption')
        .eq('user_id', userId)
        .eq('device_id', device.name) // This might need device id
        .gte('recorded_at', oneDayAgo.toISOString())
        .order('recorded_at', { ascending: false });

      const { data: olderData } = await supabase
        .from('device_consumption_history')
        .select('consumption')
        .eq('user_id', userId)
        .gte('recorded_at', twoDaysAgo.toISOString())
        .lt('recorded_at', oneDayAgo.toISOString());

      const recentAvg = recentData && recentData.length > 0
        ? recentData.reduce((s, r) => s + r.consumption, 0) / recentData.length : 0;
      const olderAvg = olderData && olderData.length > 0
        ? olderData.reduce((s, r) => s + r.consumption, 0) / olderData.length : 0;

      const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      const trend: 'up' | 'down' | 'stable' = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';

      trends.push({ name: device.name, trend, change });
    }
    return trends;
  }

  /**
   * Get hourly consumption from device_consumption_history
   */
  private async getHourlyConsumptionData(userId: string, startDate: Date) {
    const { data: historyData } = await supabase
      .from('device_consumption_history')
      .select('consumption, recorded_at')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    // Group by hour
    const hourlyMap = new Map<string, number>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i.toString().padStart(2, '0') + ':00', 0);
    }

    if (historyData) {
      for (const record of historyData) {
        const hour = new Date(record.recorded_at).getHours();
        const key = hour.toString().padStart(2, '0') + ':00';
        hourlyMap.set(key, (hourlyMap.get(key) || 0) + record.consumption);
      }
    }

    return Array.from(hourlyMap.entries()).map(([hour, consumption]) => ({
      hour,
      consumption: Number(consumption.toFixed(2)),
      solar: 0, // No solar panels table yet
      net: Number(consumption.toFixed(2))
    }));
  }

  /**
   * Get daily consumption from device_consumption_history
   */
  private async getDailyConsumptionData(userId: string, days: number) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { data: historyData } = await supabase
      .from('device_consumption_history')
      .select('consumption, recorded_at')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    // Group by date
    const dailyMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dailyMap.set(date.toISOString().split('T')[0], 0);
    }

    if (historyData) {
      for (const record of historyData) {
        const date = new Date(record.recorded_at).toISOString().split('T')[0];
        if (dailyMap.has(date)) {
          dailyMap.set(date, (dailyMap.get(date) || 0) + record.consumption);
        }
      }
    }

    return Array.from(dailyMap.entries()).map(([date, consumption]) => ({
      date,
      consumption: Number(consumption.toFixed(2)),
      solar: 0,
      savings: 0
    }));
  }

  /**
   * Get monthly consumption from device_consumption_history
   */
  private async getMonthlyConsumptionData(userId: string, months: number) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: historyData } = await supabase
      .from('device_consumption_history')
      .select('consumption, recorded_at')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });

    const monthlyMap = new Map<string, number>();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap.set(key, 0);
    }

    if (historyData) {
      for (const record of historyData) {
        const date = new Date(record.recorded_at);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyMap.has(key)) {
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + record.consumption);
        }
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, consumption]) => ({
      month,
      consumption: Number(consumption.toFixed(2)),
      solar: 0,
      savings: 0
    }));
  }

  /**
   * Empty solar data (no solar_panels table)
   */
  private getEmptySolarData() {
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      hourlyData.push({
        time: i.toString().padStart(2, '0') + ':00',
        generation: 0,
        efficiency: 0
      });
    }
    return {
      generation: hourlyData,
      weather: [],
      savings: { daily: 0, monthly: 0, yearly: 0, total: 0 }
    };
  }

  /**
   * Get insights based on real device data
   */
  private async getInsights(userId: string) {
    const insights: AnalyticsData['insights'] = [];

    const { data: devices } = await supabase
      .from('user_devices')
      .select('name, consumption, type, is_on')
      .eq('user_id', userId);

    if (!devices || devices.length === 0) {
      insights.push({
        type: 'optimization',
        title: 'No Devices Connected',
        description: 'Connect your smart devices to start monitoring energy consumption in real-time.',
        impact: 0,
        priority: 'high'
      });
      return insights;
    }

    const totalConsumption = devices.reduce((sum, d) => sum + (d.is_on ? (d.consumption || 0) : 0), 0);
    const activeCount = devices.filter(d => d.is_on).length;

    if (totalConsumption > 3.0) {
      insights.push({
        type: 'alert',
        title: 'High Energy Consumption',
        description: `Current consumption is ${totalConsumption.toFixed(1)} kW across ${activeCount} active devices. Consider turning off unused devices.`,
        impact: 15,
        priority: 'high'
      });
    }

    if (totalConsumption > 0 && totalConsumption <= 3.0) {
      const potentialSavings = totalConsumption * 0.2 * 8.5 * 30;
      insights.push({
        type: 'saving',
        title: 'Potential Monthly Savings',
        description: `By optimizing your ${activeCount} active devices, you could save ₹${potentialSavings.toFixed(0)}/month.`,
        impact: 20,
        priority: 'medium'
      });
    }

    const acDevices = devices.filter(d => d.type === 'ac' && d.is_on);
    if (acDevices.length > 0) {
      insights.push({
        type: 'efficiency',
        title: 'AC Optimization',
        description: `You have ${acDevices.length} AC unit(s) running. Increasing temperature by 2°C can save 15% on cooling costs.`,
        impact: 15,
        priority: 'medium'
      });
    }

    return insights;
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService();
