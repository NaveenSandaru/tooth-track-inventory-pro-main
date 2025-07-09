import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { format } from 'date-fns';

interface PurchaseOrderViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId: string | null;
  onSuccess?: () => void;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  total_amount: number;
  notes: string;
  payment_terms: string;
  shipping_method: string;
  delivery_address: string;
  requested_by: string;
}

interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_code: string;
  item_description: string;
  unit_of_measure: string;
  category: string;
  remarks: string;
}

export const PurchaseOrderViewDialog = ({
  isOpen,
  onOpenChange,
  purchaseOrderId,
  onSuccess
}: PurchaseOrderViewDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      loadPurchaseOrder();
      loadSuppliers();
      loadInventoryItems();
    }
  }, [isOpen, purchaseOrderId]);

  const loadPurchaseOrder = async () => {
    try {
      setIsLoading(true);
      // Load purchase order details
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', purchaseOrderId)
        .single();

      if (poError) throw poError;
      setPurchaseOrder(poData);

      // Load purchase order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData);
    } catch (error) {
      console.error('Error loading purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase order details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    const { data, error } = await supabase.from('suppliers').select('*');
    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }
    setSuppliers(data || []);
  };

  const loadInventoryItems = async () => {
    const { data, error } = await supabase.from('inventory_items').select('*');
    if (error) {
      console.error('Error loading inventory items:', error);
      return;
    }
    setInventoryItems(data || []);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!purchaseOrder) return;

      // Update purchase order
      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({
          supplier_id: purchaseOrder.supplier_id,
          expected_delivery_date: purchaseOrder.expected_delivery_date,
          notes: purchaseOrder.notes,
          payment_terms: purchaseOrder.payment_terms,
          shipping_method: purchaseOrder.shipping_method,
          delivery_address: purchaseOrder.delivery_address,
          requested_by: purchaseOrder.requested_by,
          total_amount: purchaseOrder.total_amount
        })
        .eq('id', purchaseOrder.id);

      if (poError) throw poError;

      // Update order items
      for (const item of orderItems) {
        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .update({
            inventory_item_id: item.inventory_item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit_of_measure: item.unit_of_measure,
            remarks: item.remarks
          })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      toast({
        title: "Success",
        description: "Purchase order updated successfully"
      });

      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadPurchaseOrder(); // Reload original data
  };

  const updatePurchaseOrder = (field: keyof PurchaseOrder, value: any) => {
    if (!purchaseOrder) return;
    setPurchaseOrder({ ...purchaseOrder, [field]: value });
  };

  const updateOrderItem = (itemId: string, field: keyof PurchaseOrderItem, value: any) => {
    setOrderItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updatedItem.total_price = Number(updatedItem.quantity) * Number(updatedItem.unit_price);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  if (!purchaseOrder || isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-4">
            Loading...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Purchase Order Details - {purchaseOrder.po_number}</span>
            <div className="space-x-2 mt-4">
              {!isEditing ? (
                <Button onClick={handleEdit}>Edit</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  <Button onClick={handleSave}>Save</Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Supplier</Label>
              <Select
                value={purchaseOrder.supplier_id}
                onValueChange={(value) => updatePurchaseOrder('supplier_id', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue>
                    {suppliers.find(s => s.id === purchaseOrder.supplier_id)?.name || 'Select supplier'}
                  </SelectValue>
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

            <div>
              <Label>Status</Label>
              <Input value={purchaseOrder.status} disabled />
            </div>

            <div>
              <Label>Order Date</Label>
              <Input 
                type="date" 
                value={purchaseOrder.order_date} 
                disabled 
              />
            </div>

            <div>
              <Label>Expected Delivery Date</Label>
              <Input 
                type="date" 
                value={purchaseOrder.expected_delivery_date || ''} 
                onChange={(e) => updatePurchaseOrder('expected_delivery_date', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label>Payment Terms</Label>
              <Input 
                value={purchaseOrder.payment_terms} 
                onChange={(e) => updatePurchaseOrder('payment_terms', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label>Shipping Method</Label>
              <Input 
                value={purchaseOrder.shipping_method} 
                onChange={(e) => updatePurchaseOrder('shipping_method', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="col-span-2">
              <Label>Delivery Address</Label>
              <Textarea 
                value={purchaseOrder.delivery_address} 
                onChange={(e) => updatePurchaseOrder('delivery_address', e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea 
                value={purchaseOrder.notes || ''} 
                onChange={(e) => updatePurchaseOrder('notes', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="col-span-2">
                    <Label>Item</Label>
                    <Select
                      value={item.inventory_item_id}
                      onValueChange={(value) => updateOrderItem(item.id, 'inventory_item_id', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {inventoryItems.find(i => i.id === item.inventory_item_id)?.name || 'Select item'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantity</Label>
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateOrderItem(item.id, 'quantity', Number(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label>Unit Price</Label>
                    <Input 
                      type="number" 
                      value={item.unit_price} 
                      onChange={(e) => updateOrderItem(item.id, 'unit_price', Number(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="col-span-4">
                    <Label>Remarks</Label>
                    <Textarea 
                      value={item.remarks || ''} 
                      onChange={(e) => updateOrderItem(item.id, 'remarks', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex justify-end">
            <div className="text-lg font-semibold">
              Total Amount: ${purchaseOrder.total_amount.toFixed(2)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 