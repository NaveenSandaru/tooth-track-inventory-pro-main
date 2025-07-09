
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm";
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
        supabase.from('inventory_items').select('*').order('name'),
        supabase.from('inventory_categories').select('*').order('name')
      ]);

      console.log('Purchase orders response:', poResponse);
      console.log('Suppliers response:', suppliersResponse);
      console.log('Inventory items response:', itemsResponse);
      console.log('Categories response:', categoriesResponse);

      if (poResponse.data) setPurchaseOrders(poResponse.data);
      if (suppliersResponse.data) setSuppliers(suppliersResponse.data);
      if (itemsResponse.data) setInventoryItems(itemsResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);

      console.log('Data loaded successfully:');
      console.log('- Purchase orders:', poResponse.data?.length || 0);
      console.log('- Suppliers:', suppliersResponse.data?.length || 0);
      console.log('- Inventory items:', itemsResponse.data?.length || 0);
      console.log('- Categories:', categoriesResponse.data?.length || 0);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
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
          className="bg-dental-primary hover:bg-dental-secondary"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order: any) => (
          <Card key={order.id} className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">
                    {order.po_number}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {order.suppliers?.name || 'No supplier'} • {new Date(order.order_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date(order.order_date).toLocaleDateString()}</span>
                </div>
                {order.requested_by && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Requested By:
                    </span>
                    <span className="font-medium">{order.requested_by}</span>
                  </div>
                )}
                {order.expected_delivery_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expected:
                    </span>
                    <span className="font-medium">{new Date(order.expected_delivery_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Total Amount:
                  </span>
                  <span className="font-medium">${order.total_amount || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Items:
                  </span>
                  <span className="font-medium">{order.purchase_order_items?.length || 0}</span>
                </div>
                {order.payment_terms && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Terms:</span>
                    <span className="font-medium text-xs">{order.payment_terms}</span>
                  </div>
                )}
                {order.delivery_address && (
                  <div className="flex items-start justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Delivery:
                    </span>
                    <span className="font-medium text-xs text-right max-w-[120px]">{order.delivery_address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center space-x-2">
                {order.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updatePOStatus(order.id, 'approved')}
                      className="flex-1 text-blue-600 border-blue-200"
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updatePOStatus(order.id, 'cancelled')}
                      className="flex-1 text-red-600 border-red-200"
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.status === 'approved' && (
                  <Button 
                    size="sm" 
                    onClick={() => updatePOStatus(order.id, 'ordered')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Mark as Ordered
                  </Button>
                )}
                {order.status === 'ordered' && (
                  <Button 
                    size="sm" 
                    onClick={() => updatePOStatus(order.id, 'received')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Mark as Received
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Get started by creating your first purchase order"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button 
                className="bg-dental-primary hover:bg-dental-secondary"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Purchase Order
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PurchaseOrderForm
        suppliers={suppliers}
        inventoryItems={inventoryItems}
        categories={categories}
        onSuccess={fetchData}
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
      />
    </div>
  );
};

export default PurchaseOrders;
