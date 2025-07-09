
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  Edit, 
  Eye, 
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  Trash2 // <-- add Trash2 icon
} from "lucide-react";

const Equipment = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewEquipmentData, setViewEquipmentData] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEquipmentData, setEditEquipmentData] = useState<any>(null);
  const [isEditMaintenanceOpen, setIsEditMaintenanceOpen] = useState(false);
  const [editMaintenanceData, setEditMaintenanceData] = useState<any>(null);
  const [isDeleteMaintenanceOpen, setIsDeleteMaintenanceOpen] = useState(false);
  const [deleteMaintenanceData, setDeleteMaintenanceData] = useState<any>(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_assets')
        .select(`
          *,
          equipment_maintenance(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: "Error",
        description: "Failed to fetch equipment data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addEquipment = async (formData: any) => {
    try {
      const assetNumber = `AST${Date.now().toString().slice(-6)}`;
      
      const { error } = await supabase
        .from('equipment_assets')
        .insert([{
          asset_number: assetNumber,
          name: formData.name,
          category: formData.category,
          brand: formData.brand,
          model: formData.model,
          serial_number: formData.serialNumber,
          purchase_date: formData.purchaseDate,
          purchase_price: formData.purchasePrice,
          warranty_start_date: formData.warrantyStart,
          warranty_end_date: formData.warrantyEnd,
          location: formData.location,
          notes: formData.notes
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Equipment added successfully"
      });

      setIsAddOpen(false);
      fetchEquipment();
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive"
      });
    }
  };

  const updateEquipment = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('equipment_assets')
        .update(formData)
        .eq('id', editEquipmentData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Equipment updated successfully"
      });

      setIsEditOpen(false);
      setEditEquipmentData(null);
      fetchEquipment();
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive"
      });
    }
  };

  const addMaintenance = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('equipment_maintenance')
        .insert([{
          equipment_id: selectedEquipmentId,
          maintenance_type: formData.maintenanceType,
          description: formData.description,
          maintenance_date: formData.maintenanceDate,
          performed_by: formData.performedBy,
          cost: formData.cost,
          next_maintenance_date: formData.nextMaintenanceDate,
          notes: formData.notes
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Maintenance record added successfully"
      });

      setIsMaintenanceOpen(false);
      setSelectedEquipmentId(null);
      fetchEquipment();
    } catch (error) {
      console.error('Error adding maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to add maintenance record",
        variant: "destructive"
      });
    }
  };

  const updateMaintenance = async (formData: any) => {
    try {
      if (!editMaintenanceData) return;
      const { error } = await supabase
        .from('equipment_maintenance')
        .update({
          maintenance_date: formData.maintenanceDate,
          maintenance_type: formData.maintenanceType,
          description: formData.description,
          performed_by: formData.performedBy,
          cost: formData.cost === '' ? null : Number(formData.cost),
          next_maintenance_date: formData.nextMaintenanceDate,
          notes: formData.notes
        })
        .eq('id', editMaintenanceData.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Maintenance record updated.' });
      setIsEditMaintenanceOpen(false);
      setEditMaintenanceData(null);
      fetchEquipment();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast({ title: 'Error', description: 'Failed to update maintenance record', variant: 'destructive' });
    }
  };
  const deleteMaintenance = async () => {
    try {
      if (!deleteMaintenanceData) return;
      const { error } = await supabase
        .from('equipment_maintenance')
        .delete()
        .eq('id', deleteMaintenanceData.id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Maintenance record deleted.' });
      setIsDeleteMaintenanceOpen(false);
      setDeleteMaintenanceData(null);
      fetchEquipment();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      toast({ title: 'Error', description: 'Failed to delete maintenance record', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      maintenance: { color: "bg-yellow-100 text-yellow-800", icon: Wrench },
      retired: { color: "bg-gray-100 text-gray-800", icon: Archive },
      disposed: { color: "bg-red-100 text-red-800", icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const isWarrantyExpiring = (warrantyEndDate: string | null) => {
    if (!warrantyEndDate) return false;
    const today = new Date();
    const endDate = new Date(warrantyEndDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const filteredEquipment = equipment.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.asset_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Equipment & Assets</h1>
          <p className="text-gray-600 mt-1">Track dental equipment, maintenance, and warranties</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-dental-primary hover:bg-dental-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>
                Register new dental equipment or asset
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              addEquipment({
                name: formData.get('name'),
                category: formData.get('category'),
                brand: formData.get('brand'),
                model: formData.get('model'),
                serialNumber: formData.get('serialNumber'),
                purchaseDate: formData.get('purchaseDate'),
                purchasePrice: formData.get('purchasePrice'),
                warrantyStart: formData.get('warrantyStart'),
                warrantyEnd: formData.get('warrantyEnd'),
                location: formData.get('location'),
                notes: formData.get('notes')
              });
            }} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Equipment Name *</Label>
                <Input name="name" placeholder="e.g., Digital X-Ray Machine" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Imaging">Imaging Equipment</SelectItem>
                    <SelectItem value="Dental Chair">Dental Chairs</SelectItem>
                    <SelectItem value="Sterilization">Sterilization</SelectItem>
                    <SelectItem value="Laboratory">Laboratory Equipment</SelectItem>
                    <SelectItem value="Computer">Computer/Software</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input name="brand" placeholder="Equipment brand" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input name="model" placeholder="Model number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input name="serialNumber" placeholder="Serial number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input name="purchaseDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input name="purchasePrice" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input name="location" placeholder="e.g., Room 101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyStart">Warranty Start</Label>
                <Input name="warrantyStart" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyEnd">Warranty End</Label>
                <Input name="warrantyEnd" type="date" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea name="notes" placeholder="Additional notes..." />
              </div>
              <div className="col-span-2 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-dental-primary hover:bg-dental-secondary">
                  Add Equipment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, brand, or asset number..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map((item: any) => (
          <Card key={item.id} className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {item.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {item.asset_number} • {item.category}
                  </CardDescription>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                {item.brand && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Brand:</span>
                    <span className="font-medium">{item.brand}</span>
                  </div>
                )}
                {item.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{item.model}</span>
                  </div>
                )}
                {item.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{item.location}</span>
                  </div>
                )}
                {item.purchase_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Value:</span>
                    <span className="font-medium">${item.purchase_price}</span>
                  </div>
                )}
              </div>

              {item.warranty_end_date && (
                <div className={`p-2 rounded text-xs ${
                  isWarrantyExpiring(item.warranty_end_date) 
                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' 
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  <div className="flex items-center">
                    {isWarrantyExpiring(item.warranty_end_date) && <AlertTriangle className="h-3 w-3 mr-1" />}
                    Warranty expires: {new Date(item.warranty_end_date).toLocaleDateString()}
                  </div>
                </div>
              )}

              {(() => {
                const maint = item.equipment_maintenance || [];
                if (!maint.length) return null;
                const last = maint.reduce((a, b) => a.maintenance_date > b.maintenance_date ? a : b);
                const next = maint.filter(m => m.next_maintenance_date).sort((a, b) => a.next_maintenance_date.localeCompare(b.next_maintenance_date))[0];
                return (
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Last Maintenance: <span className="font-medium">{last.maintenance_date}</span></div>
                    {next && <div>Next Scheduled: <span className="font-medium">{next.next_maintenance_date}</span></div>}
                    <div>Total Records: <span className="font-medium">{maint.length}</span></div>
                  </div>
                );
              })()}

              <div className="flex items-center space-x-1 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  setViewEquipmentData(item);
                  setIsViewOpen(true);
                }}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                  setEditEquipmentData(item);
                  setIsEditOpen(true);
                }}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedEquipmentId(item.id);
                    setIsMaintenanceOpen(true);
                  }}
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  Maintain
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Maintenance Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            <DialogDescription>
              Record maintenance activity for this equipment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            addMaintenance({
              maintenanceType: formData.get('maintenanceType'),
              description: formData.get('description'),
              maintenanceDate: formData.get('maintenanceDate'),
              performedBy: formData.get('performedBy'),
              cost: formData.get('cost'),
              nextMaintenanceDate: formData.get('nextMaintenanceDate'),
              notes: formData.get('notes')
            });
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceType">Maintenance Type *</Label>
                <Select name="maintenanceType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">Maintenance Date *</Label>
                <Input name="maintenanceDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea name="description" placeholder="Describe the maintenance work performed..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performedBy">Performed By</Label>
                <Input name="performedBy" placeholder="Technician name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input name="cost" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextMaintenanceDate">Next Maintenance Date</Label>
              <Input name="nextMaintenanceDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea name="notes" placeholder="Additional maintenance notes..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsMaintenanceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-dental-primary hover:bg-dental-secondary">
                Add Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Equipment Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipment Details</DialogTitle>
            <DialogDescription>
              View all details for this equipment or asset
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.name || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.category || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.brand || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.model || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.serial_number || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.purchase_date || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Purchase Price</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.purchase_price ? `$${viewEquipmentData.purchase_price}` : '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.location || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Warranty Start</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.warranty_start_date || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Warranty End</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.warranty_end_date || '-'}</div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="p-2 bg-gray-50 rounded">{viewEquipmentData?.status || '-'}</div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <div className="p-2 bg-gray-50 rounded min-h-[40px]">{viewEquipmentData?.notes || '-'}</div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Maintenance History</h3>
            {Array.isArray(viewEquipmentData?.equipment_maintenance) && viewEquipmentData.equipment_maintenance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 border">Date</th>
                      <th className="px-2 py-1 border">Type</th>
                      <th className="px-2 py-1 border">Description</th>
                      <th className="px-2 py-1 border">Performed By</th>
                      <th className="px-2 py-1 border">Cost</th>
                      <th className="px-2 py-1 border">Next</th>
                      <th className="px-2 py-1 border">Notes</th>
                      <th className="px-2 py-1 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewEquipmentData.equipment_maintenance.map((m: any) => (
                      <tr key={m.id} className="border-b">
                        <td className="px-2 py-1 border">{m.maintenance_date}</td>
                        <td className="px-2 py-1 border">{m.maintenance_type}</td>
                        <td className="px-2 py-1 border max-w-[120px] truncate">{m.description}</td>
                        <td className="px-2 py-1 border">{m.performed_by}</td>
                        <td className="px-2 py-1 border">{m.cost ? `$${m.cost}` : '-'}</td>
                        <td className="px-2 py-1 border">{m.next_maintenance_date || '-'}</td>
                        <td className="px-2 py-1 border max-w-[120px] truncate">{m.notes}</td>
                        <td className="px-2 py-1 border">
                          <Button size="icon" variant="ghost" onClick={() => { setEditMaintenanceData(m); setIsEditMaintenanceOpen(true); }} title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="ml-1" onClick={() => { setDeleteMaintenanceData(m); setIsDeleteMaintenanceOpen(true); }} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500">No maintenance records found.</div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update equipment or asset details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={e => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            updateEquipment({
              name: formData.get('name'),
              category: formData.get('category'),
              brand: formData.get('brand'),
              model: formData.get('model'),
              serialNumber: formData.get('serialNumber'),
              purchaseDate: formData.get('purchaseDate'),
              purchasePrice: formData.get('purchasePrice'),
              warrantyStart: formData.get('warrantyStart'),
              warrantyEnd: formData.get('warrantyEnd'),
              location: formData.get('location'),
              notes: formData.get('notes'),
              status: formData.get('status'),
            });
          }} className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input name="name" defaultValue={editEquipmentData?.name || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue={editEquipmentData?.category || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Imaging">Imaging Equipment</SelectItem>
                  <SelectItem value="Dental Chair">Dental Chairs</SelectItem>
                  <SelectItem value="Sterilization">Sterilization</SelectItem>
                  <SelectItem value="Laboratory">Laboratory Equipment</SelectItem>
                  <SelectItem value="Computer">Computer/Software</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input name="brand" defaultValue={editEquipmentData?.brand || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input name="model" defaultValue={editEquipmentData?.model || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input name="serialNumber" defaultValue={editEquipmentData?.serial_number || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input name="purchaseDate" type="date" defaultValue={editEquipmentData?.purchase_date || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input name="purchasePrice" type="number" step="0.01" defaultValue={editEquipmentData?.purchase_price || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input name="location" defaultValue={editEquipmentData?.location || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyStart">Warranty Start</Label>
              <Input name="warrantyStart" type="date" defaultValue={editEquipmentData?.warranty_start_date || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyEnd">Warranty End</Label>
              <Input name="warrantyEnd" type="date" defaultValue={editEquipmentData?.warranty_end_date || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={editEquipmentData?.status || 'active'} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea name="notes" defaultValue={editEquipmentData?.notes || ''} />
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
        </DialogContent>
      </Dialog>

      {/* Add Edit Maintenance Dialog (UI only) */}
      <Dialog open={isEditMaintenanceOpen} onOpenChange={setIsEditMaintenanceOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
          </DialogHeader>
          {/* Form fields for editing maintenance (pre-filled with editMaintenanceData) */}
          <form className="space-y-2" onSubmit={e => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            updateMaintenance({
              maintenanceDate: formData.get('maintenanceDate'),
              maintenanceType: formData.get('maintenanceType'),
              description: formData.get('description'),
              performedBy: formData.get('performedBy'),
              cost: formData.get('cost'),
              nextMaintenanceDate: formData.get('nextMaintenanceDate'),
              notes: formData.get('notes'),
            });
          }}>
            <Input name="maintenanceDate" type="date" defaultValue={editMaintenanceData?.maintenance_date || ''} />
            <Input name="maintenanceType" defaultValue={editMaintenanceData?.maintenance_type || ''} />
            <Textarea name="description" defaultValue={editMaintenanceData?.description || ''} />
            <Input name="performedBy" defaultValue={editMaintenanceData?.performed_by || ''} />
            <Input name="cost" type="number" step="0.01" defaultValue={editMaintenanceData?.cost || ''} />
            <Input name="nextMaintenanceDate" type="date" defaultValue={editMaintenanceData?.next_maintenance_date || ''} />
            <Textarea name="notes" defaultValue={editMaintenanceData?.notes || ''} />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditMaintenanceOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-dental-primary">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Delete Maintenance Confirmation Dialog (UI only) */}
      <Dialog open={isDeleteMaintenanceOpen} onOpenChange={setIsDeleteMaintenanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Maintenance Record</DialogTitle>
            <DialogDescription>Are you sure you want to delete this maintenance record?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteMaintenanceOpen(false)}>Cancel</Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteMaintenance}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredEquipment.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Get started by adding your first equipment"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button 
                className="bg-dental-primary hover:bg-dental-secondary"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Equipment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Equipment;
