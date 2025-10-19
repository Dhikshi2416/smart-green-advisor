import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";

interface ConsumptionData {
  date: string;
  consumption: number;
}

interface DeviceConsumptionHistoryProps {
  deviceId: string;
  deviceName: string;
}

export const DeviceConsumptionHistory = ({ deviceId, deviceName }: DeviceConsumptionHistoryProps) => {
  const [dailyData, setDailyData] = useState<ConsumptionData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ConsumptionData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ConsumptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConsumptionData();
  }, [deviceId]);

  const loadConsumptionData = async () => {
    setIsLoading(true);
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch daily data (last 24 hours by hour)
    const { data: daily } = await supabase
      .from("device_consumption_history")
      .select("*")
      .eq("device_id", deviceId)
      .gte("recorded_at", oneDayAgo.toISOString())
      .order("recorded_at", { ascending: true });

    // Fetch weekly data (last 7 days)
    const { data: weekly } = await supabase
      .from("device_consumption_history")
      .select("*")
      .eq("device_id", deviceId)
      .gte("recorded_at", oneWeekAgo.toISOString())
      .order("recorded_at", { ascending: true });

    // Fetch monthly data (last 30 days)
    const { data: monthly } = await supabase
      .from("device_consumption_history")
      .select("*")
      .eq("device_id", deviceId)
      .gte("recorded_at", oneMonthAgo.toISOString())
      .order("recorded_at", { ascending: true });

    // Process daily data (group by hour)
    if (daily) {
      const hourlyMap = new Map<string, number>();
      daily.forEach(record => {
        const hour = new Date(record.recorded_at).getHours();
        const key = `${hour}:00`;
        hourlyMap.set(key, (hourlyMap.get(key) || 0) + Number(record.consumption));
      });
      setDailyData(
        Array.from(hourlyMap.entries()).map(([date, consumption]) => ({
          date,
          consumption: Number(consumption.toFixed(2))
        }))
      );
    }

    // Process weekly data (group by day)
    if (weekly) {
      const dailyMap = new Map<string, number>();
      weekly.forEach(record => {
        const date = new Date(record.recorded_at).toLocaleDateString('en-US', { weekday: 'short' });
        dailyMap.set(date, (dailyMap.get(date) || 0) + Number(record.consumption));
      });
      setWeeklyData(
        Array.from(dailyMap.entries()).map(([date, consumption]) => ({
          date,
          consumption: Number(consumption.toFixed(2))
        }))
      );
    }

    // Process monthly data (group by day)
    if (monthly) {
      const dailyMap = new Map<string, number>();
      monthly.forEach(record => {
        const date = new Date(record.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyMap.set(date, (dailyMap.get(date) || 0) + Number(record.consumption));
      });
      setMonthlyData(
        Array.from(dailyMap.entries()).map(([date, consumption]) => ({
          date,
          consumption: Number(consumption.toFixed(2))
        }))
      );
    }

    setIsLoading(false);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 rounded-lg border shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-primary font-semibold">
            {payload[0].value.toFixed(2)} kWh
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartView = ({ data }: { data: ConsumptionData[] }) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="consumption" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {deviceName} - Consumption History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading consumption data...</div>
          </div>
        ) : (
          <Tabs defaultValue="day" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Day
              </TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="day" className="mt-4">
              {dailyData.length > 0 ? (
                <ChartView data={dailyData} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No data available for the last 24 hours
                </div>
              )}
            </TabsContent>
            <TabsContent value="week" className="mt-4">
              {weeklyData.length > 0 ? (
                <ChartView data={weeklyData} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No data available for the last 7 days
                </div>
              )}
            </TabsContent>
            <TabsContent value="month" className="mt-4">
              {monthlyData.length > 0 ? (
                <ChartView data={monthlyData} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No data available for the last 30 days
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};