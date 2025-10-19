// Solar Power Advisor Service
export interface SolarRecommendation {
  type: 'high_consumption' | 'solar_opportunity' | 'peak_hours' | 'cost_saving';
  priority: 'high' | 'medium' | 'low';
  message: string;
  voiceMessage: string;
  suggestions: string[];
  potentialSavings: number;
  optimalTime?: string;
}

export interface DeviceData {
  name: string;
  consumption: number;
  type: string;
  isOn: boolean;
}

export interface SolarData {
  currentConsumption: number;
  solarGeneration: number;
  devices: DeviceData[];
  timeOfDay: string;
  date: Date;
}

class SolarAdvisor {
  private readonly PEAK_SOLAR_HOURS = [10, 11, 12, 13, 14, 15]; // 10 AM - 3 PM
  private readonly HIGH_CONSUMPTION_THRESHOLD = 3.0; // kWh
  private readonly SOLAR_EFFICIENCY_THRESHOLD = 70; // percentage

  /**
   * Analyze current energy situation and provide recommendations
   */
  analyzeEnergySituation(data: SolarData): SolarRecommendation[] {
    const recommendations: SolarRecommendation[] = [];
    const currentHour = new Date().getHours();
    const solarEfficiency = this.calculateSolarEfficiency(data.solarGeneration, data.currentConsumption);
    
    // Check for high consumption alert
    if (data.currentConsumption > this.HIGH_CONSUMPTION_THRESHOLD) {
      recommendations.push(this.generateHighConsumptionAlert(data, solarEfficiency));
    }
    
    // Check for solar opportunity
    if (this.isSolarOpportunity(data, currentHour)) {
      recommendations.push(this.generateSolarOpportunityAlert(data, currentHour));
    }
    
    // Check for peak hours recommendation
    if (this.isPeakSolarHour(currentHour) && data.solarGeneration > 2.0) {
      recommendations.push(this.generatePeakHoursRecommendation(data, currentHour));
    }
    
    // Check for cost saving opportunity
    const costSaving = this.calculateCostSavingOpportunity(data, currentHour);
    if (costSaving > 50) { // More than ₹50 potential savings
      recommendations.push(this.generateCostSavingRecommendation(data, costSaving));
    }
    
    return recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Check if current time is optimal for solar usage
   */
  private isSolarOpportunity(data: SolarData, currentHour: number): boolean {
    return this.isPeakSolarHour(currentHour) && 
           data.solarGeneration > data.currentConsumption * 0.8 &&
           data.solarGeneration > 1.5;
  }

  /**
   * Check if current hour is in peak solar generation time
   */
  private isPeakSolarHour(hour: number): boolean {
    return this.PEAK_SOLAR_HOURS.includes(hour);
  }

  /**
   * Calculate solar efficiency percentage
   */
  calculateSolarEfficiency(solarGeneration: number, consumption: number): number {
    if (consumption === 0) return 100;
    return Math.min((solarGeneration / consumption) * 100, 100);
  }

  /**
   * Generate high consumption alert
   */
  private generateHighConsumptionAlert(data: SolarData, solarEfficiency: number): SolarRecommendation {
    const highConsumptionDevices = data.devices
      .filter(d => d.isOn && d.consumption > 1.5)
      .sort((a, b) => b.consumption - a.consumption);

    const suggestions = [
      "Turn off unnecessary high-consumption devices",
      "Consider using solar power for remaining devices",
      "Schedule heavy appliances for solar peak hours (10 AM - 3 PM)",
      "Reduce AC temperature by 2°C to save energy"
    ];

    return {
      type: 'high_consumption',
      priority: 'high',
      message: `High power consumption detected! Current usage: ${data.currentConsumption.toFixed(1)} kWh. Solar efficiency: ${solarEfficiency.toFixed(0)}%`,
      voiceMessage: `Alert! Your power consumption is high at ${data.currentConsumption.toFixed(1)} kilowatt hours. Consider switching to solar energy or reducing usage.`,
      suggestions,
      potentialSavings: this.calculatePotentialSavings(data, 'reduce_consumption')
    };
  }

  /**
   * Generate solar opportunity alert
   */
  private generateSolarOpportunityAlert(data: SolarData, currentHour: number): SolarRecommendation {
    const suggestions = [
      "Run your washing machine now to use solar power",
      "Turn on your AC - solar generation is at peak",
      "Charge your electric vehicle during solar hours",
      "Use your dishwasher and other heavy appliances now",
      "Set your water heater to maximum temperature"
    ];

    return {
      type: 'solar_opportunity',
      priority: 'medium',
      message: `Perfect time for solar usage! Generation: ${data.solarGeneration.toFixed(1)} kWh, Efficiency: ${this.calculateSolarEfficiency(data.solarGeneration, data.currentConsumption).toFixed(0)}%`,
      voiceMessage: `Great news! Solar generation is at peak with ${data.solarGeneration.toFixed(1)} kilowatt hours available. This is the perfect time to run heavy appliances.`,
      suggestions,
      potentialSavings: this.calculatePotentialSavings(data, 'solar_usage'),
      optimalTime: `${currentHour}:00 - ${currentHour + 1}:00`
    };
  }

  /**
   * Generate peak hours recommendation
   */
  private generatePeakHoursRecommendation(data: SolarData, currentHour: number): SolarRecommendation {
    const suggestions = [
      "Schedule your washing machine for now",
      "Run your dishwasher during solar peak hours",
      "Turn on your pool pump or water features",
      "Charge all your devices and batteries",
      "Use your electric vehicle charger"
    ];

    return {
      type: 'peak_hours',
      priority: 'low',
      message: `Peak solar hours (${currentHour}:00 - ${currentHour + 1}:00). Optimal time for high-energy devices.`,
      voiceMessage: `You're in peak solar hours! This is the best time to use high-energy devices like washing machines and air conditioners.`,
      suggestions,
      potentialSavings: this.calculatePotentialSavings(data, 'peak_usage')
    };
  }

  /**
   * Generate cost saving recommendation
   */
  private generateCostSavingRecommendation(data: SolarData, potentialSavings: number): SolarRecommendation {
    const suggestions = [
      "Shift device usage to solar peak hours (10 AM - 3 PM)",
      "Reduce AC temperature by 2°C to save energy",
      "Use smart scheduling for non-essential devices",
      "Turn off devices when not in use",
      "Use energy-efficient settings on appliances"
    ];

    return {
      type: 'cost_saving',
      priority: 'medium',
      message: `Cost saving opportunity! Potential monthly savings: ₹${potentialSavings.toFixed(0)}`,
      voiceMessage: `I found a cost saving opportunity! You could save up to ${potentialSavings.toFixed(0)} rupees per month by optimizing your energy usage.`,
      suggestions,
      potentialSavings
    };
  }

  /**
   * Calculate potential savings based on optimization type
   */
  private calculatePotentialSavings(data: SolarData, type: 'reduce_consumption' | 'solar_usage' | 'peak_usage'): number {
    const baseRate = 8.5; // ₹8.5 per kWh (average electricity rate in India)
    
    switch (type) {
      case 'reduce_consumption':
        return (data.currentConsumption * 0.3) * baseRate * 30; // 30% reduction
      case 'solar_usage':
        return (data.solarGeneration * 0.8) * baseRate * 30; // 80% solar utilization
      case 'peak_usage':
        return (data.solarGeneration * 0.6) * baseRate * 30; // 60% peak utilization
      default:
        return 0;
    }
  }

  /**
   * Calculate cost saving opportunity
   */
  private calculateCostSavingOpportunity(data: SolarData, currentHour: number): number {
    if (!this.isPeakSolarHour(currentHour)) {
      // If not in peak hours, suggest shifting usage
      const nonSolarDevices = data.devices.filter(d => d.isOn && d.consumption > 1.0);
      return nonSolarDevices.reduce((sum, device) => sum + (device.consumption * 8.5 * 30), 0);
    }
    return 0;
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Get optimal time for specific device usage
   */
  getOptimalDeviceTime(deviceType: string): string {
    const deviceSchedule: Record<string, string> = {
      'ac': '10:00 AM - 3:00 PM (Peak solar hours)',
      'washer': '11:00 AM - 2:00 PM (High solar generation)',
      'dishwasher': '12:00 PM - 1:00 PM (Peak efficiency)',
      'tv': '10:00 AM - 3:00 PM (Solar hours)',
      'refrigerator': 'All day (Consistent solar power)',
      'light': '6:00 PM - 8:00 PM (Evening solar)',
      'outlet': '10:00 AM - 3:00 PM (Peak solar)',
      'thermostat': '10:00 AM - 3:00 PM (Solar heating/cooling)'
    };
    
    return deviceSchedule[deviceType] || '10:00 AM - 3:00 PM (General solar hours)';
  }

  /**
   * Get weather-based solar prediction
   */
  getSolarPrediction(): { today: number; tomorrow: number; efficiency: string } {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    
    // Simulate weather-based prediction
    const baseGeneration = isDaytime ? 3.5 : 0;
    const weatherFactor = 0.85; // Simulate cloudy conditions
    
    return {
      today: baseGeneration * weatherFactor,
      tomorrow: baseGeneration * 0.9, // Slightly better tomorrow
      efficiency: weatherFactor > 0.8 ? 'Excellent' : weatherFactor > 0.6 ? 'Good' : 'Fair'
    };
  }
}

export const solarAdvisor = new SolarAdvisor();
