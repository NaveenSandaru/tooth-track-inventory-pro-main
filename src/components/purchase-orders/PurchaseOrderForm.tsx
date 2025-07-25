
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrderFormProps {
  suppliers: any[];
  inventoryItems: any[];
  categories: any[];
  onSuccess: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderItem {
  id: string;
  inventory_item_id: string;
  item_code: string;
  item_description: string;
  category: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  total_price: number;
  remarks: string;
}

export const PurchaseOrderForm = ({ 
  suppliers, 
  inventoryItems, 
  categories,
  onSuccess, 
  isOpen, 
  onOpenChange 
}: PurchaseOrderFormProps) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    requested_by: '',
    expected_delivery_date: '',
    payment_terms: '',
    shipping_method: '',
    delivery_address: '',
    authorized_by: '',
    notes: ''
  });
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{
    id: '1',
    inventory_item_id: '',
    item_code: '',
    item_description: '',
    category: '',
    quantity: 0,
    unit_of_measure: 'units',
    unit_price: 0,
    total_price: 0,
    remarks: ''
  }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  // Validation function
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validate main form
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }
    if (!formData.requested_by) {
      newErrors.requested_by = 'Requested by is required';
    }
    if (!formData.payment_terms) {
      newErrors.payment_terms = 'Payment terms are required';
    }
    if (!formData.shipping_method) {
      newErrors.shipping_method = 'Shipping method is required';
    }
    if (!formData.delivery_address) {
      newErrors.delivery_address = 'Delivery address is required';
    }

    // Validate order items
    orderItems.forEach((item, index) => {
      if (!item.inventory_item_id) {
        newErrors[`item_${index}_inventory`] = 'Inventory item is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[`item_${index}_price`] = 'Unit price must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    return formData.supplier_id && 
           formData.requested_by && 
           formData.payment_terms && 
           formData.shipping_method && 
           formData.delivery_address &&
           orderItems.every(item => 
             item.inventory_item_id && 
             item.quantity > 0 && 
             item.unit_price > 0
           );
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      inventory_item_id: '',
      item_code: '',
      item_description: '',
      category: '',
      quantity: 0,
      unit_of_measure: 'units',
      unit_price: 0,
      total_price: 0,
      remarks: ''
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (id: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const updateOrderItem = (id: string, field: keyof OrderItem, value: any) => {
    console.log(`Updating item ${id}, field ${field} to value:`, value);
    
    setOrderItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate total price
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total_price = Number(updatedItem.quantity || 0) * Number(updatedItem.unit_price || 0);
          }
          
          // Auto-populate from inventory item
          if (field === 'inventory_item_id' && value) {
            console.log('Selected inventory item ID:', value);
            const selectedItem = inventoryItems.find(inv => inv.id === value);
            console.log('Found inventory item:', selectedItem);
            
            if (selectedItem) {
              updatedItem.item_code = selectedItem.sku || '';
              updatedItem.item_description = selectedItem.description || selectedItem.name;
              updatedItem.category = selectedItem.category_id || '';
              updatedItem.unit_of_measure = selectedItem.unit_of_measurement;
              updatedItem.unit_price = Number(selectedItem.unit_price) || 0;
              updatedItem.total_price = Number(updatedItem.quantity || 0) * Number(selectedItem.unit_price || 0);
              
              console.log('Updated item with inventory data:', updatedItem);
            } else {
              console.warn('Selected inventory item not found in inventory items list');
              // Reset fields if item not found
              updatedItem.item_code = '';
              updatedItem.item_description = '';
              updatedItem.unit_price = 0;
              updatedItem.total_price = 0;
            }
          }
          
          // Only clear inventory item when category changes and it's different from the item's category
          if (field === 'category' && value !== item.category) {
            const currentInventoryItem = inventoryItems.find(inv => inv.id === item.inventory_item_id);
            if (currentInventoryItem && currentInventoryItem.category_id !== value) {
              updatedItem.inventory_item_id = '';
              updatedItem.item_code = '';
              updatedItem.item_description = '';
              updatedItem.unit_price = 0;
              updatedItem.total_price = 0;
            }
          }
          
          console.log('Final updated item:', updatedItem);
          return updatedItem;
        }
        return item;
      });
    });
  };

  // Get filtered inventory items based on selected category
  const getFilteredInventoryItems = (categoryId: string) => {
    console.log('Filtering inventory items for category:', categoryId);
    console.log('Available inventory items:', inventoryItems);
    
    if (!categoryId) {
      console.log('No category selected, returning all items');
      return inventoryItems;
    }
    
    const filtered = inventoryItems.filter(item => item.category_id === categoryId);
    console.log('Filtered items:', filtered);
    return filtered;
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const getCategoryDisplayName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return 'Unknown';
    return category.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    console.log('Order items:', orderItems);
    console.log('Suppliers count:', suppliers.length);
    console.log('Inventory items count:', inventoryItems.length);
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Generating PO number...');
      // Get the next PO number
      const { data: poNumberData, error: poNumberError } = await supabase.rpc('generate_po_number');
      if (poNumberError) {
        console.error('PO number generation error:', poNumberError);
        throw poNumberError;
      }
      const poNumber = poNumberData || `PO${Date.now().toString().slice(-6)}`;
      console.log('Generated PO number:', poNumber);

      // Create purchase order
      const poPayload = {
        po_number: poNumber,
        supplier_id: formData.supplier_id,
        requested_by: formData.requested_by,
        expected_delivery_date: formData.expected_delivery_date || null,
        payment_terms: formData.payment_terms,
        shipping_method: formData.shipping_method,
        delivery_address: formData.delivery_address,
        notes: formData.notes || '',
        total_amount: getTotalAmount(),
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0] // Add current date
      };
      
      console.log('Creating purchase order with payload:', poPayload);
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .insert([poPayload])
        .select()
        .single();

      if (poError) {
        console.error('Purchase order creation error:', poError);
        throw new Error(`Failed to create purchase order: ${poError.message}`);
      }
      
      if (!purchaseOrder) {
        throw new Error('Purchase order was not created');
      }
      
      console.log('Purchase order created:', purchaseOrder);

      // Create purchase order items
      const itemsToInsert = orderItems.map(item => ({
        purchase_order_id: purchaseOrder.id,
        inventory_item_id: item.inventory_item_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        unit_of_measure: item.unit_of_measure,
        item_code: item.item_code || null,
        item_description: item.item_description || null,
        category: item.category || null,
        remarks: item.remarks || null
      }));

      console.log('Creating purchase order items:', itemsToInsert);
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Purchase order items creation error:', itemsError);
        // Rollback purchase order if items creation fails
        await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', purchaseOrder.id);
        throw new Error(`Failed to create purchase order items: ${itemsError.message}`);
      }
      
      console.log('Purchase order items created successfully');

      toast({
        title: "Success",
        description: `Purchase order ${poNumber} created successfully`
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        supplier_id: '',
        requested_by: '',
        expected_delivery_date: '',
        payment_terms: '',
        shipping_method: '',
        delivery_address: '',
        notes: ''
      });
      setOrderItems([{
        id: '1',
        inventory_item_id: '',
        item_code: '',
        item_description: '',
        category: '',
        quantity: 0,
        unit_of_measure: 'units',
        unit_price: 0,
        total_price: 0,
        remarks: ''
      }]);
      setErrors({});
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new purchase order
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
              >
                <SelectTrigger className={`w-full ${errors.supplier_id ? "border-red-500" : ""}`}>
                  {formData.supplier_id ? (
                    <span className="font-medium">
                      {suppliers.find(supplier => supplier.id === formData.supplier_id)?.name || "Select supplier"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select supplier</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.supplier_id}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_by">Requested By *</Label>
              <Input
                id="requested_by"
                value={formData.requested_by}
                onChange={(e) => setFormData(prev => ({ ...prev, requested_by: e.target.value }))}
                placeholder="Name of requester"
                className={errors.requested_by ? "border-red-500" : ""}
              />
              {errors.requested_by && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.requested_by}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <Input
                type="date"
                id="expected_delivery_date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms *</Label>
              <Select
                value={formData.payment_terms}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}
              >
                <SelectTrigger className={`w-full ${errors.payment_terms ? "border-red-500" : ""}`}>
                  {formData.payment_terms ? (
                    <span className="font-medium">{formData.payment_terms}</span>
                  ) : (
                    <span className="text-muted-foreground">Select payment terms</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                  <SelectItem value="Net 90">Net 90</SelectItem>
                  <SelectItem value="COD">COD</SelectItem>
                  <SelectItem value="Advance">Advance</SelectItem>
                </SelectContent>
              </Select>
              {errors.payment_terms && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.payment_terms}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_method">Shipping Method *</Label>
              <Select
                value={formData.shipping_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shipping_method: value }))}
              >
                <SelectTrigger className={`w-full ${errors.shipping_method ? "border-red-500" : ""}`}>
                  {formData.shipping_method ? (
                    <span className="font-medium">{formData.shipping_method}</span>
                  ) : (
                    <span className="text-muted-foreground">Select shipping method</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Express">Express</SelectItem>
                  <SelectItem value="Overnight">Overnight</SelectItem>
                  <SelectItem value="Pickup">Pickup</SelectItem>
                </SelectContent>
              </Select>
              {errors.shipping_method && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-3 w-3" />
                  {errors.shipping_method}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorized_by">Authorized By</Label>
              <Input
                id="authorized_by"
                value={formData.authorized_by}
                onChange={(e) => setFormData(prev => ({ ...prev, authorized_by: e.target.value }))}
                placeholder="Manager/Doctor approval"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery_address">Delivery Address *</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
              placeholder="Complete delivery address"
              className={errors.delivery_address ? "border-red-500" : ""}
            />
            {errors.delivery_address && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="h-3 w-3" />
                {errors.delivery_address}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Button type="button" className="bg-emerald-200 hover:bg-emerald-300" onClick={addOrderItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {orderItems.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeOrderItem(item.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Inventory Item *</Label>
                      {/* Removed duplicated select for inventory item */}
                      <Select
                        key={`inventory-select-${item.id}-${item.category}`}
                        defaultValue={item.inventory_item_id}
                        value={item.inventory_item_id}
                        onValueChange={(value) => {
                          console.log("Selected inventory item:", value);
                          updateOrderItem(item.id, 'inventory_item_id', value);
                        }}
                      >
                        <SelectTrigger className={`w-full ${errors[`item_${index}_inventory`] ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select item">
                            {item.inventory_item_id ? (
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {inventoryItems.find(invItem => invItem.id === item.inventory_item_id)?.name || "Select item"}
                                </span>
                                {item.inventory_item_id && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {inventoryItems.find(invItem => invItem.id === item.inventory_item_id)?.sku || ""}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Select item</span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              No inventory items available
                            </div>
                          ) : !item.category ? (
                            // Show all items when no category is selected
                            inventoryItems.map((invItem) => (
                              <SelectItem 
                                key={invItem.id} 
                                value={invItem.id}
                                textValue={invItem.name}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{invItem.name}</span>
                                  {invItem.sku && <span className="text-xs text-gray-500 ml-2">({invItem.sku})</span>}
                                </div>
                              </SelectItem>
                            ))
                          ) : getFilteredInventoryItems(item.category).length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              No items available in this category
                            </div>
                          ) : (
                            getFilteredInventoryItems(item.category).map((invItem) => (
                              <SelectItem 
                                key={invItem.id} 
                                value={invItem.id}
                                textValue={invItem.name}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{invItem.name}</span>
                                  {invItem.sku && <span className="text-xs text-gray-500 ml-2">({invItem.sku})</span>}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors[`item_${index}_inventory`] && (
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertCircle className="h-3 w-3" />
                          {errors[`item_${index}_inventory`]}
                        </div>
                      )}
                      {item.category && (
                        <div className="text-xs text-gray-500">
                          {getFilteredInventoryItems(item.category).length} items available
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Item Code</Label>
                      <Input
                        value={item.item_code}
                        onChange={(e) => updateOrderItem(item.id, 'item_code', e.target.value)}
                        placeholder="Item code"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={item.category || ""}
                        onValueChange={(value) => updateOrderItem(item.id, 'category', value)}
                      >
                        <SelectTrigger className="w-full">
                          {item.category ? (
                            <span className="font-medium">
                              {categories.find(cat => cat.id === item.category)?.name || "Select category"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Select category</span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className={errors[`item_${index}_quantity`] ? "border-red-500" : ""}
                      />
                      {errors[`item_${index}_quantity`] && (
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertCircle className="h-3 w-3" />
                          {errors[`item_${index}_quantity`]}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Unit of Measure</Label>
                      <Select
                        value={item.unit_of_measure || "units"}
                        onValueChange={(value) => updateOrderItem(item.id, 'unit_of_measure', value)}
                      >
                        <SelectTrigger className="w-full">
                          <span className="font-medium">
                            {item.unit_of_measure ? item.unit_of_measure.charAt(0).toUpperCase() + item.unit_of_measure.slice(1) : "Units"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="bottle">Bottle</SelectItem>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className={errors[`item_${index}_price`] ? "border-red-500" : ""}
                      />
                      {errors[`item_${index}_price`] && (
                        <div className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertCircle className="h-3 w-3" />
                          {errors[`item_${index}_price`]}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Total Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.total_price.toFixed(2)}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Item Description</Label>
                    <Input
                      value={item.item_description}
                      onChange={(e) => updateOrderItem(item.id, 'item_description', e.target.value)}
                      placeholder="Detailed item description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      value={item.remarks}
                      onChange={(e) => updateOrderItem(item.id, 'remarks', e.target.value)}
                      placeholder="Special instructions or remarks"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-right">
                Total Amount: ${getTotalAmount().toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Comments</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or comments"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-secondary"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};