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
  const [isAddParentCategoryOpen, setIsAddParentCategoryOpen] = useState(false);
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
  const [currentView, setCurrentView] = useState<'items' | 'categories' | 'parent-categories'>('items');
  const [newParentCategory, setNewParentCategory] = useState({
    name: "",
    description: ""
  });

  const [batches, setBatches] = useState<Database["public"]["Tables"]["inventory_batches"]["Row"][]>([]);

  useEffect(() => {
    fetchData();
    fetchBatches();
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

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_batches')
        .select("*");

      if (error) {
        throw new Error(error.message);
      }

      setBatches(data);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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

  const getItemsInCategory = (categoryId: string) => {
    return inventoryItems.filter(item => item.category_id === categoryId);
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

      if (formData.trackBatches) {

        const alertDays = parseInt(formData.alertExpiryDays) || 30;
        const today = new Date();
        const alertExpiryDate = new Date(today);
        alertExpiryDate.setDate(alertExpiryDate.getDate() + alertDays);

        const response = await supabase
          .from("inventory_batches")
          .select("*", { count: "exact", head: true })
          .eq("inventory_item_id", data[0].id);

        if (response.error) {
          throw new Error(response.error.toString());
        }

        const response2 = await supabase
          .from("inventory_batches")
          .select("*", { count: "exact", head: true })

        if (response2.error) {
          throw new Error(response2.error.toString());
        }

        const batch_number = `${data[0].name.slice(0, 4)}${(response.count + 1)}`;
        const lot_number = ((response2.count) + 1).toString();

        const { error: insertError } = await supabase
          .from("inventory_batches")
          .insert([
            {
              inventory_item_id: data[0].id,
              batch_number: batch_number,
              lot_number: lot_number,
              manufacture_date: formData.manufacturer_date,
              expiry_date: alertExpiryDate.toISOString().split('T')[0],
              quantity_received: parseInt(formData.currentStock),
              quantity_remaining: parseInt(formData.currentStock),
              unit_cost: parseFloat(formData.unitPrice),
              supplier_id: formData.supplierId,
              received_date: new Date().toDateString().split("T")[0],
              created_at: new Date()
            }
          ]);

        if (insertError) {
          console.log(insertError);
          throw new Error("Error adding batch info");
        }
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

  const handleAddParentCategory = async () => {
    if (newParentCategory.name.trim()) {
      try {
        const { error } = await supabase
          .from('inventory_categories')
          .insert([{
            name: newParentCategory.name.trim(),
            description: newParentCategory.description.trim() || null,
            parent_category_id: null // This ensures it's a parent category
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Parent category added successfully"
        });

        setNewParentCategory({ name: "", description: "" });
        setIsAddParentCategoryOpen(false);
        fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error adding parent category:', error);
        toast({
          title: "Error",
          description: "Failed to add parent category",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteParentCategory = async (categoryId: string) => {
    try {
      // First check if this category has any sub-categories
      const { data: subCategories, error: subError } = await supabase
        .from('inventory_categories')
        .select('id')
        .eq('parent_category_id', categoryId);

      if (subError) throw subError;

      if (subCategories && subCategories.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This category has sub-categories. Please delete sub-categories first.",
          variant: "destructive"
        });
        return;
      }

      // Check if any items are using this category
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('category_id', categoryId);

      if (itemsError) throw itemsError;

      if (items && items.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This category has items assigned to it. Please reassign items first.",
          variant: "destructive"
        });
        return;
      }

      // Delete the category
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Parent category deleted successfully"
      });

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting parent category:', error);
      toast({
        title: "Error",
        description: "Failed to delete parent category",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if any items are using this category
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('category_id', categoryId);

      if (itemsError) throw itemsError;

      if (items && items.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This category has items assigned to it. Please reassign items first.",
          variant: "destructive"
        });
        return;
      }

      // Delete the category
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully"
      });

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your inventory items and categories</p>
        </div>
      </div>

      <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="parent-categories">Parent Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Existing items content */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-2 justify-end">
            <Button onClick={() => setIsScannerOpen(true)} className="bg-green-500 hover:bg-green-600">
              <Scan className="h-4 w-4 mr-2" />
              Scan Item
            </Button>
            <Button onClick={() => setIsAddItemOpen(true)} className="bg-emerald-600 hover:bg-emerald-500">
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems
              .filter(item =>
                (filterCategory === "all" || item.category_id === filterCategory) &&
                (searchTerm === "" ||
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.description?.toLowerCase().includes(searchTerm.toLowerCase()))
              )
              .map((item) => (
                <Card key={item.id} className="flex flex-col self-start min-h-[250px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>
                          {item.inventory_categories?.name || "Uncategorized"}
                        </CardDescription>
                      </div>
                      {getStatusBadge(item)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        Stock: {item.current_stock} {item.unit_of_measurement}
                      </p>
                      <p className="text-sm">
                        Min. Stock: {item.minimum_stock} {item.unit_of_measurement}
                      </p>
                      {item.supplier && (
                        <p className="text-sm">Supplier: {item.supplier.name}</p>
                      )}
                    </div>
                  </CardContent>
                  {item.track_batches && <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        Batch Number: {
                          batches.find(b => b.inventory_item_id === item.id)?.batch_number || "N/A"
                        }
                      </p>
                      <p className="text-sm">
                        Expiry Date: {
                          batches.find(b => b.inventory_item_id === item.id)?.expiry_date || "N/A"
                        }
                      </p>
                      <p className="text-sm">
                        Quantity Remaining: {
                          batches.find(b => b.inventory_item_id === item.id)?.quantity_remaining || "N/A"
                        }
                      </p>
                      
                    </div>
                  </CardContent>}

                  <CardContent className="pt-0">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStockOut(item)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-2">
              <CardTitle>Categories</CardTitle>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Button onClick={() => setIsAddCategoryOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.filter(cat => cat.parent_category_id !== null).map((category) => (
                  <Card key={category.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>
                            Parent: {categories.find(c => c.id === category.parent_category_id)?.name || 'None'}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    {category.description && (
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </CardContent>
                    )}
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Items in this category:</h4>
                        <div className="max-h-40 overflow-y-auto">
                          {getItemsInCategory(category.id).length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {getItemsInCategory(category.id).map(item => (
                                <li key={item.id} className="text-sm">
                                  {item.name} ({item.current_stock} {item.unit_of_measurement})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No items in this category</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parent-categories">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pb-2">
              <CardTitle>Parent Categories</CardTitle>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Button onClick={() => setIsAddParentCategoryOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Parent Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.filter(cat => cat.parent_category_id === null).map((category) => (
                  <Card key={category.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>
                            {getSubCategories(category.id).length} sub-categories
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteParentCategory(category.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    {category.description && (
                      <CardContent className="pb-2">
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </CardContent>
                    )}
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Sub-categories:</h4>
                        <div className="max-h-40 overflow-y-auto">
                          {getSubCategories(category.id).length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {getSubCategories(category.id).map(subCategory => {
                                const itemCount = getItemsInCategory(subCategory.id).length;
                                return (
                                  <li key={subCategory.id} className="text-sm">
                                    {subCategory.name} ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">No sub-categories</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Parent Category Dialog */}
      <Dialog open={isAddParentCategoryOpen} onOpenChange={setIsAddParentCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parent Category</DialogTitle>
            <DialogDescription>
              Create a new parent category for organizing inventory items
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddParentCategory(); }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newParentCategory.name}
                  onChange={(e) => setNewParentCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newParentCategory.description}
                  onChange={(e) => setNewParentCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddParentCategoryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-secondary">
                  Add Parent Category
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>Add a new item to your inventory</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            addItem(Object.fromEntries(new FormData(form)));
          }} className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input name="name" required placeholder="Enter item name" />
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
              <Input name="currentStock" type="number" min="0" required placeholder="Enter current stock" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumStock">Minimum Stock *</Label>
              <Input name="minimumStock" type="number" min="0" required placeholder="Enter minimum stock" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measurement</Label>
              <Input name="unit" placeholder="e.g., pieces, boxes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (Rs. )</Label>
              <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="Enter unit price" />
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
              <Input name="location" placeholder="Enter storage location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode/SKU</Label>
              <Input name="barcode" placeholder="Enter barcode or SKU" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertExpiryDays">Expiry Alert Days</Label>
              <Input name="alertExpiryDays" type="number" min="0" placeholder="Default: 30 days" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea name="description" placeholder="Enter item description" />
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

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing inventory items
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            addCategory(Object.fromEntries(new FormData(form)));
          }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input id="name" name="name" required placeholder="Enter category name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Enter category description" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <Select name="parentId" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {getParentCategories().map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
                  Add Category
                </Button>
              </div>
            </div>
          </form>
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
                <Button type="submit" className="bg-primary hover:bg-secondary">
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