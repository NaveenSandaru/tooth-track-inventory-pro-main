import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit, 
  Trash, 
  AlertTriangle,
  Calendar,
  Archive,
  Clock,
  Scan,
  Tag,
  Download,
  Eye,
  Minus,
  X
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { StockUpdateDialog } from "@/components/inventory/StockUpdateDialog";
import { StockOutDialog } from "@/components/inventory/StockOutDialog";
import { logActivity } from "@/lib/activity-logger";

// Define custom type for inventory items with joined supplier data
type InventoryItemWithRelations = Database["public"]["Tables"]["inventory_items"]["Row"] & {
  inventory_categories?: { name: string } | null;
  supplier?: { name: string } | null;
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStockUpdateOpen, setIsStockUpdateOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithRelations[]>([]);
  const [categories, setCategories] = useState<Database["public"]["Tables"]["inventory_categories"]["Row"][]>([]);
  const [suppliers, setSuppliers] = useState<Database["public"]["Tables"]["suppliers"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithRelations | null>(null);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
        supabase.from('inventory_items').select(`
          *,
          inventory_categories(name),
          supplier:suppliers(name)
        `).order('name'),
        supabase.from('inventory_categories').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name')
      ]);

      if (itemsResponse.data) {
        // Check for items that are now below minimum stock
        const items = itemsResponse.data as InventoryItemWithRelations[];
        setInventoryItems(items);
        
        // Get the last known stock alerts to avoid duplicates
        const { data: recentAlerts } = await supabase
          .from('activity_log')
          .select('item_id, created_at, action')
          .in('action', ['Stock Alert', 'Item Expired'])
          .order('created_at', { ascending: false });
        
        // Create maps of the most recent alert times for each item by alert type
        const lastAlertTimeMap = new Map();
        const lastExpiredTimeMap = new Map();
        
        if (recentAlerts) {
          recentAlerts.forEach(alert => {
            if (alert.item_id) {
              if (alert.action === 'Stock Alert' && 
                  (!lastAlertTimeMap.has(alert.item_id) || 
                   new Date(alert.created_at) > new Date(lastAlertTimeMap.get(alert.item_id)))) {
                lastAlertTimeMap.set(alert.item_id, alert.created_at);
              }
              
              if (alert.action === 'Item Expired' && 
                  (!lastExpiredTimeMap.has(alert.item_id) || 
                   new Date(alert.created_at) > new Date(lastExpiredTimeMap.get(alert.item_id)))) {
                lastExpiredTimeMap.set(alert.item_id, alert.created_at);
              }
            }
          });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
        
        // Check for items below minimum stock and log alerts if needed
        for (const item of items) {
          // Check for low stock
          if (item.current_stock <= item.minimum_stock) {
            // Only log a new alert if:
            // 1. We've never logged an alert for this item, or
            // 2. The last alert was more than 24 hours ago
            const lastAlertTime = lastAlertTimeMap.get(item.id);
            const shouldLogAlert = !lastAlertTime || 
              (new Date().getTime() - new Date(lastAlertTime).getTime() > 24 * 60 * 60 * 1000);
            
            if (shouldLogAlert) {
              await logActivity(
                'Stock Alert',
                item.name,
                'System',
                item.id,
                `${item.current_stock}/${item.minimum_stock} ${item.unit_of_measurement}`
              );
            }
          }
          
          // Check for expired items
          if (item.expiry_date) {
            const expiryDate = new Date(item.expiry_date);
            expiryDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
            
            if (expiryDate <= today) {
              // Only log a new expiry alert if:
              // 1. We've never logged an expiry for this item, or
              // 2. The last expiry alert was more than 24 hours ago
              const lastExpiredTime = lastExpiredTimeMap.get(item.id);
              const shouldLogExpiry = !lastExpiredTime || 
                (new Date().getTime() - new Date(lastExpiredTime).getTime() > 24 * 60 * 60 * 1000);
              
              if (shouldLogExpiry) {
                await logActivity(
                  'Item Expired',
                  item.name,
                  'System',
                  item.id,
                  `Expired on ${expiryDate.toLocaleDateString()}`
                );
              }
            }
          }
        }
      }
      
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
      if (suppliersResponse.data) setSuppliers(suppliersResponse.data);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (code: string) => {
    setScannedCode(code);
    
    // Check if product exists
    const existingItem = inventoryItems.find(item => 
      item.barcode === code || item.qr_code === code
    );

    if (existingItem) {
      setSelectedItem(existingItem);
      setIsStockUpdateOpen(true);
      toast({
        title: "Product Found",
        description: `${existingItem.name} - Update stock or batch details`
      });
    } else {
      setIsAddItemOpen(true);
      toast({
        title: "New Product",
        description: "Product not found. Add as new item."
      });
    }
  };

  const handleStockOut = (item: InventoryItemWithRelations) => {
    setSelectedItem(item);
    setIsStockOutOpen(true);
  };

  // Get parent categories for the dropdown
  const getParentCategories = () => {
    return categories.filter((category) => category.parent_category_id === null);
  };

  // Get sub-categories for a specific parent
  const getSubCategories = (parentId: string) => {
    return categories.filter((category) => category.parent_category_id === parentId);
  };

  // Get category name with parent info
  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return 'Unknown';
    return category.name;
  };

  const addItem = async (formData: any) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          name: formData.name,
          description: formData.description,
          category_id: formData.categoryId,
          current_stock: parseInt(formData.currentStock),
          minimum_stock: parseInt(formData.minimumStock),
          unit_of_measurement: formData.unit,
          unit_price: parseFloat(formData.unitPrice),
          supplier_id: formData.supplierId,
          barcode: formData.barcode || scannedCode,
          track_batches: formData.trackBatches,
          alert_expiry_days: parseInt(formData.alertExpiryDays) || 30,
          location: formData.location
        }])
        .select();

      if (error) throw error;

      // Log the activity
      if (data && data[0]) {
        await logActivity(
          'New Item Added',
          formData.name,
          'Staff User', // In a real app, you'd get this from the auth context
          data[0].id,
          `Initial stock: ${formData.currentStock} ${formData.unit || 'units'}`
        );
      }

      toast({
        title: "Success",
        description: "Item added successfully"
      });

      setIsAddItemOpen(false);
      setScannedCode("");
      fetchData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive"
      });
    }
  };

  const addCategory = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('inventory_categories')
        .insert([{
          name: formData.name,
          description: formData.description,
          parent_category_id: formData.parentId === "none" ? null : formData.parentId
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category added successfully"
      });

      setIsAddCategoryOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (item: InventoryItemWithRelations) => {
    if (item.current_stock === 0) {
      return <Badge className="status-indicator status-out-of-stock">Out of Stock</Badge>;
    } else if (item.current_stock <= item.minimum_stock) {
      return <Badge className="status-indicator status-low-stock">Low Stock</Badge>;
    } else {
      return <Badge className="status-indicator status-in-stock">In Stock</Badge>;
    }
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleView = (item: InventoryItemWithRelations) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleEdit = (item: InventoryItemWithRelations) => {
    setSelectedItem(item);
    setIsEditOpen(true);
  };

  const handleDelete = (item: InventoryItemWithRelations) => {
    if (!item || !item.id) {
      toast({ 
        title: "Error", 
        description: "Invalid item selected for deletion", 
        variant: "destructive" 
      });
      return;
    }
    
    // Set the selected item and open the confirmation dialog
    setSelectedItem(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) {
      console.error("No item selected for deletion");
      toast({ 
        title: "Error", 
        description: "No item selected for deletion", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      // Store item details before deletion for activity log
      const itemName = selectedItem.name;
      const itemId = selectedItem.id;

      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);
        
      if (error) {
        console.error("Delete error:", error);
        
        // Check for foreign key constraint errors
        if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
          toast({ 
            title: "Cannot Delete", 
            description: "This item is referenced by other records (like purchase orders or stock receipts). Please remove those references first.", 
            variant: "destructive" 
          });
          return;
        }
        
        throw error;
      }

      // Log the activity
      await logActivity(
        'Item Deleted',
        itemName,
        'Staff User', // In a real app, you'd get this from the auth context
        null, // Item ID is now null since it's deleted
        null  // No quantity for deletion
      );

      toast({ title: "Deleted", description: "Item deleted successfully" });
      setIsDeleteConfirmOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete item. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your dental clinic's inventory with barcode scanning</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-4 md:space-x-2">
          <Button 
            variant="default" 
            className="bg-dental-accent hover:bg-dental-accent/80 flex items-center gap-2 px-4" 
            onClick={() => setIsScannerOpen(true)}
          >
            <Scan className="h-4 w-4" />
            <span>Scan Product Barcode</span>
          </Button>
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new inventory category
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                addCategory({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  parentId: formData.get('parentId')
                });
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input name="name" placeholder="e.g., Orthodontics" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Category</Label>
                  <Select name="parentId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Parent (Top-level category)</SelectItem>
                      {getParentCategories().map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" placeholder="Category description..." />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-secondary">
                    Add Category
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Enter the details for the new inventory item
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                addItem({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  categoryId: formData.get('categoryId'),
                  currentStock: formData.get('currentStock'),
                  minimumStock: formData.get('minimumStock'),
                  unit: formData.get('unit'),
                  unitPrice: formData.get('unitPrice'),
                  supplierId: formData.get('supplierId'),
                  barcode: formData.get('barcode'),
                  trackBatches: formData.get('trackBatches') === 'on',
                  alertExpiryDays: formData.get('alertExpiryDays'),
                  location: formData.get('location')
                });
              }} className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input name="name" placeholder="Enter item name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select name="categoryId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {getCategoryDisplayName(category.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Current Stock *</Label>
                  <Input name="currentStock" type="number" placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Minimum Stock *</Label>
                  <Input name="minimumStock" type="number" placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <Input name="unit" placeholder="e.g., boxes, pieces, tubes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (Rs. )</Label>
                  <Input name="unitPrice" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select name="supplierId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Input name="location" placeholder="e.g., Storage Room A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode/QR Code</Label>
                  <Input name="barcode" placeholder="Item barcode or QR code" defaultValue={scannedCode} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alertExpiryDays">Expiry Alert Days</Label>
                  <Input name="alertExpiryDays" type="number" placeholder="30" defaultValue="30" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" placeholder="Optional item description" />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Switch name="trackBatches" />
                  <Label htmlFor="trackBatches">Enable batch tracking for this item</Label>
                </div>
                <div className="col-span-2 flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-secondary">
                    Add Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, description, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {getCategoryDisplayName(category.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-0 m-0">
        <span className="text-lg font-bold">Items :</span>
      </div>

      {/* Inventory Items */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {item.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {item.category_id ? getCategoryDisplayName(item.category_id) : 'Uncategorized'} • {item.supplier?.name || 'No supplier'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(item)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current Stock</p>
                      <p className="font-semibold text-dental-dark">
                        {item.current_stock} {item.unit_of_measurement || 'units'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Min. Stock</p>
                      <p className="font-semibold text-dental-dark">
                        {item.minimum_stock} {item.unit_of_measurement || 'units'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unit Price</p>
                      <p className="font-semibold text-dental-dark">
                        Rs. {item.unit_price || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-semibold text-dental-dark">
                        {item.location || 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  {(item.barcode || item.qr_code) && (
                    <div className="flex items-center space-x-2 text-sm bg-gray-50 p-2 rounded">
                      <Scan className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Code: {item.barcode || item.qr_code}</span>
                    </div>
                  )}

                  {item.track_batches && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Package className="h-4 w-4 text-dental-primary" />
                      <span className="text-dental-primary">Batch tracking enabled</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(item)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700" onClick={() => handleStockOut(item)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(item)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900">Item Name</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Category</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Stock</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Min. Stock</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Unit Price</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Code</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-dental-dark">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-900">{item.category_id ? getCategoryDisplayName(item.category_id) : 'Uncategorized'}</td>
                        <td className="p-4">
                          <span className="font-medium">{item.current_stock}</span> {item.unit_of_measurement || 'units'}
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{item.minimum_stock}</span> {item.unit_of_measurement || 'units'}
                        </td>
                        <td className="p-4 font-medium">Rs. {item.unit_price || '0.00'}</td>
                        <td className="p-4">{getStatusBadge(item)}</td>
                        <td className="p-4 text-gray-900">{item.barcode || item.qr_code || 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleView(item)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => handleStockOut(item)}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(item)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
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

      {filteredItems.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterCategory !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Get started by scanning a product or adding your first inventory item"
              }
            </p>
            {!searchTerm && filterCategory === "all" && (
              <div className="flex justify-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Product
                </Button>
                <Button 
                  className="bg-primary hover:bg-secondary"
                  onClick={() => setIsAddItemOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResult={handleScanResult}
      />

      {/* Stock Update Dialog */}
      {selectedItem && (
        <StockUpdateDialog
          isOpen={isStockUpdateOpen}
          onClose={() => {
            setIsStockUpdateOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          suppliers={suppliers}
          onUpdate={fetchData}
        />
      )}

      {/* Stock Out Dialog */}
      <StockOutDialog
        isOpen={isStockOutOpen}
        onClose={() => {
          setIsStockOutOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onUpdate={fetchData}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div>
              <p><b>Name:</b> {selectedItem.name}</p>
              <p><b>Description:</b> {selectedItem.description}</p>
              <p><b>Category:</b> {selectedItem.category_id ? getCategoryDisplayName(selectedItem.category_id) : 'Uncategorized'}</p>
              <p><b>Stock:</b> {selectedItem.current_stock}</p>
              <p><b>Min. Stock:</b> {selectedItem.minimum_stock}</p>
              <p><b>Unit Price:</b> Rs. {selectedItem.unit_price}</p>
              <p><b>Location:</b> {selectedItem.location}</p>
              <p><b>Barcode:</b> {selectedItem.barcode}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Edit the details for this inventory item.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                try {
                  const { error } = await supabase
                    .from('inventory_items')
                    .update({
                      name: formData.get('name'),
                      description: formData.get('description'),
                      category_id: formData.get('categoryId'),
                      current_stock: parseInt(formData.get('currentStock') as string),
                      minimum_stock: parseInt(formData.get('minimumStock') as string),
                      unit_of_measurement: formData.get('unit'),
                      unit_price: parseFloat(formData.get('unitPrice') as string),
                      supplier_id: formData.get('supplierId'),
                      barcode: formData.get('barcode'),
                      track_batches: formData.get('trackBatches') === 'on',
                      alert_expiry_days: parseInt(formData.get('alertExpiryDays') as string) || 30,
                      location: formData.get('location'),
                    })
                    .eq('id', selectedItem.id);
                  if (error) throw error;

                  await logActivity(
                    'Item Updated',
                    formData.get('name') as string,
                    'Staff User',
                    selectedItem.id,
                    null
                  );

                  toast({ title: "Success", description: "Item updated successfully" });
                  setIsEditOpen(false);
                  setSelectedItem(null);
                  fetchData();
                } catch (error) {
                  toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
                }
              }}
              className="grid grid-cols-2 gap-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input name="name" defaultValue={selectedItem.name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select name="categoryId" defaultValue={selectedItem.category_id || ''} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {getCategoryDisplayName(category.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input name="currentStock" type="number" defaultValue={selectedItem.current_stock || 0} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stock *</Label>
                <Input name="minimumStock" type="number" defaultValue={selectedItem.minimum_stock || 0} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measurement</Label>
                <Input name="unit" defaultValue={selectedItem.unit_of_measurement || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price (Rs. )</Label>
                <Input name="unitPrice" type="number" step="0.01" defaultValue={selectedItem.unit_price || 0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select name="supplierId" defaultValue={selectedItem.supplier_id || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input name="location" defaultValue={selectedItem.location || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode/SKU</Label>
                <Input name="barcode" defaultValue={selectedItem.barcode || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alertExpiryDays">Expiry Alert Days</Label>
                <Input name="alertExpiryDays" type="number" defaultValue={selectedItem.alert_expiry_days || 30} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" defaultValue={selectedItem.description || ''} />
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Switch name="trackBatches" defaultChecked={!!selectedItem.track_batches} />
                <Label htmlFor="trackBatches">Enable batch tracking for this item</Label>
              </div>
              <div className="col-span-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dental-primary hover:bg-dental-secondary">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => {
        if (!open && selectedItem) {
          setIsDeleteConfirmOpen(false);
        } else {
          setIsDeleteConfirmOpen(open);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          {selectedItem ? (
            <>
              <div>Are you sure you want to delete <b>{selectedItem.name}</b>?</div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete} className="bg-emerald-600 hover:bg-emerald-500">Delete</Button>
              </div>
            </>
          ) : (
            <div>No item selected. Please try again.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Inventory;