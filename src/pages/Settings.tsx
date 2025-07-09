
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Archive, 
  Users,
  Database,
  Download,
  Upload,
  Trash,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    lowStock: true,
    expiring: true,
    newOrders: false,
    systemUpdates: true
  });

  const [systemSettings, setSystemSettings] = useState({
    clinicName: "",
    autoReorder: false,
    lowStockThreshold: 10,
    expiryWarningDays: 30,
    currency: "LKR"
  });

  const [parentCategories, setParentCategories] = useState([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [systemConfigId, setSystemConfigId] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemSettings();
    fetchParentCategories();
  }, []);

  const fetchSystemSettings = async () => {
    const { data, error } = await supabase
      .from('system_configuration')
      .select('*')
      .limit(1)
      .single();
    if (!error && data) {
      setSystemSettings({
        clinicName: data.clinic_name,
        autoReorder: data.auto_reorder,
        lowStockThreshold: data.low_stock_threshold,
        expiryWarningDays: data.expiry_warning_days,
        currency: data.currency
      });
      setSystemConfigId(data.id);
    }
  };

  const handleSaveSystemSettings = async () => {
    const upsertData: any = {
      clinic_name: systemSettings.clinicName,
      auto_reorder: systemSettings.autoReorder,
      low_stock_threshold: systemSettings.lowStockThreshold,
      expiry_warning_days: systemSettings.expiryWarningDays,
      currency: systemSettings.currency
    };
    if (systemConfigId) upsertData.id = systemConfigId;
    const { error } = await supabase
      .from('system_configuration')
      .upsert(upsertData);
    if (!error) {
      toast({ title: "Success", description: "System settings saved." });
    } else {
      console.error('Supabase upsert error:', error);
      toast({ title: "Error", description: "Failed to save system settings.", variant: "destructive" });
    }
  };

  const fetchParentCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .is('parent_category_id', null)
        .order('name');

      if (error) throw error;
      setParentCategories(data || []);
    } catch (error) {
      console.error('Error fetching parent categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parent categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddParentCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        const { error } = await supabase
          .from('inventory_categories')
          .insert([{
            name: newCategory.name.trim(),
            description: newCategory.description.trim() || null,
            parent_category_id: null // This ensures it's a parent category
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Parent category added successfully"
        });

        setNewCategory({ name: "", description: "" });
        setIsAddCategoryOpen(false);
        fetchParentCategories(); // Refresh the list
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

      fetchParentCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting parent category:', error);
      toast({
        title: "Error",
        description: "Failed to delete parent category",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your inventory management system</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure general system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name</Label>
                    <Input id="clinicName" value={systemSettings.clinicName} onChange={e => setSystemSettings(prev => ({ ...prev, clinicName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={systemSettings.currency} onValueChange={value => setSystemSettings(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LKR">LKR (₨)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label>Auto-Reorder</Label>
                      <p className="text-sm text-gray-600">Automatically create purchase orders for low stock items</p>
                    </div>
                    <Switch checked={systemSettings.autoReorder} onCheckedChange={checked => setSystemSettings(prev => ({ ...prev, autoReorder: checked }))} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold (%)</Label>
                    <Input id="lowStockThreshold" type="number" value={systemSettings.lowStockThreshold} onChange={e => setSystemSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryWarning">Expiry Warning (Days)</Label>
                    <Input id="expiryWarning" type="number" value={systemSettings.expiryWarningDays} onChange={e => setSystemSettings(prev => ({ ...prev, expiryWarningDays: parseInt(e.target.value) }))} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-dental-primary hover:bg-dental-secondary" onClick={handleSaveSystemSettings}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified when items fall below minimum stock levels</p>
                  </div>
                  <Switch 
                    checked={notifications.lowStock}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, 
                      lowStock: checked 
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Expiring Items</Label>
                    <p className="text-sm text-gray-600">Get notified about items nearing expiration</p>
                  </div>
                  <Switch 
                    checked={notifications.expiring}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, 
                      expiring: checked 
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>New Orders</Label>
                    <p className="text-sm text-gray-600">Get notified when new purchase orders are created</p>
                  </div>
                  <Switch 
                    checked={notifications.newOrders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, 
                      newOrders: checked 
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>System Updates</Label>
                    <p className="text-sm text-gray-600">Get notified about system updates and maintenance</p>
                  </div>
                  <Switch 
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, 
                      systemUpdates: checked 
                    }))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-dental-primary hover:bg-dental-secondary">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Parent Category Management</CardTitle>
                  <CardDescription>Organize your inventory items by categories</CardDescription>
                </div>
                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-dental-primary hover:bg-dental-secondary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                      <DialogDescription>
                        Add a new parent category to organize your inventory items.
                      </DialogDescription>
                    </DialogHeader>
                                         <div className="grid gap-4 py-4">
                       <div className="space-y-2">
                         <Label htmlFor="categoryName">Category Name *</Label>
                         <Input
                           id="categoryName"
                           value={newCategory.name}
                           onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                           placeholder="Enter parent category name"
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="categoryDescription">Description (Optional)</Label>
                         <Textarea
                           id="categoryDescription"
                           value={newCategory.description}
                           onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                           placeholder="Enter category description"
                         />
                       </div>
                     </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddParentCategory}>Add Category</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                  <p>Loading categories...</p>
                ) : parentCategories.length === 0 ? (
                  <p>No parent categories found. Add one to get started!</p>
                ) : (
                  parentCategories.map((category) => (
                    <Card key={category.id} className="card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600"
                              onClick={() => handleDeleteParentCategory(category.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold text-dental-dark mb-1">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description || "No description"}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
