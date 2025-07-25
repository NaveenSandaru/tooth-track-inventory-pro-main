import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StockReceivingForm } from "@/components/stock-receiving/StockReceivingForm";
import { StockReceivingView } from "@/components/stock-receiving/StockReceivingView";
import { StockItemsView } from "@/components/stock-receiving/StockItemsView";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Package, 
  FileCheck, 
  Eye, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  Calendar,
  FileText,
  User,
  Upload,
  Truck
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

const StockReceiving = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [stockReceipts, setStockReceipts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Database["public"]["Tables"]["inventory_batches"]["Row"][]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchBatches();
  }, []);

  const fetchData = async () => {
    try {
      const [receiptsResponse, poResponse, suppliersResponse] = await Promise.all([
        supabase.from('stock_receipts').select(`
          *,
          suppliers(name),
          purchase_orders(po_number),
          stock_receipt_items(*, inventory_items(id, name))
        `).order('created_at', { ascending: false }),
        supabase.from('purchase_orders').select('*').neq('status', 'received').order('po_number'),
        supabase.from('suppliers').select('*').order('name')
      ]);

      if (receiptsResponse.data) setStockReceipts(receiptsResponse.data);
      if (poResponse.data) setPurchaseOrders(poResponse.data);
      if (suppliersResponse.data) setSuppliers(suppliersResponse.data);
    } catch (error) {
      console.error('Error fetching stock receipts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock receipts",
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

  const getDiscrepancyCount = (receipt: any) => {
    return receipt.stock_receipt_items?.filter((item: any) => item.has_discrepancy).length || 0;
  };

  const getDocumentStatus = (receipt: any) => {
    const docs = [];
    if (receipt.invoice_uploaded) docs.push('Invoice');
    if (receipt.delivery_note_uploaded) docs.push('Delivery Note');
    if (receipt.qc_report_uploaded) docs.push('QC Report');
    return docs;
  };

  const filteredReceipts = stockReceipts.filter((receipt: any) => {
    const matchesSearch = receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.purchase_orders?.po_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Handler for viewing a receipt
  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setIsViewOpen(true);
  };

  // Handler for editing a receipt
  const handleEditReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setIsEditOpen(true);
  };
  
  // Handler for viewing receipt items
  const handleViewItems = (receipt) => {
    setSelectedReceipt(receipt);
    setIsItemsOpen(true);
  };
  
  // Handler for deleting a receipt
  const handleDeleteReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setIsDeleteDialogOpen(true);
  };
  
  // Function to execute the deletion
  const executeDelete = async () => {
    if (!selectedReceipt) return;
    
    try {
      setLoading(true);
      
      // First delete all stock receipt items
      const { error: itemsError } = await supabase
        .from('stock_receipt_items')
        .delete()
        .eq('stock_receipt_id', selectedReceipt.id);
      
      if (itemsError) throw itemsError;
      
      // Then delete the stock receipt itself
      const { error: receiptError } = await supabase
        .from('stock_receipts')
        .delete()
        .eq('id', selectedReceipt.id);
      
      if (receiptError) throw receiptError;
      
      // Show success message
      toast({
        title: "Success",
        description: `Stock receipt ${selectedReceipt.receipt_number} has been deleted.`,
        variant: "default"
      });
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error deleting stock receipt:', error);
      toast({
        title: "Error",
        description: "Failed to delete stock receipt.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedReceipt(null);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-dental-dark">Stock Receiving</h1>
          <p className="text-gray-600 mt-1">Receive inventory items with batch tracking and discrepancy management</p>
        </div>
        
        <Button 
          className="bg-primary hover:bg-secondary"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Receive Stock
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by receipt number, supplier, or PO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReceipts.map((receipt: any) => (
          <Card key={receipt.id} className="card-hover">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold">
                    {receipt.receipt_number}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {receipt.suppliers?.name || 'No supplier'} • {new Date(receipt.receipt_date).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Received
                  </Badge>
                  {getDiscrepancyCount(receipt) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-2 w-2 mr-1" />
                      {getDiscrepancyCount(receipt)} Issues
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Receipt Date:
                  </span>
                  <span className="font-medium">{new Date(receipt.receipt_date).toLocaleDateString()}</span>
                </div>
                {receipt.purchase_orders && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      PO Number:
                    </span>
                    <span className="font-medium">{receipt.purchase_orders.po_number}</span>
                  </div>
                )}
                {receipt.received_by && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Received By:
                    </span>
                    <span className="font-medium text-xs">{receipt.received_by}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Items Received:
                  </span>
                  <span className="font-medium">{receipt.stock_receipt_items?.length || 0}</span>
                </div>
              </div>

              {/* Document Status */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-600">Documentation:</span>
                <div className="flex flex-wrap gap-1">
                  {getDocumentStatus(receipt).length > 0 ? (
                    getDocumentStatus(receipt).map((doc) => (
                      <Badge key={doc} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Upload className="h-2 w-2 mr-1" />
                        {doc}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      No documents uploaded
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewReceipt(receipt)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditReceipt(receipt)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewItems(receipt)}
                >
                  <Package className="h-4 w-4 mr-1" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReceipt(receipt);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                </Button>
              </div>

              {receipt.notes && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Notes:</strong> {receipt.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReceipts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock receipts found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? "Try adjusting your search terms"
                : "Get started by receiving your first stock delivery"
              }
            </p>
            {!searchTerm && (
              <Button 
                className="bg-primary hover:bg-secondary"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Receive First Stock
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Form for creating new stock receipts */}
      <StockReceivingForm
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        onSuccess={fetchData}
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
      />
      
      {/* View modal for stock receipts */}
      <StockReceivingView
        receipt={selectedReceipt}
        isOpen={isViewOpen}
        onOpenChange={setIsViewOpen}
      />
      
      {/* Form for editing existing stock receipts */}
      <StockReceivingForm
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        onSuccess={fetchData}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        initialData={selectedReceipt}
      />
      
      {/* Items view for stock receipts */}
      <StockItemsView
        receipt={selectedReceipt}
        isOpen={isItemsOpen}
        onOpenChange={setIsItemsOpen}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Stock Receipt
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-3">
              {selectedReceipt && (
                <>
                  <p className="mb-4">Are you sure you want to delete this stock receipt?</p>
                  <div className="bg-gray-50 p-3 rounded-md mb-4 border-l-4 border-red-400">
                    <p className="font-medium">{selectedReceipt.receipt_number}</p>
                    <p className="text-sm text-gray-600">
                      Supplier: {selectedReceipt.suppliers?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(selectedReceipt.receipt_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-red-500 text-sm">
                    This will permanently delete the receipt and all its items.
                    This action cannot be undone.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={executeDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Receipt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockReceiving;
