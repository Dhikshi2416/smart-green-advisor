import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sun, Cloud, Zap, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SolarPanelSimulationProps {
  solarGeneration: number;
  chartData: Array<{ time: string; solar: number }>;
}

export const SolarPanelSimulation = ({ solarGeneration, chartData }: SolarPanelSimulationProps) => {
  const maxCapacity = 5.0; // 5kW max capacity
  const efficiency = (solarGeneration / maxCapacity) * 100;
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour <= 18;

  const dailyProduction = chartData
    .filter(d => d.solar > 0)
    .reduce((sum, d) => sum + d.solar, 0);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="bg-gradient-subtle border-solar/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-solar" />
                Solar Panel Status
              </CardTitle>
              <CardDescription>Real-time solar energy generation</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-solar">{solarGeneration.toFixed(2)} kW</div>
              <div className="text-sm text-muted-foreground">Current Generation</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Efficiency</span>
              <span className="font-medium">{efficiency.toFixed(1)}%</span>
            </div>
            <Progress value={efficiency} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                {isDaytime ? <Sun className="h-4 w-4 text-solar" /> : <Cloud className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <div className="font-semibold">{isDaytime ? "Generating" : "Standby"}</div>
            </div>

            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Daily Total</span>
              </div>
              <div className="font-semibold">{dailyProduction.toFixed(1)} kWh</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Solar Generation Pattern</CardTitle>
          <CardDescription>24-hour solar energy generation</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="solar" 
                stroke="hsl(var(--solar))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-solar/10">
                <Sun className="h-5 w-5 text-solar" />
              </div>
              <div>
                <div className="text-2xl font-bold">{maxCapacity} kW</div>
                <div className="text-sm text-muted-foreground">Panel Capacity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(dailyProduction * 30).toFixed(0)} kWh</div>
                <div className="text-sm text-muted-foreground">Monthly Est.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">₹{(dailyProduction * 30 * 6).toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Monthly Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
