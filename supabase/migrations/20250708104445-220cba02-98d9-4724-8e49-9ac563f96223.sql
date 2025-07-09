
-- Add missing fields to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS requested_by TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS authorized_by UUID;

-- Add missing fields to purchase_order_items table  
ALTER TABLE public.purchase_order_items
ADD COLUMN IF NOT EXISTS item_code TEXT,
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'units',
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Add missing fields to stock_receipts table
ALTER TABLE public.stock_receipts
ADD COLUMN IF NOT EXISTS invoice_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_note_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS qc_report_uploaded BOOLEAN DEFAULT FALSE;

-- Add missing fields to stock_receipt_items table
ALTER TABLE public.stock_receipt_items
ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER,
ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'units',
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'expired')),
ADD COLUMN IF NOT EXISTS storage_location TEXT,
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS has_discrepancy BOOLEAN DEFAULT FALSE;

-- Create a table for document uploads
CREATE TABLE IF NOT EXISTS public.purchase_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  stock_receipt_id UUID REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'delivery_note', 'qc_report')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policy for the new table
ALTER TABLE public.purchase_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on purchase_documents" ON public.purchase_documents FOR ALL USING (true) WITH CHECK (true);
