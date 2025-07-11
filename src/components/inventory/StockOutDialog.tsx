
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
import { logActivity } from "@/lib/activity-logger";

// Define the same custom type for consistency
type InventoryItemWithRelations = Database["public"]["Tables"]["inventory_items"]["Row"] & {
  inventory_categories?: { name: string } | null;
  supplier?: { name: string } | null;
};

interface StockOutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemWithRelations | null;
  onUpdate: () => void;
}

export const StockOutDialog = ({ isOpen, onClose, item, onUpdate }: StockOutDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const quantityIssued = parseInt(formData.get('quantityIssued') as string);
    const issuedTo = formData.get('issuedTo') as string;
    const usageType = formData.get('usageType') as string;
    const notes = formData.get('notes') as string;

    // Validate quantity
    if (quantityIssued > item.current_stock) {
      toast({
        title: "Error",
        description: `Cannot issue ${quantityIssued} items. Only ${item.current_stock} available.`,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // Update inventory stock
      const newStock = item.current_stock - quantityIssued;
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      // Log the activity
      await logActivity(
        'Stock Used',
        item.name,
        issuedTo || 'Staff User',
        item.id,
        `${quantityIssued} ${item.unit_of_measurement}`
      );

      toast({
        title: "Success",
        description: `${quantityIssued} ${item.unit_of_measurement} issued successfully. Remaining: ${newStock}`
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error issuing stock:', error);
      toast({
        title: "Error",
        description: "Failed to issue stock",
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
          <DialogTitle>Stock Out - {item.name}</DialogTitle>
          <DialogDescription>
            Available stock: {item.current_stock} {item.unit_of_measurement}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityIssued">Quantity to Issue *</Label>
              <Input
                name="quantityIssued"
                type="number"
                min="1"
                max={item.current_stock}
                placeholder="Enter quantity"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usageType">Usage Type *</Label>
              <Select name="usageType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select usage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="treatment">Used for Treatment</SelectItem>
                  <SelectItem value="wasted">Wasted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="issuedTo">Issued To / Used By</Label>
              <Input
                name="issuedTo"
                placeholder="Enter staff name or department"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              name="notes"
              placeholder="Add any notes about this stock issue..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Issue Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
