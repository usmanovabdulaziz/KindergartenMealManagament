import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DownloadIcon, AlertTriangle } from "lucide-react";
import { useApiService } from "@/hooks/useApiService";
import { toast } from "@/components/ui/sonner";
import * as XLSX from "xlsx";

const COLORS = [
  "#4A90E2",
  "#7ED321",
  "#F5A623",
  "#D0021B",
  "#BD10E0",
  "#1abc9c",
  "#9b59b6",
  "#e67e22",
  "#e74c3c",
];

// CSV export
function exportToCSV(data: any[], filename: string) {
  if (!data || !data.length) return;
  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(","));
  for (const row of data) {
    const values = headers.map((header) => {
      let v = row[header];
      if (typeof v === "object" && v !== null) v = JSON.stringify(v);
      return `"${v ?? ""}"`;
    });
    csvRows.push(values.join(","));
  }
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// XLSX export
function exportToXLSX(data: any[], filename: string) {
  if (!data || !data.length) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
}

// JSON export
function exportToJSON(data: any[], filename: string) {
  if (!data || !data.length) return;
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const Reports = () => {
  const { api } = useApiService();
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [mealServings, setMealServings] = useState<any[]>([]);
  const [ingredientData, setIngredientData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("usage");
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "json">(
    "csv"
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsData, servingsData] = await Promise.all([
          api.getMonthlyReports(),
          api.getMealServings(),
        ]);
        setMonthlyReports(Array.isArray(reportsData) ? reportsData : []);
        setMealServings(Array.isArray(servingsData) ? servingsData : []);
      } catch (error) {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (activeTab !== "ingredients") return;
    const loadIngredients = async () => {
      try {
        const data = await api.getIngredientUsage();
        setIngredientData(Array.isArray(data) ? data : []);
      } catch (e) {
        setIngredientData([]);
        toast.error("Failed to load ingredient usage data");
      }
    };
    loadIngredients();
    // eslint-disable-next-line
  }, [activeTab]);

  // Meals usage by type
  const formatUsageData = () => {
    const mealCounts: Record<string, number> = {};
    mealServings.forEach((serving) => {
      const name = serving.meal?.name;
      if (!name) return;
      // Backend field: portions_served
      mealCounts[name] = (mealCounts[name] || 0) + (serving.portions_served ?? 0);
    });
    return Object.entries(mealCounts).map(([name, count]) => ({
      name,
      portions: count,
    }));
  };

  // Meal distribution by category (pie)
  const formatPieData = () => {
    const categoryData: Record<string, number> = {};
    mealServings.forEach((serving) => {
      // Sometimes category may be under meal.category or meal.category.name
      const category = serving.meal?.category?.name || serving.meal?.category;
      if (!category) return;
      categoryData[category] = (categoryData[category] || 0) + (serving.portions_served ?? 0);
    });
    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Efficiency data for chart/table
  const formatEfficiencyData = () =>
    monthlyReports.map((report) => ({
      name: report.meal?.name,
      served: report.portions_served ?? 0,
      possible: report.portions_possible ?? 0,
      discrepancy: report.discrepancy_rate ?? 0,
    }));

  // Recent servings (sorted newest first)
  const recentServings = [...mealServings].sort(
    (a, b) =>
      new Date(b.served_at).getTime() -
      new Date(a.served_at).getTime()
  ).slice(0, 10);

  // Export logic for active tab
  const handleExport = () => {
    let data: any[] = [];
    let filename = "";
    if (activeTab === "usage") {
      data = formatUsageData();
      filename = "meal-usage-report";
    } else if (activeTab === "efficiency") {
      data = formatEfficiencyData();
      filename = "efficiency-report";
    } else if (activeTab === "ingredients") {
      data = ingredientData;
      filename = "ingredient-report";
    }
    if (!data.length) {
      toast.error("No data to export!");
      return;
    }
    if (exportFormat === "csv") exportToCSV(data, filename + ".csv");
    else if (exportFormat === "xlsx") exportToXLSX(data, filename + ".xlsx");
    else if (exportFormat === "json") exportToJSON(data, filename + ".json");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2 items-center">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="json">JSON</option>
          </select>
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="usage">Meal Usage</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        </TabsList>
        {/* Meal Usage Section */}
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
                    data={formatUsageData()}
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
                        data={formatPieData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {formatPieData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
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
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentServings.map((serving) => (
                        <TableRow key={serving.id}>
                          <TableCell className="font-medium">
                            {serving.meal?.name}
                          </TableCell>
                          {/* Use backend field: portions_served */}
                          <TableCell>{serving.portions_served}</TableCell>
                          {/* Use backend field: served_by?.username */}
                          <TableCell>{serving.served_by?.username}</TableCell>
                          <TableCell>
                            {serving.served_at
                              ? new Date(serving.served_at).toLocaleString()
                              : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Efficiency Section */}
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
                    data={formatEfficiencyData()}
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
                        <TableCell className="font-medium">
                          {report.meal?.name}
                        </TableCell>
                        <TableCell>{report.portions_served}</TableCell>
                        <TableCell>{report.portions_possible}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {(report.discrepancy_rate ?? 0) + "%"}
                            {(report.discrepancy_rate ?? 0) > 15 && (
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
        {/* Ingredients Section */}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;