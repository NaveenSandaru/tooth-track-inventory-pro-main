
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Search,
  Bell,
  Plus,
  Archive,
  Clock
} from "lucide-react";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = [
    {
      title: "Total Items",
      value: "248",
      change: "+12%",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Low Stock Alerts",
      value: "5",
      change: "-2 from yesterday",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Items Expiring Soon",
      value: "3",
      change: "Next 30 days",
      icon: Calendar,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Monthly Usage",
      value: "$12,450",
      change: "+8.2%",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  const lowStockItems = [
    { id: 1, name: "Dental Gloves (Medium)", current: 15, minimum: 50, unit: "boxes", status: "critical" },
    { id: 2, name: "Composite Resin A2", current: 8, minimum: 20, unit: "tubes", status: "low" },
    { id: 3, name: "Anesthetic Cartridges", current: 12, minimum: 30, unit: "pcs", status: "low" },
    { id: 4, name: "Dental Burs #2", current: 5, minimum: 25, unit: "pcs", status: "critical" },
    { id: 5, name: "Fluoride Varnish", current: 3, minimum: 15, unit: "tubes", status: "critical" }
  ];

  const expiringItems = [
    { id: 1, name: "Local Anesthetic", expiryDate: "2024-08-15", daysLeft: 12, batch: "LAN240801" },
    { id: 2, name: "Dental Cement", expiryDate: "2024-08-20", daysLeft: 17, batch: "DC240802" },
    { id: 3, name: "Bonding Agent", expiryDate: "2024-08-25", daysLeft: 22, batch: "BA240803" }
  ];

  const recentActivity = [
    { id: 1, action: "Stock Added", item: "Dental Gloves (Large)", quantity: "20 boxes", time: "2 hours ago", user: "Dr. Smith" },
    { id: 2, action: "Item Used", item: "Composite Resin", quantity: "3 tubes", time: "4 hours ago", user: "Dr. Johnson" },
    { id: 3, action: "New Item Added", item: "Digital X-Ray Sensors", quantity: "2 pcs", time: "6 hours ago", user: "Admin" },
    { id: 4, action: "Stock Alert", item: "Anesthetic Cartridges", quantity: "Below minimum", time: "8 hours ago", user: "System" }
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your inventory overview.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button className="bg-dental-primary hover:bg-dental-secondary">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-dental-dark mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                Low Stock Alerts
              </CardTitle>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {lowStockItems.length} items
              </Badge>
            </div>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-dental-dark">{item.name}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600">
                      Current: {item.current} {item.unit}
                    </span>
                    <span className="text-sm text-gray-600">
                      Min: {item.minimum} {item.unit}
                    </span>
                  </div>
                  <Progress 
                    value={(item.current / item.minimum) * 100} 
                    className="mt-2 h-2"
                  />
                </div>
                <Badge 
                  variant={item.status === 'critical' ? 'destructive' : 'secondary'}
                  className={item.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expiring Items */}
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Calendar className="h-5 w-5 text-red-500 mr-2" />
                Expiring Soon
              </CardTitle>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {expiringItems.length} items
              </Badge>
            </div>
            <CardDescription>Items expiring in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-dental-dark">{item.name}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600">
                      Batch: {item.batch}
                    </span>
                    <span className="text-sm text-gray-600">
                      Expires: {item.expiryDate}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={item.daysLeft <= 15 ? 'destructive' : 'secondary'}
                  className={item.daysLeft <= 15 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                >
                  {item.daysLeft} days
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock className="h-5 w-5 text-dental-primary mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest inventory transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-dental-primary rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-dental-dark">{activity.action}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.item}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{activity.quantity}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                    <span>•</span>
                    <span>by {activity.user}</span>
                  </div>
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
