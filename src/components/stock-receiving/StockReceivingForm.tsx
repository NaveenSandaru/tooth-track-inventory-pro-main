
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, AlertTriangle, XCircle, AlertCircle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StockReceivingFormProps {
  suppliers: any[];
  purchaseOrders: any[];
  onSuccess: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any; // For editing or viewing existing records
  readOnly?: boolean; // For view-only mode
}

interface ReceivingItem {
  id: string;
  inventory_item_id: string;
  item_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_of_measure: string;
  batch_number: string;
  lot_number: string;
  manufacture_date: string;
  expiry_date: string;
  condition: 'good' | 'damaged' | 'expired';
  storage_location: string;
  remarks: string;
  has_discrepancy: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export const StockReceivingForm = ({ 
  suppliers, 
  purchaseOrders, 
  onSuccess, 
  isOpen, 
  onOpenChange,
  initialData = null,
  readOnly = false
}: StockReceivingFormProps) => {
  const [formData, setFormData] = useState({
    purchase_order_id: '',
    supplier_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    received_by: '',
    notes: ''
  });
  
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{
    invoice: UploadedFile | null;
    deliveryNote: UploadedFile | null;
    qcReport: UploadedFile | null;
  }>({
    invoice: null,
    deliveryNote: null,
    qcReport: null
  });
  const { toast } = useToast();

  // Initialize form with initialData if provided (for editing or viewing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        purchase_order_id: initialData.purchase_order_id || '',
        supplier_id: initialData.supplier_id || '',
        receipt_date: initialData.receipt_date || new Date().toISOString().split('T')[0],
        received_by: initialData.received_by || '',
        notes: initialData.notes || ''
      });
      
      // Load receipt items
      const loadReceiptItems = async () => {
        try {
          const { data: itemsData, error } = await supabase
            .from('stock_receipt_items')
            .select(`
              *,
              inventory_items(name)
            `)
            .eq('stock_receipt_id', initialData.id);
          
          if (error) throw error;
          
          if (itemsData && itemsData.length > 0) {
            const items: ReceivingItem[] = itemsData.map((item: any, index: number) => ({
              id: `${index + 1}`,
              inventory_item_id: item.inventory_item_id || '',
              item_name: item.inventory_items?.name || 'Unknown Item',
              quantity_ordered: item.quantity_ordered,
              quantity_received: item.quantity,
              unit_of_measure: item.unit_of_measure || 'units',
              batch_number: item.batch_number || '',
              lot_number: item.lot_number || '',
              manufacture_date: item.manufacture_date || '',
              expiry_date: item.expiry_date || '',
              condition: item.condition || 'good',
              storage_location: item.storage_location || '',
              remarks: item.remarks || '',
              has_discrepancy: item.has_discrepancy || false
            }));
            
            setReceivingItems(items);
          }
          
          // Set uploaded file indicators
          if (initialData.invoice_uploaded || initialData.delivery_note_uploaded || initialData.qc_report_uploaded) {
            setUploadedFiles({
              invoice: initialData.invoice_uploaded ? { name: 'Invoice', size: 0, type: '', file: null as any } : null,
              deliveryNote: initialData.delivery_note_uploaded ? { name: 'Delivery Note', size: 0, type: '', file: null as any } : null,
              qcReport: initialData.qc_report_uploaded ? { name: 'QC Report', size: 0, type: '', file: null as any } : null
            });
          }
        } catch (error) {
          console.error('Error loading receipt items:', error);
          toast({
            title: "Error",
            description: "Failed to load receipt items",
            variant: "destructive"
          });
        }
      };
      
      loadReceiptItems();
    }
  }, [initialData]);

  // Load PO items when PO is selected
  useEffect(() => {
    const loadPOItems = async () => {
      if (formData.purchase_order_id) {
        try {
          const { data: poData } = await supabase
            .from('purchase_orders')
            .select(`
              *,
              purchase_order_items(
                *,
                inventory_items(name)
              )
            `)
            .eq('id', formData.purchase_order_id)
            .single();

          if (poData) {
            setSelectedPO(poData);
            setFormData(prev => ({ ...prev, supplier_id: poData.supplier_id }));
            
            const items: ReceivingItem[] = poData.purchase_order_items.map((item: any, index: number) => ({
              id: `${index + 1}`,
              inventory_item_id: item.inventory_item_id || '',
              item_name: item.inventory_items?.name || item.item_description || 'Unknown Item',
              quantity_ordered: item.quantity,
              quantity_received: item.quantity, // Default to ordered quantity
              unit_of_measure: item.unit_of_measure || 'units',
              batch_number: '',
              lot_number: '',
              manufacture_date: '',
              expiry_date: '',
              condition: 'good',
              storage_location: '',
              remarks: '',
              has_discrepancy: false
            }));
            
            setReceivingItems(items);
          }
        } catch (error) {
          console.error('Error loading PO items:', error);
        }
      } else {
        setReceivingItems([]);
        setSelectedPO(null);
      }
    };

    loadPOItems();
  }, [formData.purchase_order_id]);

  const updateReceivingItem = (id: string, field: keyof ReceivingItem, value: any) => {
    setReceivingItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-detect discrepancy
        if (field === 'quantity_received') {
          updatedItem.has_discrepancy = value !== item.quantity_ordered;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const getDiscrepancyCount = () => {
    return receivingItems.filter(item => item.has_discrepancy).length;
  };

  // File upload functionality is disabled
  const handleFileUpload = (fileType: 'invoice' | 'deliveryNote' | 'qcReport', file: File) => {
    // Functionality disabled
    toast({
      title: "File Upload Disabled",
      description: "File upload functionality is currently disabled.",
      variant: "default"
    });
    return;
  };

  const removeFile = (fileType: 'invoice' | 'deliveryNote' | 'qcReport') => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: null
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFileToStorage = async (file: File, fileName: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `stock-receipts/${Date.now()}-${fileName}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // If we're in readOnly mode, don't submit
    if (readOnly) {
      e.preventDefault();
      onOpenChange(false);
      return;
    }
    
    // If we're editing an existing receipt
    if (initialData) {
      e.preventDefault();
      
      try {
        // Update the stock receipt
        const { error: updateError } = await supabase
          .from('stock_receipts')
          .update({
            supplier_id: formData.supplier_id,
            receipt_date: formData.receipt_date,
            received_by: formData.received_by || null,
            notes: formData.notes || ''
          })
          .eq('id', initialData.id);
          
        if (updateError) throw updateError;
        
        // Update each receipt item
        for (const item of receivingItems) {
          const itemId = item.id;
          // Find the corresponding item in the database based on position in array
          const { data: existingItems, error: findError } = await supabase
            .from('stock_receipt_items')
            .select('id')
            .eq('stock_receipt_id', initialData.id);
            
          if (findError) throw findError;
          
          if (existingItems && existingItems.length > 0) {
            const existingItemId = existingItems[parseInt(item.id) - 1]?.id;
            
            if (existingItemId) {
              await supabase
                .from('stock_receipt_items')
                .update({
                  quantity: Number(item.quantity_received),
                  batch_number: item.batch_number || null,
                  lot_number: item.lot_number || null,
                  manufacture_date: item.manufacture_date || null,
                  expiry_date: item.expiry_date || null,
                  condition: item.condition || 'good',
                  storage_location: item.storage_location || null,
                  remarks: item.remarks || null,
                  has_discrepancy: Boolean(item.has_discrepancy)
                })
                .eq('id', existingItemId);
            }
          }
        }
        
        toast({
          title: "Success",
          description: `Stock receipt ${initialData.receipt_number} updated successfully`
        });
        
        onSuccess();
        onOpenChange(false);
        
      } catch (error) {
        console.error('Error updating stock receipt:', error);
        toast({
          title: "Error",
          description: "Failed to update stock receipt",
          variant: "destructive"
        });
      }
      
      return;
    }
    
    e.preventDefault();
    
    // Basic validation
    if (!formData.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier",
        variant: "destructive"
      });
      return;
    }

    if (!formData.receipt_date) {
      toast({
        title: "Validation Error",
        description: "Please provide a receipt date",
        variant: "destructive"
      });
      return;
    }
    
    // Check if there are any items to receive
    if (receivingItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "No items to receive. Please select a purchase order with items or add items manually",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting stock receipt creation...');
      
      // Upload files first
      const uploadPromises = [];
      const fileUrls: { [key: string]: string | null } = {};
      
      if (uploadedFiles.invoice) {
        uploadPromises.push(
          uploadFileToStorage(uploadedFiles.invoice.file, 'invoice')
            .then(url => { fileUrls.invoice = url; })
        );
      }
      
      if (uploadedFiles.deliveryNote) {
        uploadPromises.push(
          uploadFileToStorage(uploadedFiles.deliveryNote.file, 'delivery-note')
            .then(url => { fileUrls.deliveryNote = url; })
        );
      }
      
      if (uploadedFiles.qcReport) {
        uploadPromises.push(
          uploadFileToStorage(uploadedFiles.qcReport.file, 'qc-report')
            .then(url => { fileUrls.qcReport = url; })
        );
      }
      
      await Promise.all(uploadPromises);
      console.log('Files uploaded successfully:', fileUrls);

      // Generate receipt number - either from RPC or fallback
      let receiptNumber;
      try {
        const { data: receiptNumberData, error: rpcError } = await supabase.rpc('generate_receipt_number');
        
        if (rpcError) {
          console.error('Error generating receipt number from RPC:', rpcError);
          receiptNumber = `REC${Date.now().toString().slice(-6)}`;
        } else {
          receiptNumber = receiptNumberData || `REC${Date.now().toString().slice(-6)}`;
        }
      } catch (error) {
        console.error('Exception in receipt number generation:', error);
        receiptNumber = `REC${Date.now().toString().slice(-6)}`;
      }
      
      console.log('Generated receipt number:', receiptNumber);

      // Create stock receipt - with explicit data type handling
      const newStockReceipt = {
        receipt_number: receiptNumber,
        purchase_order_id: formData.purchase_order_id ? formData.purchase_order_id : null,
        supplier_id: formData.supplier_id,
        receipt_date: formData.receipt_date,
        received_by: formData.received_by || null,
        notes: formData.notes || '',
        invoice_uploaded: !!uploadedFiles.invoice,
        delivery_note_uploaded: !!uploadedFiles.deliveryNote,
        qc_report_uploaded: !!uploadedFiles.qcReport,
        invoice_url: fileUrls.invoice || null,
        delivery_note_url: fileUrls.deliveryNote || null,
        qc_report_url: fileUrls.qcReport || null
      };
      
      console.log('Submitting stock receipt data:', newStockReceipt);
      
      const { data: stockReceipt, error: receiptError } = await supabase
        .from('stock_receipts')
        .insert([newStockReceipt])
        .select()
        .single();

      if (receiptError) {
        console.error('Error creating stock receipt:', receiptError);
        throw receiptError;
      }
      
      console.log('Stock receipt created successfully:', stockReceipt);

      // Create stock receipt items
      const itemsToInsert = receivingItems.map(item => ({
        stock_receipt_id: stockReceipt.id,
        inventory_item_id: item.inventory_item_id || null,
        quantity: Number(item.quantity_received), // Ensure proper number type
        quantity_ordered: Number(item.quantity_ordered), // Ensure proper number type
        unit_of_measure: item.unit_of_measure || 'units',
        batch_number: item.batch_number || null,
        lot_number: item.lot_number || null,
        manufacture_date: item.manufacture_date || null,
        expiry_date: item.expiry_date || null,
        condition: item.condition || 'good',
        storage_location: item.storage_location || null,
        remarks: item.remarks || null,
        has_discrepancy: Boolean(item.has_discrepancy) // Ensure proper boolean type
      }));
      
      console.log('Submitting stock receipt items:', itemsToInsert);

      const { error: itemsError } = await supabase
        .from('stock_receipt_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating stock receipt items:', itemsError);
        throw itemsError;
      }
      
      console.log('Stock receipt items created successfully');

      // Update PO status if linked
      if (formData.purchase_order_id) {
        const hasDiscrepancies = getDiscrepancyCount() > 0;
        const newStatus = 'received'; // Both cases use 'received' status
        
        console.log(`Updating PO status to ${newStatus}`);
        
        const { error: poUpdateError } = await supabase
          .from('purchase_orders')
          .update({ status: newStatus })
          .eq('id', formData.purchase_order_id);
          
        if (poUpdateError) {
          console.error('Error updating purchase order status:', poUpdateError);
          // We don't throw here as this is not critical to the main flow
        }
      }

      toast({
        title: "Success",
        description: `Stock receipt ${receiptNumber} created successfully${getDiscrepancyCount() > 0 ? ' with discrepancies noted' : ''}`
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        purchase_order_id: '',
        supplier_id: '',
        receipt_date: new Date().toISOString().split('T')[0],
        received_by: '',
        notes: ''
      });
      setReceivingItems([]);
      setUploadedFiles({
        invoice: null,
        deliveryNote: null,
        qcReport: null
      });
      
      // Update inventory_items.current_stock for each received item
      for (const item of receivingItems) {
        if (item.inventory_item_id && typeof item.quantity_received === 'number') {
          // Fetch current stock and minimum/maximum stock for the item
          const { data: invData, error: invError } = await supabase
            .from('inventory_items')
            .select('current_stock, minimum_stock, maximum_stock, supplier_id, unit_price, name')
            .eq('id', item.inventory_item_id)
            .single();
          if (!invError && invData) {
            const newStock = (invData.current_stock || 0) + item.quantity_received;
            await supabase
              .from('inventory_items')
              .update({ current_stock: newStock })
              .eq('id', item.inventory_item_id);

            // Check system configuration for auto_reorder
            const { data: config, error: configError } = await supabase
              .from('system_configuration')
              .select('auto_reorder, low_stock_threshold')
              .limit(1)
              .single();
            if (!configError && config && config.auto_reorder) {
              // If after receiving, stock is still below or equal to minimum, trigger auto-reorder
              if (newStock <= invData.minimum_stock) {
                // Check if a PO already exists for this item and is not received/cancelled
                const { data: existingPOs, error: poError } = await supabase
                  .from('purchase_order_items')
                  .select('id, purchase_order_id')
                  .eq('inventory_item_id', item.inventory_item_id);
                let hasOpenPO = false;
                if (!poError && existingPOs && existingPOs.length > 0) {
                  // Check status of each PO
                  for (const poItem of existingPOs) {
                    const { data: po, error: poStatusError } = await supabase
                      .from('purchase_orders')
                      .select('status')
                      .eq('id', poItem.purchase_order_id)
                      .single();
                    if (!poStatusError && po && po.status !== 'received' && po.status !== 'cancelled') {
                      hasOpenPO = true;
                      break;
                    }
                  }
                }
                if (!hasOpenPO) {
                  // Calculate reorder quantity to reach maximum stock
                  let reorderQty = 0;
                  if (invData.maximum_stock && invData.maximum_stock > newStock) {
                    reorderQty = invData.maximum_stock - newStock;
                  } else {
                    reorderQty = (invData.minimum_stock || 1) * 2; // fallback: order double minimum
                  }
                  if (reorderQty > 0 && invData.supplier_id) {
                    // Generate PO number
                    const { data: poNumberData } = await supabase.rpc('generate_po_number');
                    const poNumber = poNumberData || `PO${Date.now().toString().slice(-6)}`;
                    // Create PO
                    const { data: purchaseOrder, error: poError } = await supabase
                      .from('purchase_orders')
                      .insert([{
                        po_number: poNumber,
                        supplier_id: invData.supplier_id,
                        total_amount: reorderQty * (invData.unit_price || 0),
                        status: 'pending',
                        notes: `Auto-reorder for ${invData.name}`
                      }])
                      .select()
                      .single();
                    if (!poError && purchaseOrder) {
                      // Create PO item
                      await supabase
                        .from('purchase_order_items')
                        .insert([{
                          purchase_order_id: purchaseOrder.id,
                          inventory_item_id: item.inventory_item_id,
                          quantity: reorderQty,
                          unit_price: invData.unit_price || 0
                        }]);
                      toast({
                        title: 'Auto Purchase Order Created',
                        description: `A purchase order (${poNumber}) was automatically created for ${invData.name}.`,
                        variant: 'default'
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Error creating stock receipt:', error);
      toast({
        title: "Error",
        description: "Failed to create stock receipt",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? 'View Stock Receipt' : initialData ? 'Edit Stock Receipt' : 'Receive Stock Inventory'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'View details of received inventory'
              : initialData
              ? 'Update received inventory details'
              : 'Record received inventory with batch tracking and documentation'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" data-read-only={readOnly ? 'true' : 'false'}>
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="purchase_order_id">Linked PO Number</Label>
                {formData.purchase_order_id && !readOnly && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7 px-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 border-dashed"
                    onClick={() => {
                      setFormData({...formData, purchase_order_id: ''});
                      setReceivingItems([]);
                      setSelectedPO(null);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear PO
                  </Button>
                )}
              </div>
              <Select
                value={formData.purchase_order_id}
                onValueChange={(value) => setFormData({ ...formData, purchase_order_id: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PO (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.po_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                disabled={readOnly}
              >
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

            <div className="space-y-2">
              <Label htmlFor="receipt_date">Receipt Date *</Label>
              <Input
                id="receipt_date"
                type="date"
                value={formData.receipt_date}
                onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="received_by">Received By</Label>
              <Input
                placeholder="John Doe"
                value={formData.received_by}
                onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Document Upload Status - DISABLED */}
          <div className="space-y-4 opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Documentation</h3>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                File Upload Disabled
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id={`file-invoice`}
                  className="sr-only"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload('invoice', e.target.files[0])}
                  accept="application/pdf,image/*"
                  disabled={true}
                />
                <label className="flex items-center gap-1 text-gray-400">
                  <Upload className="h-4 w-4" />
                  Invoice
                </label>
                {uploadedFiles.invoice && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {uploadedFiles.invoice.name} ({formatFileSize(uploadedFiles.invoice.size)})
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFile('invoice')} />
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="delivery-note-upload"
                  accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload('deliveryNote', e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  disabled={true}
                />
                <label className="flex items-center gap-2 text-gray-400">
                  <Upload className="h-4 w-4" />
                  Delivery Note
                </label>
                {uploadedFiles.deliveryNote && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {uploadedFiles.deliveryNote.name} ({formatFileSize(uploadedFiles.deliveryNote.size)})
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFile('deliveryNote')} />
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="qc-report-upload"
                  accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload('qcReport', e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  disabled={true}
                />
                <label className="flex items-center gap-2 text-gray-400">
                  <Upload className="h-4 w-4" />
                  QC Report
                </label>
                {uploadedFiles.qcReport && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {uploadedFiles.qcReport.name} ({formatFileSize(uploadedFiles.qcReport.size)})
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeFile('qcReport')} />
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Receiving Items */}
          {receivingItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Received Items</h3>
                {receivingItems.some((item) => item.has_discrepancy) && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {receivingItems.filter((item) => item.has_discrepancy).length} Discrepancies
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {receivingItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 space-y-4 ${
                      item.has_discrepancy ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.item_name}</h4>
                      {item.has_discrepancy && <Badge variant="destructive">Discrepancy</Badge>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity Ordered</Label>
                        <Input
                          type="number"
                          value={item.quantity_ordered}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity Received *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity_received}
                          onChange={(e) => updateReceivingItem(item.id, 'quantity_received', Number(e.target.value))}
                          readOnly={readOnly}
                          className={item.has_discrepancy ? 'border-red-300' : ''}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit of Measure</Label>
                        <Input
                          value={item.unit_of_measure}
                          onChange={(e) => updateReceivingItem(item.id, 'unit_of_measure', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select
                          value={item.condition}
                          onValueChange={(value) => updateReceivingItem(item.id, 'condition', value)}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Batch Number</Label>
                        <Input
                          value={item.batch_number}
                          onChange={(e) => updateReceivingItem(item.id, 'batch_number', e.target.value)}
                          readOnly={readOnly}
                          placeholder="Batch number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Lot Number</Label>
                        <Input
                          value={item.lot_number}
                          onChange={(e) => updateReceivingItem(item.id, 'lot_number', e.target.value)}
                          readOnly={readOnly}
                          placeholder="Lot number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Manufacture Date</Label>
                        <Input
                          type="date"
                          value={item.manufacture_date}
                          onChange={(e) => updateReceivingItem(item.id, 'manufacture_date', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) => updateReceivingItem(item.id, 'expiry_date', e.target.value)}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Storage Location</Label>
                        <Input
                          value={item.storage_location}
                          onChange={(e) => updateReceivingItem(item.id, 'storage_location', e.target.value)}
                          readOnly={readOnly}
                          placeholder="e.g., Room 1 Cabinet A"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea
                          value={item.remarks}
                          onChange={(e) => updateReceivingItem(item.id, 'remarks', e.target.value)}
                          readOnly={readOnly}
                          placeholder="Special notes or observations"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes/Comments</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              readOnly={readOnly}
              placeholder="Any special instructions or notes about this receipt..."
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </Button>
            {!readOnly && (
              <Button type="submit" className="bg-dental-primary hover:bg-dental-secondary">
                {initialData ? 'Update Receipt' : 'Save Receipt'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockReceivingForm;
