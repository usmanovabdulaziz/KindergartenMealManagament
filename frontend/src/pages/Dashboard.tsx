import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ShoppingCart,
  UtensilsCrossed,
  TrendingDown,
  Activity
} from "lucide-react";
import { useApiService } from '@/hooks/useApiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Utility to format date/time ago
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const Dashboard = () => {
  const { api, apiBaseUrl } = useApiService();

  // Unified dashboard state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch dashboard data from backend
  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboardSummary();
      setDashboardData(data);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Setup WebSocket for dashboard updates (secure if needed)
    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${apiBaseUrl.replace(/^https?:\/\//, '')}/ws/dashboard/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // console.log('Dashboard WebSocket connected');
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'dashboard_update') {
        fetchDashboard();
      }
    };
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    ws.onclose = () => {
      // Optionally: try to reconnect after some time
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line
  }, [apiBaseUrl]);

  // Loading state
  if (!dashboardData) return <div>Loading...</div>;

  // Data mapping from backend
  const ingredientCount = dashboardData.ingredient_count || 0;
  const activeMeals = dashboardData.active_meals || 0;
  const lowStockCount = dashboardData.low_stock_count || 0;
  const mealsServedToday = dashboardData.meals_served_today || 0;
  const availablePortions = dashboardData.available_portions || [];
  const lowStockIngredients = dashboardData.low_stock_ingredients || [];
  const recentActivities = dashboardData.recent_activities || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredientCount}</div>
            <p className="text-xs text-muted-foreground">items in inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Meals</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMeals}</div>
            <p className="text-xs text-muted-foreground">active recipes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">items below threshold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meals Served Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealsServedToday}</div>
            <p className="text-xs text-muted-foreground">meals served today</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Available Portions</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={availablePortions.map((item: any) => ({ name: item.meal, portions: item.portions }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="portions" fill="#4A90E2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Low Stock Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockIngredients.length > 0 ? (
                lowStockIngredients.map((item: any) => {
                  const percent = item.threshold ? Math.round((item.total_weight / item.threshold) * 100) : 0;
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.total_weight} / {item.threshold} {item.unit}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${percent < 30 ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No low stock ingredients</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((item: any, idx: number) => (
              <div className="flex items-center gap-4" key={idx}>
                <div className="bg-primary/10 p-2 rounded-full">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.meal} served</p>
                  <p className="text-xs text-muted-foreground">
                    {item.portion_count} portions • {timeAgo(item.served_at)} • {item.served_by}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;