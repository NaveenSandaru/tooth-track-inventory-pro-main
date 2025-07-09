
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3
} from "lucide-react";

const Reports = () => {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [reportType, setReportType] = useState("inventory");

  const stockReports = [
    {
      id: 1,
      name: "Low Stock Items Report",
      description: "Items below minimum stock levels",
      count: 5,
      lastGenerated: "2024-07-08",
      type: "critical"
    },
    {
      id: 2,
      name: "Expiring Items Report",
      description: "Items expiring in next 30 days",
      count: 3,
      lastGenerated: "2024-07-08",
      type: "warning"
    },
    {
      id: 3,
      name: "Out of Stock Report",
      description: "Items currently out of stock",
      count: 1,
      lastGenerated: "2024-07-07",
      type: "critical"
    },
    {
      id: 4,
      name: "Stock Valuation Report",
      description: "Total inventory value by category",
      count: null,
      lastGenerated: "2024-07-05",
      type: "info"
    }
  ];

  const usageReports = [
    {
      category: "PPE & Safety",
      itemsUsed: 245,
      totalValue: 3150.75,
      change: 12.5,
      trend: "up"
    },
    {
      category: "Restorative Materials",
      itemsUsed: 89,
      totalValue: 4250.30,
      change: -5.2,
      trend: "down"
    },
    {
      category: "Anesthetics",
      itemsUsed: 156,
      totalValue: 875.60,
      change: 8.9,
      trend: "up"
    },
    {
      category: "Instruments",
      itemsUsed: 67,
      totalValue: 2100.45,
      change: 3.1,
      trend: "up"
    }
  ];

  const purchaseReports = [
    {
      supplier: "MedSupply Co.",
      totalOrders: 12,
      totalAmount: 15750.00,
      lastOrder: "2024-07-05",
      status: "active"
    },
    {
      supplier: "DentaCorp",
      totalOrders: 8,
      totalAmount: 12400.50,
      lastOrder: "2024-06-28",
      status: "active"
    },
    {
      supplier: "AnestheCare Ltd.",
      totalOrders: 6,
      totalAmount: 5250.75,
      lastOrder: "2024-07-02",
      status: "active"
    },
    {
      supplier: "Precision Tools",
      totalOrders: 4,
      totalAmount: 3800.25,
      lastOrder: "2024-06-15",
      status: "pending"
    }
  ];

  const monthlyTrends = [
    { month: "Jan", consumption: 12500, orders: 8, value: 15600 },
    { month: "Feb", consumption: 11800, orders: 6, value: 14200 },
    { month: "Mar", consumption: 13200, orders: 9, value: 16800 },
    { month: "Apr", consumption: 12900, orders: 7, value: 15900 },
    { month: "May", consumption: 14100, orders: 10, value: 18200 },
    { month: "Jun", consumption: 13500, orders: 8, value: 17100 },
    { month: "Jul", consumption: 15200, orders: 11, value: 19500 }
  ];

  const getReportBadge = (type: string) => {
    switch (type) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case "info":
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Analyze your inventory performance and trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-dental-primary hover:bg-dental-secondary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                <p className="text-2xl font-bold text-dental-dark">$47,520</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5.2% from last month
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Consumed</p>
                <p className="text-2xl font-bold text-dental-dark">557</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.3% from last month
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Purchase Orders</p>
                <p className="text-2xl font-bold text-dental-dark">30</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -8.1% from last month
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alert Items</p>
                <p className="text-2xl font-bold text-dental-dark">8</p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  5 low stock, 3 expiring
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stock">Stock Reports</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="purchasing">Purchase Reports</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stockReports.map((report) => (
              <Card key={report.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{report.name}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                    {getReportBadge(report.type)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {report.count && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Items:</span>
                        <span className="font-semibold text-dental-dark">{report.count}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Last generated: {report.lastGenerated}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-1" />
                      View Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Category</CardTitle>
              <CardDescription>Consumption patterns for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {usageReports.map((usage, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-dental-dark">{usage.category}</h4>
                        <div className="flex items-center space-x-2">
                          {usage.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            usage.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}>
                            {usage.change > 0 ? "+" : ""}{usage.change}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Items Used:</span>
                          <span className="font-medium text-dental-dark ml-2">{usage.itemsUsed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium text-dental-dark ml-2">${usage.totalValue.toFixed(2)}</span>
                        </div>
                      </div>
                      <Progress value={75} className="mt-3 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchasing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary by Supplier</CardTitle>
              <CardDescription>Purchase order summary for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900">Supplier</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Orders</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Total Amount</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Last Order</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {purchaseReports.map((purchase, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-dental-dark">{purchase.supplier}</td>
                        <td className="p-4">{purchase.totalOrders}</td>
                        <td className="p-4 font-medium">${purchase.totalAmount.toFixed(2)}</td>
                        <td className="p-4 text-gray-600">{purchase.lastOrder}</td>
                        <td className="p-4">
                          <Badge className={
                            purchase.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }>
                            {purchase.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Consumption Trend</CardTitle>
                <CardDescription>Total inventory consumption over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 w-12">{trend.month}</span>
                      <div className="flex-1 mx-4">
                        <Progress value={(trend.consumption / 20000) * 100} className="h-3" />
                      </div>
                      <span className="text-sm font-semibold text-dental-dark w-20 text-right">
                        ${trend.consumption.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase Order Trends</CardTitle>
                <CardDescription>Monthly purchase order frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 w-12">{trend.month}</span>
                      <div className="flex-1 mx-4">
                        <Progress value={(trend.orders / 15) * 100} className="h-3" />
                      </div>
                      <span className="text-sm font-semibold text-dental-dark w-20 text-right">
                        {trend.orders} orders
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
