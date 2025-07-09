
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Define the same custom type for consistency
type InventoryItemWithRelations = Database["public"]["Tables"]["inventory_items"]["Row"] & {
  inventory_categories?: { name: string } | null;
  supplier?: { name: string } | null;
};

interface StockUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemWithRelations | null;
  suppliers: Database["public"]["Tables"]["suppliers"]["Row"][];
  onUpdate: () => void;
}

export const StockUpdateDialog = ({ isOpen, onClose, item, suppliers, onUpdate }: StockUpdateDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const quantityReceived = parseInt(formData.get('quantityReceived') as string);
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    const supplierId = formData.get('supplierId') as string;
    const batchNumber = formData.get('batchNumber') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const notes = formData.get('notes') as string;

    try {
      // Update inventory stock
      const newStock = item.current_stock + quantityReceived;
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock,
          unit_price: unitPrice || item.unit_price,
          supplier_id: supplierId || item.supplier_id,
          last_restocked: new Date().toISOString().split('T')[0]
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // If batch tracking is enabled, create batch record
      if (item.track_batches && batchNumber) {
        const { error: batchError } = await supabase
          .from('inventory_batches')
          .insert({
            inventory_item_id: item.id,
            batch_number: batchNumber,
            quantity_received: quantityReceived,
            quantity_remaining: quantityReceived,
            unit_cost: unitPrice || item.unit_price,
            supplier_id: supplierId || item.supplier_id,
            expiry_date: expiryDate || null,
            received_date: new Date().toISOString().split('T')[0]
          });

        if (batchError) throw batchError;
      }

      toast({
        title: "Success",
        description: `Stock updated successfully. New quantity: ${newStock}`
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Stock - {item.name}</DialogTitle>
          <DialogDescription>
            Current stock: {item.current_stock} {item.unit_of_measurement}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityReceived">Quantity Received *</Label>
              <Input
                name="quantityReceived"
                type="number"
                min="1"
                placeholder="Enter quantity"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                name="unitPrice"
                type="number"
                step="0.01"
                defaultValue={item.unit_price || ''}
                placeholder="Enter unit price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select name="supplierId" defaultValue={item.supplier_id || ''}>
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

            {item.track_batches && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    name="batchNumber"
                    placeholder="Enter batch number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    name="expiryDate"
                    type="date"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              name="notes"
              placeholder="Add any notes about this stock update..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
