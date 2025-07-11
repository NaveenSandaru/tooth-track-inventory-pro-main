import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, 
  Calendar, 
  FileText, 
  Truck, 
  User, 
  Clipboard, 
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface StockReceivingViewProps {
  receipt: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StockReceivingView = ({ receipt, isOpen, onOpenChange }: StockReceivingViewProps) => {
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

  // Get document status
  const getDocumentStatus = () => {
    const docs = [];
    if (receipt.invoice_uploaded) docs.push('Invoice');
    if (receipt.delivery_note_uploaded) docs.push('Delivery Note');
    if (receipt.qc_report_uploaded) docs.push('QC Report');
    return docs;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-dental-primary">
              Receipt #{receipt.receipt_number}
            </DialogTitle>
            <Badge className="bg-green-100 text-green-800 text-sm">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Received
            </Badge>
          </div>
          <DialogDescription>
            Received on {formatDate(receipt.receipt_date)}
          </DialogDescription>
        </DialogHeader>

        {/* Receipt details section */}
        <div className="space-y-6">
          {/* Main info card */}
          <Card className="border-dental-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-dental-primary" />
                    Supplier Details
                  </h3>
                  <div className="space-y-2 pl-7">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium">{receipt.suppliers?.name || "N/A"}</span>
                    </div>
                    {receipt.purchase_orders && (
                      <div>
                        <span className="text-gray-500">PO Number:</span>
                        <span className="ml-2 font-medium">{receipt.purchase_orders.po_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-dental-primary" />
                    Receipt Information
                  </h3>
                  <div className="space-y-2 pl-7">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2 font-medium">{formatDate(receipt.receipt_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Received By:</span>
                      <span className="ml-2 font-medium">{receipt.received_by || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Items Received:</span>
                      <span className="ml-2 font-medium">{receipt.stock_receipt_items?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-dental-primary" />
              Documentation
            </h3>
            <div className="flex flex-wrap gap-2">
              {getDocumentStatus().length > 0 ? (
                getDocumentStatus().map((doc) => (
                  <Badge key={doc} variant="outline" className="text-sm py-1 px-3 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    {doc} Uploaded
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-sm py-1 px-3">
                  No documents uploaded
                </Badge>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-dental-primary" />
                Received Items
              </h3>
              {getDiscrepancyCount() > 0 && (
                <Badge variant="destructive" className="text-sm py-1">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  {getDiscrepancyCount()} {getDiscrepancyCount() === 1 ? 'Discrepancy' : 'Discrepancies'} Detected
                </Badge>
              )}
            </div>

            <div className="rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Ordered
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Received
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch/Lot
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipt.stock_receipt_items?.map((item: any, index: number) => (
                    <tr key={index} className={item.has_discrepancy ? "bg-red-50" : ""}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.inventory_items?.name || "Unknown Item"}
                        </div>
                        {item.remarks && (
                          <div className="text-xs text-gray-500 mt-1">{item.remarks}</div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {item.quantity_ordered} {item.unit_of_measure}
                      </td>
                      <td className={`px-3 py-4 text-sm font-medium ${item.has_discrepancy ? "text-red-700" : "text-gray-900"}`}>
                        {item.quantity} {item.unit_of_measure}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {item.batch_number && <div>Batch: {item.batch_number}</div>}
                        {item.lot_number && <div>Lot: {item.lot_number}</div>}
                        {!item.batch_number && !item.lot_number && "Not specified"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(item.expiry_date)}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        {item.has_discrepancy ? (
                          <Badge variant="destructive" className="text-xs">Discrepancy</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">OK</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-dental-primary" />
                Notes
              </h3>
              <div className="bg-gray-50 p-4 rounded-md text-sm">
                {receipt.notes}
              </div>
            </div>
          )}

          {/* Footer with close button */}
          <div className="flex justify-end pt-2">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
