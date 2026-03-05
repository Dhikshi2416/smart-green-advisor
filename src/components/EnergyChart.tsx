import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle } from "lucide-react";

interface EnergyChartProps {
  data: Array<{
    time: string;
    consumption: number;
    solar: number;
  }>;
  hasDevices?: boolean;
}

export const EnergyChart = ({ data, hasDevices = false }: EnergyChartProps) => {
  const hasData = data.some(d => d.consumption > 0 || d.solar > 0);

  return (
    <Card className="p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover-glow card-gradient border-2 hover:border-primary/50">
      <h3 className="text-lg font-semibold mb-4 bg-gradient-primary bg-clip-text text-transparent">Energy Trends (24h)</h3>
      
      {!hasDevices && !hasData && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/50 text-muted-foreground text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>No devices connected — chart shows real-time data once devices are added</span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            className="text-xs" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs" 
            label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }} 
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Line 
            type={hasData ? "monotone" : "linear"}
            dataKey="consumption" 
            stroke="hsl(var(--primary))" 
            strokeWidth={hasData ? 3 : 1}
            name="Consumption"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
            strokeDasharray={hasData ? undefined : "5 5"}
          />
          <Line 
            type={hasData ? "monotone" : "linear"}
            dataKey="solar" 
            stroke="hsl(var(--solar))" 
            strokeWidth={hasData ? 3 : 1}
            name="Solar Generation"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
            strokeDasharray={hasData ? undefined : "5 5"}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
