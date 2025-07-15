
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm";
import { PurchaseOrderViewDialog } from "@/components/purchase-orders/PurchaseOrderViewDialog";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Edit,
  Eye,
  Truck,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  User,
  MapPin
} from "lucide-react";

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching data for PurchaseOrders...');
      const [poResponse, suppliersResponse, itemsResponse, categoriesResponse] = await Promise.all([
        supabase.from('purchase_orders').select(`
          *,
          suppliers(name),
          purchase_order_items(*)
        `).order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('inventory_items').select(`
          *,
          suppliers (
            id,
            name
          )
        `).order('name'),
        supabase.from('inventory_categories').select('*').order('name')
      ]);

      // Log responses for debugging
      console.log('Purchase orders response:', poResponse);
      console.log('Suppliers response:', suppliersResponse);
      console.log('Inventory items response:', itemsResponse);
      console.log('Categories response:', categoriesResponse);

      // Check for errors in responses
      if (poResponse.error) throw new Error(`Purchase orders error: ${poResponse.error.message}`);
      if (suppliersResponse.error) throw new Error(`Suppliers error: ${suppliersResponse.error.message}`);
      if (itemsResponse.error) throw new Error(`Inventory items error: ${itemsResponse.error.message}`);
      if (categoriesResponse.error) throw new Error(`Categories error: ${categoriesResponse.error.message}`);

      // Set state with response data
      if (poResponse.data) setPurchaseOrders(poResponse.data);
      if (suppliersResponse.data) setSuppliers(suppliersResponse.data);
      if (itemsResponse.data) {
        console.log('Setting inventory items:', itemsResponse.data);
        setInventoryItems(itemsResponse.data);
      }
      if (categoriesResponse.data) setCategories(categoriesResponse.data);

      console.log('Data loaded successfully:');
      console.log('- Purchase orders:', poResponse.data?.length || 0);
      console.log('- Suppliers:', suppliersResponse.data?.length || 0);
      console.log('- Inventory items:', itemsResponse.data?.length || 0);
      console.log('- Categories:', categoriesResponse.data?.length || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      ordered: { color: "bg-purple-100 text-purple-800", icon: Package },
      received: { color: "bg-green-100 text-green-800", icon: Truck },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const updatePOStatus = async (poId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', poId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Purchase order status updated to ${newStatus}`
      });

      fetchData();
    } catch (error) {
      console.error('Error updating PO status:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase order status",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = purchaseOrders.filter((order: any) => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requested_by?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage purchase orders and procurement workflow</p>
        </div>

        <Button
          className="bg-primary hover:bg-secondary"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by PO number, supplier, or requested by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredOrders.map((order: any) => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-dental-primary" />
                    <h3 className="text-lg font-semibold">{order.po_number}</h3>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      <span>Requested by: {order.requested_by}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Order Date: {new Date(order.order_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Package className="h-4 w-4 mr-2" />
                      <span>Supplier: {order.suppliers?.name}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>Total Amount: LKR {order.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPurchaseOrder(order.id);
                      setIsViewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>

                  {!(order.status === 'ordered' || order.status === 'received') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePOStatus(order.id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}


                  {order.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePOStatus(order.id, 'ordered')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Ordered
                    </Button>
                  )}

                  {order.status === 'ordered' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('Receive Order')}
                      disabled
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Go to StockReceiving
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PurchaseOrderForm
        suppliers={suppliers}
        inventoryItems={inventoryItems}
        categories={categories}
        onSuccess={() => {
          fetchData();
          setIsAddOpen(false);
        }}
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
      />

      <PurchaseOrderViewDialog
        isOpen={isViewOpen}
        onOpenChange={setIsViewOpen}
        purchaseOrderId={selectedPurchaseOrder}
        onSuccess={() => {
          fetchData();
          setIsViewOpen(false);
        }}
      />
    </div>
  );
};

export default PurchaseOrders;
