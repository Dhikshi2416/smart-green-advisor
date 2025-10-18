import { Card } from "@/components/ui/card";
import { Zap, Sun, TrendingDown, Battery } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: "default" | "solar";
}

const MetricCard = ({ title, value, unit, icon, trend, variant = "default" }: MetricCardProps) => {
  return (
    <Card className={`p-6 transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 ${
      variant === "solar" ? "bg-solar/10 border-solar/20 hover:bg-solar/15" : "hover:border-primary/30"
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {value}
            </h3>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          {trend && (
            <p className="text-xs text-primary flex items-center gap-1 font-medium">
              <TrendingDown className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg transition-transform hover:scale-110 ${
          variant === "solar" ? "bg-solar/20" : "bg-primary/10"
        }`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

interface EnergyMetricsProps {
  totalConsumption: number;
  solarGeneration: number;
  netUsage: number;
  savings: number;
}

export const EnergyMetrics = ({ totalConsumption, solarGeneration, netUsage, savings }: EnergyMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Consumption"
        value={totalConsumption.toFixed(1)}
        unit="kWh"
        icon={<Zap className="h-6 w-6 text-primary" />}
        trend="12% vs last month"
      />
      <MetricCard
        title="Solar Generation"
        value={solarGeneration.toFixed(1)}
        unit="kWh"
        icon={<Sun className="h-6 w-6 text-solar" />}
        variant="solar"
      />
      <MetricCard
        title="Net Usage"
        value={netUsage.toFixed(1)}
        unit="kWh"
        icon={<Battery className="h-6 w-6 text-primary" />}
        trend="8% reduction"
      />
      <MetricCard
        title="Monthly Savings"
        value={`₹${savings.toFixed(0)}`}
        unit="INR"
        icon={<TrendingDown className="h-6 w-6 text-primary" />}
      />
    </div>
  );
};
