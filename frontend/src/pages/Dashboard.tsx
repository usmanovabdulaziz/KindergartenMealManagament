
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  ShoppingCart, 
  UtensilsCrossed, 
  TrendingDown,
  Activity
} from "lucide-react";
import API from '@/services/api';
import { Product, Meal } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PossiblePortion {
  meal: Meal;
  possiblePortions: number;
}

interface LowStockItem {
  product: Product;
  percentage: number;
}

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [possiblePortions, setPossiblePortions] = useState<PossiblePortion[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  
  useEffect(() => {
    // Load data
    const loadData = async () => {
      const [productsData, mealsData, portionsData] = await Promise.all([
        API.getProducts(),
        API.getMeals(),
        API.getPossiblePortions()
      ]);
      
      setProducts(productsData);
      setMeals(mealsData);
      setPossiblePortions(portionsData);
      
      // Calculate low stock items
      const lowStock = productsData
        .filter(product => product.threshold && product.totalWeight < product.threshold)
        .map(product => ({
          product,
          percentage: product.threshold ? (product.totalWeight / product.threshold) * 100 : 0
        }))
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 5);
      
      setLowStockItems(lowStock);
    };
    
    loadData();
  }, []);
  
  // Format chart data
  const portionsChartData = possiblePortions.map(item => ({
    name: item.meal.name,
    portions: item.possiblePortions
  }));
  
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
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">items in inventory</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Meals</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meals.filter(m => m.isActive).length}</div>
            <p className="text-xs text-muted-foreground">active recipes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">items below threshold</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
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
                data={portionsChartData}
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
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.product.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.product.totalWeight} / {item.product.threshold} {item.product.unit.abbreviation}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.percentage < 30 ? 'bg-destructive' : 'bg-primary'}`} 
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
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
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Mashed Potatoes served</p>
                <p className="text-xs text-muted-foreground">20 portions • 30 minutes ago • Cook John</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-secondary/10 p-2 rounded-full">
                <ShoppingCart className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium">New delivery received</p>
                <p className="text-xs text-muted-foreground">10kg Potatoes • 2 hours ago • Manager Alice</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 p-2 rounded-full">
                <UtensilsCrossed className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">Chicken Rice served</p>
                <p className="text-xs text-muted-foreground">25 portions • 3 hours ago • Cook John</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
