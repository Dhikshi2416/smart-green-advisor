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
    <Card className={`p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover-glow group cursor-pointer card-gradient border-2 ${
      variant === "solar" ? "bg-solar/10 border-solar/20 hover:border-solar/40 animate-pulse-glow" : "hover:border-primary/50"
    }`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium group-hover:text-primary transition-colors">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">
              {value}
            </h3>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          {trend && (
            <p className="text-xs text-primary flex items-center gap-1 font-medium group-hover:translate-x-1 transition-transform">
              <TrendingDown className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
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
      <div className="animate-scale-in" style={{ animationDelay: "0s" }}>
        <MetricCard
          title="Total Consumption"
          value={totalConsumption.toFixed(1)}
          unit="kWh"
          icon={<Zap className="h-6 w-6 text-primary" />}
          trend="12% vs last month"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
        <MetricCard
          title="Solar Generation"
          value={solarGeneration.toFixed(1)}
          unit="kWh"
          icon={<Sun className="h-6 w-6 text-solar animate-rotate-slow" />}
          variant="solar"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: "0.2s" }}>
        <MetricCard
          title="Net Usage"
          value={netUsage.toFixed(1)}
          unit="kWh"
          icon={<Battery className="h-6 w-6 text-primary" />}
          trend="8% reduction"
        />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: "0.3s" }}>
        <MetricCard
          title="Monthly Savings"
          value={`₹${savings.toFixed(0)}`}
          unit="INR"
          icon={<TrendingDown className="h-6 w-6 text-primary" />}
        />
      </div>
    </div>
  );
};
