
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DownloadIcon, AlertTriangle } from 'lucide-react';
import API from '@/services/api';
import { MonthlyReport, MealServing } from '@/types';

const COLORS = ['#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#BD10E0'];

const Reports = () => {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [mealServings, setMealServings] = useState<MealServing[]>([]);
  const [activeTab, setActiveTab] = useState('usage');
  
  useEffect(() => {
    const loadData = async () => {
      const [reportsData, servingsData] = await Promise.all([
        API.getMonthlyReports(),
        API.getMealServings()
      ]);
      
      setMonthlyReports(reportsData);
      setMealServings(servingsData);
    };
    
    loadData();
  }, []);
  
  // Format data for usage chart
  const formatUsageData = () => {
    // Group by meal name
    const mealCounts: Record<string, number> = {};
    mealServings.forEach(serving => {
      const name = serving.meal.name;
      mealCounts[name] = (mealCounts[name] || 0) + serving.portionCount;
    });
    
    // Convert to chart data
    return Object.entries(mealCounts).map(([name, count]) => ({
      name,
      portions: count
    }));
  };
  
  // Format data for efficiency chart
  const formatEfficiencyData = () => {
    return monthlyReports.map(report => ({
      name: report.meal.name,
      served: report.portionsServed,
      possible: report.portionsPossible,
      discrepancy: report.discrepancyRate
    }));
  };
  
  // Format data for ingredient usage chart
  const formatIngredientData = () => {
    // This would typically come from API but we'll create example data
    return [
      { name: 'Potatoes', used: 25, delivered: 30 },
      { name: 'Milk', used: 15, delivered: 20 },
      { name: 'Chicken', used: 10, delivered: 12 },
      { name: 'Rice', used: 18, delivered: 20 },
      { name: 'Apples', used: 8, delivered: 10 }
    ];
  };
  
  // Format data for pie chart
  const formatPieData = () => {
    // Group servings by meal category
    const categoryData: Record<string, number> = {};
    mealServings.forEach(serving => {
      const category = serving.meal.category.name;
      categoryData[category] = (categoryData[category] || 0) + serving.portionCount;
    });
    
    // Convert to chart data
    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  const usageData = formatUsageData();
  const efficiencyData = formatEfficiencyData();
  const ingredientData = formatIngredientData();
  const pieData = formatPieData();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button variant="outline">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="usage">Meal Usage</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meals Served</CardTitle>
              <CardDescription>
                Total number of portions served by meal type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="portions" fill="#4A90E2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Meal Distribution</CardTitle>
                <CardDescription>
                  Percentage of meals served by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Servings</CardTitle>
                <CardDescription>
                  The most recently served meals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Meal</TableHead>
                        <TableHead>Portions</TableHead>
                        <TableHead>Served By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mealServings.map((serving) => (
                        <TableRow key={serving.id}>
                          <TableCell className="font-medium">{serving.meal.name}</TableCell>
                          <TableCell>{serving.portionCount}</TableCell>
                          <TableCell>{serving.user.username}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="efficiency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portions Analysis</CardTitle>
              <CardDescription>
                Comparison of served vs. possible portions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={efficiencyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="served" fill="#4A90E2" name="Served" />
                    <Bar dataKey="possible" fill="#82ca9d" name="Possible" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Discrepancy Rate</CardTitle>
              <CardDescription>
                Difference between possible and served portions (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meal</TableHead>
                      <TableHead>Served</TableHead>
                      <TableHead>Possible</TableHead>
                      <TableHead>Discrepancy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.meal.name}</TableCell>
                        <TableCell>{report.portionsServed}</TableCell>
                        <TableCell>{report.portionsPossible}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {report.discrepancyRate}%
                            {report.discrepancyRate > 15 && (
                              <AlertTriangle className="h-4 w-4 text-destructive ml-1" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ingredients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Usage vs. Delivery</CardTitle>
              <CardDescription>
                Comparison of ingredients used vs. delivered
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ingredientData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="used" fill="#F5A623" name="Used (kg)" />
                    <Bar dataKey="delivered" fill="#7ED321" name="Delivered (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ingredient Trend</CardTitle>
              <CardDescription>
                Usage trend over time by weight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { date: 'Week 1', potatoes: 10, chicken: 5, milk: 8 },
                      { date: 'Week 2', potatoes: 12, chicken: 6, milk: 7 },
                      { date: 'Week 3', potatoes: 8, chicken: 7, milk: 9 },
                      { date: 'Week 4', potatoes: 15, chicken: 8, milk: 10 }
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="potatoes" stroke="#4A90E2" name="Potatoes" />
                    <Line type="monotone" dataKey="chicken" stroke="#F5A623" name="Chicken" />
                    <Line type="monotone" dataKey="milk" stroke="#BD10E0" name="Milk" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
