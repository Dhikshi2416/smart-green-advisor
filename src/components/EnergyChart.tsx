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
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Energy Trends (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" className="text-xs" />
          <YAxis className="text-xs" label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem'
            }} 
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="consumption" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            name="Consumption"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="solar" 
            stroke="hsl(var(--solar))" 
            strokeWidth={2}
            name="Solar Generation"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
