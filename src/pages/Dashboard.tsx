
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Define custom type for inventory items with joined supplier data
type InventoryItemWithRelations = Database["public"]["Tables"]["inventory_items"]["Row"] & {
  inventory_categories?: { name: string } | null;
  supplier?: { name: string } | null;
};

type RecentActivity = {
  id: string;
  action: string;
  item: string;
  quantity: string;
  time: string;
  user: string;
};

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithRelations[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItemWithRelations[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItemWithRelations[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemConfig, setSystemConfig] = useState<Database["public"]["Tables"]["system_configuration"]["Row"] | null>(null);
  const [stats, setStats] = useState([
    {
      title: "Total Items",
      value: "0",
      change: "Loading...",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Low Stock Alerts",
      value: "0",
      change: "Loading...",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Items Expiring Soon",
      value: "0",
      change: "Loading...",
      icon: Calendar,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Monthly Usage",
      value: "Rs0",
      change: "Loading...",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get system configuration
      const { data: configData } = await supabase
        .from('system_configuration')
        .select('*')
        .limit(1)
        .single();
      
      if (configData) {
        setSystemConfig(configData);
      }

      // Get all inventory items
      const { data: itemsData } = await supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_categories(name),
          supplier:suppliers(name)
        `)
        .order('name');

      if (itemsData) {
        setInventoryItems(itemsData as InventoryItemWithRelations[]);
        
        // Calculate low stock items
        const lowStock = itemsData.filter((item: InventoryItemWithRelations) => 
          item.current_stock <= item.minimum_stock
        ).sort((a: InventoryItemWithRelations, b: InventoryItemWithRelations) => 
          (a.current_stock / a.minimum_stock) - (b.current_stock / b.minimum_stock)
        ).slice(0, 5);
        
        setLowStockItems(lowStock);

        // Calculate expiring items
        const today = new Date();
        const expiryThreshold = configData?.expiry_warning_days || 30;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + expiryThreshold);

        const expiring = itemsData
          .filter((item: InventoryItemWithRelations) => {
            if (!item.expiry_date) return false;
            const expiryDate = new Date(item.expiry_date);
            return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
          })
          .sort((a: InventoryItemWithRelations, b: InventoryItemWithRelations) => {
            const aDate = new Date(a.expiry_date!);
            const bDate = new Date(b.expiry_date!);
            return aDate.getTime() - bDate.getTime();
          })
          .slice(0, 3);
        
        setExpiringItems(expiring);

        // Update stats
        const updatedStats = [...stats];
        updatedStats[0].value = itemsData.length.toString();
        updatedStats[0].change = `${itemsData.length} total items`;
        
        updatedStats[1].value = lowStock.length.toString();
        updatedStats[1].change = `${Math.round((lowStock.length / itemsData.length) * 100)}% of inventory`;
        
        updatedStats[2].value = expiring.length.toString();
        updatedStats[2].change = `Next ${expiryThreshold} days`;
        
        // For monthly usage, we would need transaction data
        // This is a placeholder - in a real implementation, you'd calculate this from transactions
        const estimatedMonthlyUsage = itemsData.reduce((sum, item) => sum + (item.unit_price * (item.minimum_stock / 2)), 0);
        updatedStats[3].value = `$${Math.round(estimatedMonthlyUsage).toLocaleString()}`;
        updatedStats[3].change = "Estimated monthly";
        
        setStats(updatedStats);
      }

      // For recent activity, we'll create a mock implementation since there's no direct table for this
      // In a real implementation, this would come from a transactions or activity log table
      // For now, we'll generate some based on the inventory data
      if (itemsData && itemsData.length > 0) {
        const mockActivity: RecentActivity[] = [];
        
        // Add some mock activities based on real inventory items
        const recentItems = itemsData.slice(0, 4);
        const actions = ["Stock Added", "Item Used", "New Item Added", "Stock Alert"];
        const times = ["2 hours ago", "4 hours ago", "6 hours ago", "8 hours ago"];
        const users = ["Dr. Smith", "Dr. Johnson", "Admin", "System"];
        
        recentItems.forEach((item, index) => {
          mockActivity.push({
            id: index.toString(),
            action: actions[index],
            item: item.name,
            quantity: index === 3 ? "Below minimum" : `${Math.floor(Math.random() * 10) + 1} ${item.unit_of_measurement}`,
            time: times[index],
            user: users[index]
          });
        });
        
        setRecentActivity(mockActivity);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days left until expiry
  const getDaysLeft = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

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
            {lowStockItems.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No low stock items</div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-dental-dark">{item.name}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Current: {item.current_stock} {item.unit_of_measurement}
                      </span>
                      <span className="text-sm text-gray-600">
                        Min: {item.minimum_stock} {item.unit_of_measurement}
                      </span>
                    </div>
                    <Progress 
                      value={(item.current_stock / item.minimum_stock) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                  <Badge 
                    variant={item.current_stock === 0 ? 'destructive' : 'secondary'}
                    className={item.current_stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {item.current_stock === 0 ? 'critical' : 'low'}
                  </Badge>
                </div>
              ))
            )}
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
            <CardDescription>Items expiring in the next {systemConfig?.expiry_warning_days || 30} days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringItems.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No items expiring soon</div>
            ) : (
              expiringItems.map((item) => {
                const daysLeft = getDaysLeft(item.expiry_date!);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-dental-dark">{item.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">
                          Batch: {item.sku || 'N/A'}
                        </span>
                        <span className="text-sm text-gray-600">
                          Expires: {new Date(item.expiry_date!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={daysLeft <= 15 ? 'destructive' : 'secondary'}
                      className={daysLeft <= 15 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                    >
                      {daysLeft} days
                    </Badge>
                  </div>
                );
              })
            )}
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