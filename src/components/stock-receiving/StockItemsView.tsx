import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle,
  CheckCircle,
  Calendar
} from "lucide-react";

interface StockItemsViewProps {
  receipt: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StockItemsView = ({ receipt, isOpen, onOpenChange }: StockItemsViewProps) => {
  if (!receipt) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get count of discrepancies
  const getDiscrepancyCount = () => {
    return receipt.stock_receipt_items?.filter((item: any) => item.has_discrepancy).length || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-dental-primary flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items in Receipt #{receipt.receipt_number}
            </DialogTitle>
            {getDiscrepancyCount() > 0 ? (
              <Badge variant="destructive" className="text-sm py-1">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                {getDiscrepancyCount()} {getDiscrepancyCount() === 1 ? 'Discrepancy' : 'Discrepancies'}
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800 text-sm py-1">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                All Items Match
              </Badge>
            )}
          </div>
          <DialogDescription className="flex items-center justify-between">
            <span>Received on {formatDate(receipt.receipt_date)}</span>
            <span className="font-medium">{receipt.suppliers?.name || "Unknown Supplier"}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Items Table with Highlighting */}
        <div className="mt-4">
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordered
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difference
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch/Lot Info
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipt.stock_receipt_items?.map((item: any, index: number) => {
                  // Calculate difference and determine highlighting
                  const difference = item.quantity - item.quantity_ordered;
                  const isDifferent = item.quantity !== item.quantity_ordered;
                  
                  return (
                    <tr 
                      key={index} 
                      className={isDifferent ? "bg-red-50" : "hover:bg-gray-50"}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.inventory_items?.name || "Unknown Item"}
                        </div>
                        {item.condition !== 'good' && (
                          <Badge 
                            variant={item.condition === 'damaged' ? 'destructive' : 'outline'} 
                            className="mt-1 text-xs"
                          >
                            {item.condition}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-center font-medium text-gray-900">
                        {item.quantity_ordered} {item.unit_of_measure}
                      </td>
                      <td className="px-3 py-4 text-sm text-center font-medium text-gray-900">
                        <span className={isDifferent ? "text-red-700 font-bold" : ""}>
                          {item.quantity} {item.unit_of_measure}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-center">
                        {isDifferent && (
                          <span className={`font-medium ${difference > 0 ? "text-green-700" : "text-red-700"}`}>
                            {difference > 0 ? "+" : ""}{difference}
                          </span>
                        )}
                        {!isDifferent && (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="space-y-1">
                          {item.batch_number && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <span className="text-xs font-medium text-gray-500">Batch:</span>
                              <span>{item.batch_number}</span>
                            </div>
                          )}
                          {item.lot_number && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <span className="text-xs font-medium text-gray-500">Lot:</span>
                              <span>{item.lot_number}</span>
                            </div>
                          )}
                          {item.expiry_date && (
                            <div className="flex items-center gap-1 text-gray-700">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">Expires: {formatDate(item.expiry_date)}</span>
                            </div>
                          )}
                          {item.storage_location && (
                            <div className="text-xs text-gray-500 mt-1">
                              Location: {item.storage_location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-center">
                        {isDifferent ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Discrepancy
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Match
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes related to items if any */}
          {receipt.stock_receipt_items?.some((item: any) => item.remarks) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Item Notes</h3>
              <div className="space-y-2">
                {receipt.stock_receipt_items
                  .filter((item: any) => item.remarks)
                  .map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="font-medium">{item.inventory_items?.name || "Unknown Item"}</div>
                      <div className="text-sm text-gray-700 mt-1">{item.remarks}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Footer with close button */}
          <div className="flex justify-end mt-6">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
