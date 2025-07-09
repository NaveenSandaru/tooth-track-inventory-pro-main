
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Package,
  Edit,
  Trash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Add SupplierForm component for both add and edit
function SupplierForm({ initial, onSubmit, onCancel }: {
  initial?: Partial<Database["public"]["Tables"]["suppliers"]["Row"]>,
  onSubmit: (data: any) => void,
  onCancel: () => void
}) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = {
          name: formData.get('name')?.toString().trim() || '',
          contact_person: formData.get('contact_person')?.toString().trim() || null,
          email: formData.get('email')?.toString().trim() || null,
          phone: formData.get('phone')?.toString().trim() || null,
          address: formData.get('address')?.toString().trim() || null,
          city: formData.get('city')?.toString().trim() || null,
          state: formData.get('state')?.toString().trim() || null,
          postal_code: formData.get('postal_code')?.toString().trim() || null,
          country: formData.get('country')?.toString().trim() || 'USA',
          website: formData.get('website')?.toString().trim() || null,
          notes: formData.get('notes')?.toString().trim() || null,
          status: formData.get('status')?.toString() || 'active',
        };
        if (!data.name || !data.email || !data.status) return;
        onSubmit(data);
      }}
      className="grid grid-cols-2 gap-4 py-4"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input name="name" defaultValue={initial?.name || ''} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_person">Contact Person</Label>
        <Input name="contact_person" defaultValue={initial?.contact_person || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input name="email" type="email" defaultValue={initial?.email || ''} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input name="phone" defaultValue={initial?.phone || ''} />
      </div>
      <div className="col-span-2 space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea name="address" defaultValue={initial?.address || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input name="city" defaultValue={initial?.city || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input name="state" defaultValue={initial?.state || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="postal_code">Postal Code</Label>
        <Input name="postal_code" defaultValue={initial?.postal_code || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input name="country" defaultValue={initial?.country || 'USA'} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input name="website" defaultValue={initial?.website || ''} />
      </div>
      <div className="col-span-2 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea name="notes" defaultValue={initial?.notes || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <select name="status" defaultValue={initial?.status || 'active'} required className="w-full border rounded px-2 py-1">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="col-span-2 flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-dental-primary hover:bg-dental-secondary">
          Save
        </Button>
      </div>
    </form>
  );
}

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Database["public"]["Tables"]["suppliers"]["Row"][]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [selectedSupplier, setSelectedSupplier] = useState<Database["public"]["Tables"]["suppliers"]["Row"] | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) {
      toast({ title: "Error", description: "Failed to fetch suppliers", variant: "destructive" });
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  const addSupplier = async (formData: any) => {
    try {
      const { error } = await supabase.from('suppliers').insert([formData]);
      if (error) throw error;
      toast({ title: "Success", description: "Supplier added successfully" });
      setIsAddSupplierOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add supplier", variant: "destructive" });
    }
  };

  const updateSupplier = async (formData: any) => {
    if (!selectedSupplier) return;
    try {
      const { error } = await supabase.from('suppliers').update(formData).eq('id', selectedSupplier.id);
      if (error) throw error;
      toast({ title: "Success", description: "Supplier updated successfully" });
      setIsEditOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update supplier", variant: "destructive" });
    }
  };

  const deleteSupplier = async (supplier: Database["public"]["Tables"]["suppliers"]["Row"]) => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Supplier deleted successfully" });
      fetchSuppliers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete supplier", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.postal_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Supplier Management</h1>
          <p className="text-gray-600 mt-1">Manage your dental supply vendors and relationships</p>
        </div>
        <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
          <DialogTrigger asChild>
            <Button className="bg-dental-primary hover:bg-dental-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Add New Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>
                Enter the details for the new supplier.
              </DialogDescription>
            </DialogHeader>
            <SupplierForm
              onSubmit={addSupplier}
              onCancel={() => setIsAddSupplierOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search suppliers by name, category, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Supplier Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Suppliers</p>
                <p className="text-xl font-bold text-dental-dark">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-xl font-bold text-dental-dark">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-dental-dark">128</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Rating</p>
                <p className="text-xl font-bold text-dental-dark">4.5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers List */}
      <Tabs defaultValue="cards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cards">Card View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-dental-dark">
                        {supplier.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {supplier.contact_person || "-"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(supplier.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{supplier.email || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{supplier.phone || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900 line-clamp-2">{supplier.address || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-600">City:</span>
                      <span className="text-gray-900">{supplier.city || "-"}</span>
                      <span className="text-gray-600">State:</span>
                      <span className="text-gray-900">{supplier.state || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-600">Postal Code:</span>
                      <span className="text-gray-900">{supplier.postal_code || "-"}</span>
                      <span className="text-gray-600">Country:</span>
                      <span className="text-gray-900">{supplier.country || "-"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-600">Website:</span>
                      <span className="text-gray-900">{supplier.website || "-"}</span>
                    </div>
                    <div className="text-sm text-gray-600">Notes: <span className="text-gray-900">{supplier.notes || "-"}</span></div>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedSupplier(supplier); setIsEditOpen(true); }}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
                      <th className="text-left p-4 font-semibold text-gray-900">Supplier</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Contact</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Email</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Phone</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Address</th>
                      <th className="text-left p-4 font-semibold text-gray-900">City</th>
                      <th className="text-left p-4 font-semibold text-gray-900">State</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Postal Code</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Country</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Website</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-dental-dark">{supplier.name}</td>
                        <td className="p-4">{supplier.contact_person || "-"}</td>
                        <td className="p-4">{supplier.email || "-"}</td>
                        <td className="p-4">{supplier.phone || "-"}</td>
                        <td className="p-4">{supplier.address || "-"}</td>
                        <td className="p-4">{supplier.city || "-"}</td>
                        <td className="p-4">{supplier.state || "-"}</td>
                        <td className="p-4">{supplier.postal_code || "-"}</td>
                        <td className="p-4">{supplier.country || "-"}</td>
                        <td className="p-4">{supplier.website || "-"}</td>
                        <td className="p-4">{getStatusBadge(supplier.status)}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedSupplier(supplier); setIsEditOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
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

      {filteredSuppliers.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? "Try adjusting your search terms"
                : "Get started by adding your first supplier"
              }
            </p>
            {!searchTerm && (
              <Button 
                className="bg-dental-primary hover:bg-dental-secondary"
                onClick={() => setIsAddSupplierOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Supplier
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update the details for this supplier.
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <SupplierForm
              initial={selectedSupplier}
              onSubmit={updateSupplier}
              onCancel={() => { setIsEditOpen(false); setSelectedSupplier(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;
