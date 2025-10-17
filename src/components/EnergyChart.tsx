import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface EnergyChartProps {
  data: Array<{
    time: string;
    consumption: number;
    solar: number;
  }>;
}

export const EnergyChart = ({ data }: EnergyChartProps) => {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-4">Energy Trends (24h)</h3>
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
            label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
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
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
          />
          <Line 
            type="monotone" 
            dataKey="consumption" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            name="Consumption"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="solar" 
            stroke="hsl(var(--solar))" 
            strokeWidth={3}
            name="Solar Generation"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
