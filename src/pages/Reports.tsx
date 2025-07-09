
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
type InventoryCategory = {
  id: string;
  name: string;
};

type InventoryItem = {
  id: string;
  name: string;
  description?: string;
  current_stock: number;
  unit_price: number;
  minimum_stock?: number;
  inventory_categories: InventoryCategory | null; // no longer an array
};


type UsageReport = {
  categoryId: string;
  category: string;
  items: InventoryItem[];
  totalValue: number;
};

const Reports = () => {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [reportType, setReportType] = useState("inventory");
  const [isFetchingStockReports, setIsFetchingStockReports] = useState(false);
  const [isFetchingUsageReports, setIsFetchingUsageReports] = useState(false);
  const [isFetchingPurchaseReports, setIsFetchingPurchaseReports] = useState(false);
  const [stockReports, setStockReports] = useState([{
    id: "",
    name: "",
    description: "",
    current_stock: 0,
    minimum_stock: 0,
    type: "warning"

  }]);
  const [usageReports, setUsageReports] = useState<UsageReport[]>([]);
  const [purchaseReports, setPurchaseReports] = useState<{
    supplier: string;
    status: string;
    totalOrders: number;
    totalAmount: number;
    lastOrder: string;
  }[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalInventoryValue: 0,
    itemsConsumed: 0,
    purchaseOrders: 0,
    alertItems: {
      lowStock: 0,
      expiring: 0,
    },
  });


  const downloadStockReportPDF = () => {
    const doc = new jsPDF();
    const today = new Date();
    const issuedDate = today.toLocaleDateString('en-GB'); // format: DD/MM/YYYY

    doc.text("Inventory Stock Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Issued on: ${issuedDate}`, 14, 22); // placed just below the title

    autoTable(doc, {
      startY: 28, // moved down to make space for the issued date
      head: [["Name", "Description", "Current Stock", "Minimum Stock"]],
      body: stockReports.map((item) => [
        item.name,
        item.description || "-",
        item.current_stock,
        item.minimum_stock,
      ]),
    });

    doc.save("stock_report.pdf");
  };

  const downloadSingleStockReportPDF = (item) => {
    const doc = new jsPDF();
    doc.text("Inventory Item Report", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Issued Date", new Date().toISOString().split("T")[0]],
        ["Name", item.name],
        ["Description", item.description || "-"],
        ["Current Stock", item.current_stock],
        ["Minimum Stock", item.minimum_stock],
        ["Status", item.type.charAt(0).toUpperCase() + item.type.slice(1)],
      ],
    });

    doc.save(`${item.name}_report.pdf`);
  };

  const usagePercentage = (items) => {
    const used = items.reduce((acc, item) => acc + (item.minimum_stock || 0), 0);
    const total = items.reduce((acc, item) => acc + (item.current_stock || 0), 0);
    return total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  };

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

  const fetchStockReports = async () => {
    setIsFetchingStockReports(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, description, current_stock, minimum_stock');

      if (error) {
        console.error('Error fetching stock reports:', error.message);
        return;
      }

      const formattedReports = data.map(item => {
        let type = "info"; // Default if stock is fine

        if (item.current_stock <= 0) {
          type = "critical";
        } else if (item.current_stock < item.minimum_stock) {
          type = "warning";
        }

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          current_stock: item.current_stock,
          minimum_stock: item.minimum_stock,
          type,
        };
      });

      setStockReports(formattedReports);
    } catch (err: any) {
      console.error('Unexpected error:', err.message);
    } finally {
      setIsFetchingStockReports(false);
    }
  };

  const fetchUsageReports = async () => {
    setIsFetchingUsageReports(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
        id,
        name,
        description,
        current_stock,
        unit_price,
        minimum_stock,
        inventory_categories:category_id (
          id,
          name
        )
      `);

      if (error) {
        console.error('Error fetching usage reports:', error.message);
        return;
      }

      type InventoryCategory = {
        id: string;
        name: string;
      };

      type InventoryItem = {
        id: string;
        name: string;
        description?: string;
        current_stock: number;
        unit_price: number;
        minimum_stock?: number;
        inventory_categories: InventoryCategory | null; // fixed
      };

      type UsageReport = {
        categoryId: string;
        category: string;
        items: InventoryItem[];
        totalValue: number;
      };

      const typedData = data as InventoryItem[];
      const categoryMap = new Map<string, UsageReport>();

      typedData.forEach(item => {
        const category = item.inventory_categories;
        if (!category) return;

        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, {
            categoryId: category.id,
            category: category.name,
            items: [],
            totalValue: 0,
          });
        }

        const entry = categoryMap.get(category.id)!;
        const itemValue = (item.current_stock || 0) * parseFloat(item.unit_price?.toString() || "0");
        entry.items.push(item);
        entry.totalValue += itemValue;
      });

      const reports = Array.from(categoryMap.values());
      setUsageReports(reports);
    } catch (err: any) {
      console.error('Unexpected error:', err.message);
    } finally {
      setIsFetchingUsageReports(false);
    }
  };

  const fetchPurchaseReports = async () => {
    setIsFetchingPurchaseReports(true);
    try {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          order_date,
          total_amount,
          status,
          supplier_id,
          suppliers (
            id,
            name,
            status
          )
        `);

      if (error) {
        console.error("Error fetching purchase reports:", error.message);
        return;
      }

      type Supplier = {
        id: string;
        name: string;
        status: string;
      };

      type PurchaseOrder = {
        id: string;
        order_date: string;
        total_amount: number;
        status: string;
        supplier_id: string;
        suppliers: Supplier | null;
      };

      const supplierMap = new Map<string, {
        supplier: string;
        status: string;
        totalOrders: number;
        totalAmount: number;
        lastOrder: string;
      }>();

      (data as PurchaseOrder[]).forEach(order => {
        const supplier = order.suppliers;
        if (!supplier) return;

        const existing = supplierMap.get(supplier.id);

        const orderDate = new Date(order.order_date).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric"
        });

        if (!existing) {
          supplierMap.set(supplier.id, {
            supplier: supplier.name,
            status: supplier.status,
            totalOrders: 1,
            totalAmount: order.total_amount || 0,
            lastOrder: orderDate,
          });
        } else {
          existing.totalOrders += 1;
          existing.totalAmount += order.total_amount || 0;
          const lastDate = new Date(existing.lastOrder);
          if (new Date(order.order_date) > lastDate) {
            existing.lastOrder = orderDate;
          }
        }
      });

      setPurchaseReports(Array.from(supplierMap.values()));
    } catch (err: any) {
      console.error("Unexpected error:", err.message);
    } finally {
      setIsFetchingPurchaseReports(false);
    }
  };

  const fetchQuickStats = async () => {
    try {
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from("inventory_items")
        .select("current_stock, unit_price, expiry_date");

      if (inventoryError) throw inventoryError;

      const now = new Date();
      const expiryThreshold = new Date();
      expiryThreshold.setDate(now.getDate() + 30);

      let totalValue = 0;
      let lowStock = 0;
      let expiring = 0;

      inventoryItems?.forEach((item: any) => {
        const stock = item.current_stock || 0;
        const price = parseFloat(item.unit_price) || 0;
        totalValue += stock * price;

        if (item.minimum_stock && stock < item.minimum_stock) lowStock++;

        if (item.expiry_date && new Date(item.expiry_date) <= expiryThreshold) expiring++;
      });

      const { count: poCount, error: poError } = await supabase
        .from("purchase_orders")
        .select("*", { count: "exact", head: true });
      if (poError) throw poError;

      const itemsConsumed = inventoryItems?.reduce((acc, item: any) => {
        const max = item.maximum_stock || 0;
        const used = max - item.current_stock;
        return used > 0 ? acc + used : acc;
      }, 0);

      setQuickStats({
        totalInventoryValue: totalValue,
        itemsConsumed,
        purchaseOrders: poCount || 0,
        alertItems: {
          lowStock,
          expiring,
        },
      });
    } catch (err: any) {
      console.error("Error fetching quick stats:", err.message);
    }
  };


  useEffect(() => {
    fetchStockReports();
    fetchUsageReports();
    fetchPurchaseReports();
    fetchQuickStats();
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Analyze your inventory performance and trends</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
                <p className="text-2xl font-bold text-dental-dark">Rs. {quickStats.totalInventoryValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Consumed</p>
                <p className="text-2xl font-bold text-dental-dark">{quickStats.itemsConsumed}</p>
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
                <p className="text-2xl font-bold text-dental-dark">{quickStats.purchaseOrders}</p>
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
                <p className="text-2xl font-bold text-dental-dark">
                  {quickStats.alertItems.lowStock + quickStats.alertItems.expiring}
                </p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {quickStats.alertItems.lowStock} low stock, {quickStats.alertItems.expiring} expiring
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
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={downloadStockReportPDF}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
            >
              <Download size={16} />
              <span>Download PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stockReports.map((report) => (
              <Card key={report.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{report.name}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>

                    <div className="flex items-center space-x-2">
                      {getReportBadge(report.type)}

                      {/* Single item download */}
                      <button
                        onClick={() => downloadSingleStockReportPDF(report)}
                        className="hover:text-blue-600"
                        title="Download Item Report"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {report.current_stock && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Items:</span>
                        <span className="font-semibold text-dental-dark">{report.current_stock}</span>
                      </div>
                    )}
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
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Items Used:</span>
                          <span className="font-medium text-dental-dark ml-2">{usage.items.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium text-dental-dark ml-2">Rs. {usage.totalValue.toFixed(2)}</span>
                        </div>
                      </div>
                      <Progress value={usagePercentage(usage.items)} className="mt-3 h-2" />
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
                        <td className="p-4 font-medium">Rs. {purchase.totalAmount.toFixed(2)}</td>
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
      </Tabs>
    </div>
  );
};

export default Reports;
