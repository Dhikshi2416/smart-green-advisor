import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Zap, Sun, DollarSign, Lightbulb, 
  AlertTriangle, CheckCircle, Clock, Activity 
} from "lucide-react";
import { realTimeAnalyticsService, AnalyticsData } from "@/services/realTimeAnalytics";
import { useToast } from "@/hooks/use-toast";

interface RealTimeAnalyticsProps {
  userId: string;
}

export function RealTimeAnalytics({ userId }: RealTimeAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const data = await realTimeAnalyticsService.getAnalyticsData(userId);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Consumption</p>
                <p className="text-2xl font-bold">
                  {analyticsData.consumption.daily[analyticsData.consumption.daily.length - 1]?.consumption.toFixed(1) || 0} kWh
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solar Generation</p>
                <p className="text-2xl font-bold">
                  {analyticsData.solar.generation.reduce((sum, g) => sum + g.generation, 0).toFixed(1)} kWh
                </p>
              </div>
              <Sun className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Savings</p>
                <p className="text-2xl font-bold">
                  ₹{analyticsData.solar.savings.monthly.toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold">
                  {analyticsData.devices.efficiency.length > 0 
                    ? (analyticsData.devices.efficiency.reduce((sum, d) => sum + d.efficiency, 0) / analyticsData.devices.efficiency.length).toFixed(0)
                    : 0}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="solar">Solar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Consumption Chart */}
            <Card>
              <CardHeader>
                <CardTitle>24-Hour Consumption</CardTitle>
                <CardDescription>Real-time energy usage pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.consumption.hourly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="consumption" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="solar" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Consumers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Energy Consumers</CardTitle>
                <CardDescription>Devices using the most energy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.devices.topConsumers.map((device, index) => (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{device.consumption.toFixed(1)} kWh</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{device.percentage.toFixed(1)}%</p>
                        <Progress value={device.percentage} className="w-20 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Insights</CardTitle>
              <CardDescription>AI-powered recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.insights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                    insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {insight.type === 'alert' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : insight.type === 'saving' ? (
                        <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant={insight.priority === 'high' ? 'destructive' : 'default'}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Impact:</span>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-medium">{insight.impact}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumption" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Consumption Trend */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Consumption Trend</CardTitle>
                <CardDescription>Daily energy usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.consumption.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="solar" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Consumption</CardTitle>
                <CardDescription>12-month energy usage pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.consumption.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="consumption" fill="#3b82f6" />
                    <Bar dataKey="solar" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Device Efficiency</CardTitle>
                <CardDescription>Performance of your smart devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.devices.efficiency.map((device, index) => (
                    <div key={device.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{device.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{device.efficiency.toFixed(0)}%</span>
                          <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                            {device.status}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={device.efficiency} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Device Trends</CardTitle>
                <CardDescription>Usage patterns and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.devices.trends.map((device, index) => (
                    <div key={device.name} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium">{device.name}</span>
                      <div className="flex items-center gap-2">
                        {device.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : device.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          device.trend === 'up' ? 'text-red-500' :
                          device.trend === 'down' ? 'text-green-500' :
                          'text-gray-500'
                        }`}>
                          {device.change > 0 ? '+' : ''}{device.change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="solar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Solar Generation */}
            <Card>
              <CardHeader>
                <CardTitle>Solar Generation</CardTitle>
                <CardDescription>Real-time solar power output</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.solar.generation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="generation" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weather Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Weather Impact</CardTitle>
                <CardDescription>How weather affects solar generation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.solar.weather}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="generation" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Savings Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Solar Savings Summary</CardTitle>
              <CardDescription>Financial benefits from solar energy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Daily</p>
                  <p className="text-2xl font-bold text-green-600">₹{analyticsData.solar.savings.daily.toFixed(0)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-2xl font-bold text-green-600">₹{analyticsData.solar.savings.monthly.toFixed(0)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Yearly</p>
                  <p className="text-2xl font-bold text-green-600">₹{analyticsData.solar.savings.yearly.toFixed(0)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-green-600">₹{analyticsData.solar.savings.total.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
