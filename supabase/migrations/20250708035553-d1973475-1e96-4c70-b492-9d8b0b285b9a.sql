
-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock receipts table
CREATE TABLE public.stock_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock receipt items table (with batch tracking)
CREATE TABLE public.stock_receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_receipt_id UUID REFERENCES public.stock_receipts(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  batch_number TEXT,
  lot_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment/assets table
CREATE TABLE public.equipment_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_start_date DATE,
  warranty_end_date DATE,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired', 'disposed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment maintenance records table
CREATE TABLE public.equipment_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment_assets(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
  description TEXT NOT NULL,
  maintenance_date DATE NOT NULL,
  performed_by TEXT,
  cost DECIMAL(10,2),
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory categories table
CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES public.inventory_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update inventory_items table to add batch tracking and barcode support
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.inventory_categories(id),
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS track_batches BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_expiry_days INTEGER DEFAULT 30;

-- Create inventory batches table for detailed batch tracking
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  lot_number TEXT,
  manufacture_date DATE,
  expiry_date DATE,
  quantity_received INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  supplier_id UUID REFERENCES public.suppliers(id),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inventory_item_id, batch_number)
);

-- Add RLS policies for new tables
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on user roles)
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_receipts" ON public.stock_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_receipt_items" ON public.stock_receipt_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on equipment_assets" ON public.equipment_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on equipment_maintenance" ON public.equipment_maintenance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_categories" ON public.inventory_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_batches" ON public.inventory_batches FOR ALL USING (true) WITH CHECK (true);

-- Insert some default categories
INSERT INTO public.inventory_categories (name, description) VALUES
('PPE', 'Personal Protective Equipment'),
('Restorative', 'Restorative Materials'),
('Anesthetics', 'Anesthetic Medications'),
('Instruments', 'Dental Instruments'),
('Imaging', 'Imaging and Radiology Supplies'),
('Consumables', 'General Consumable Items'),
('Equipment', 'Dental Equipment and Devices');

-- Create function to auto-generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  po_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE po_number ~ '^PO[0-9]+$';
  
  po_number := 'PO' || LPAD(next_number::TEXT, 6, '0');
  RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  receipt_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM stock_receipts
  WHERE receipt_number ~ '^REC[0-9]+$';
  
  receipt_number := 'REC' || LPAD(next_number::TEXT, 6, '0');
  RETURN receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate asset numbers
CREATE OR REPLACE FUNCTION generate_asset_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  asset_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(asset_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM equipment_assets
  WHERE asset_number ~ '^AST[0-9]+$';
  
  asset_number := 'AST' || LPAD(next_number::TEXT, 6, '0');
  RETURN asset_number;
END;
$$ LANGUAGE plpgsql;
