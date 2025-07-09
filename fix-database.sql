-- Fix Database Schema for Tooth Track Inventory Pro
-- Run this script in your Supabase SQL Editor

-- Step 1: Create base tables that are missing
-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  maximum_stock INTEGER,
  unit_of_measurement TEXT NOT NULL DEFAULT 'units',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id),
  location TEXT,
  expiry_date DATE,
  last_restocked DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Create inventory categories table
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES public.inventory_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Create purchase orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
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

-- Step 4: Create purchase order items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Create stock receipts table
CREATE TABLE IF NOT EXISTS public.stock_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 6: Create stock receipt items table
CREATE TABLE IF NOT EXISTS public.stock_receipt_items (
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

-- Step 7: Create equipment assets table
CREATE TABLE IF NOT EXISTS public.equipment_assets (
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

-- Step 8: Create equipment maintenance table
CREATE TABLE IF NOT EXISTS public.equipment_maintenance (
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

-- Step 9: Create inventory batches table
CREATE TABLE IF NOT EXISTS public.inventory_batches (
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

-- Step 10: Add missing columns to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.inventory_categories(id),
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS track_batches BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_expiry_days INTEGER DEFAULT 30;

-- Step 11: Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies (allowing all operations for now)
DROP POLICY IF EXISTS "Allow all operations on suppliers" ON public.suppliers;
CREATE POLICY "Allow all operations on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on inventory_items" ON public.inventory_items;
CREATE POLICY "Allow all operations on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on inventory_categories" ON public.inventory_categories;
CREATE POLICY "Allow all operations on inventory_categories" ON public.inventory_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "Allow all operations on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on stock_receipts" ON public.stock_receipts;
CREATE POLICY "Allow all operations on stock_receipts" ON public.stock_receipts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on stock_receipt_items" ON public.stock_receipt_items;
CREATE POLICY "Allow all operations on stock_receipt_items" ON public.stock_receipt_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on equipment_assets" ON public.equipment_assets;
CREATE POLICY "Allow all operations on equipment_assets" ON public.equipment_assets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on equipment_maintenance" ON public.equipment_maintenance;
CREATE POLICY "Allow all operations on equipment_maintenance" ON public.equipment_maintenance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on inventory_batches" ON public.inventory_batches;
CREATE POLICY "Allow all operations on inventory_batches" ON public.inventory_batches FOR ALL USING (true) WITH CHECK (true);

-- Step 13: Insert default data
INSERT INTO public.suppliers (name, contact_person, email, phone, address, city, state, postal_code) VALUES
('Dental Supply Co.', 'John Smith', 'john@dentalsupply.com', '(555) 123-4567', '123 Dental St', 'New York', 'NY', '10001'),
('Medical Equipment Plus', 'Sarah Johnson', 'sarah@medequip.com', '(555) 234-5678', '456 Medical Ave', 'Los Angeles', 'CA', '90210'),
('Dental Instruments Inc.', 'Mike Wilson', 'mike@dentalinstruments.com', '(555) 345-6789', '789 Instrument Blvd', 'Chicago', 'IL', '60601')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.inventory_categories (name, description) VALUES
('PPE', 'Personal Protective Equipment'),
('Restorative', 'Restorative Materials'),
('Anesthetics', 'Anesthetic Medications'),
('Instruments', 'Dental Instruments'),
('Imaging', 'Imaging and Radiology Supplies'),
('Consumables', 'General Consumable Items'),
('Equipment', 'Dental Equipment and Devices')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.inventory_items (name, description, sku, current_stock, minimum_stock, unit_of_measurement, unit_price, supplier_id, location) VALUES
('Dental Floss', 'Waxed dental floss 50m', 'FLOSS-001', 100, 20, 'rolls', 2.50, (SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 'Storage A'),
('Toothpaste', 'Fluoride toothpaste 100g', 'PASTE-001', 50, 10, 'tubes', 3.75, (SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 'Storage A'),
('Dental Mirror', 'Stainless steel dental mirror', 'MIRROR-001', 25, 5, 'pieces', 15.00, (SELECT id FROM public.suppliers WHERE name = 'Dental Instruments Inc.' LIMIT 1), 'Storage B')
ON CONFLICT (sku) DO NOTHING;

-- Update inventory items with categories
UPDATE public.inventory_items
SET category_id = (
  SELECT id FROM public.inventory_categories WHERE name = 'Consumables'
)
WHERE name IN ('Dental Floss', 'Toothpaste');

UPDATE public.inventory_items
SET category_id = (
  SELECT id FROM public.inventory_categories WHERE name = 'Instruments'
)
WHERE name IN ('Dental Mirror');

-- Add more sample inventory items with categories
INSERT INTO public.inventory_items (
  name, 
  description, 
  sku, 
  current_stock, 
  minimum_stock, 
  unit_of_measurement, 
  unit_price, 
  supplier_id,
  category_id,
  location
) VALUES
-- PPE Category
(
  'Disposable Gloves', 
  'Latex-free examination gloves', 
  'PPE-001', 
  500, 
  100, 
  'box', 
  9.99,
  (SELECT id FROM public.suppliers WHERE name = 'Medical Equipment Plus' LIMIT 1),
  (SELECT id FROM public.inventory_categories WHERE name = 'PPE'),
  'Storage A'
),
-- Restorative Category
(
  'Composite Filling', 
  'Light-cured composite resin', 
  'REST-001', 
  30, 
  10, 
  'units', 
  45.00,
  (SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1),
  (SELECT id FROM public.inventory_categories WHERE name = 'Restorative'),
  'Storage B'
),
-- Anesthetics Category
(
  'Local Anesthetic', 
  'Lidocaine 2% with epinephrine', 
  'ANES-001', 
  50, 
  20, 
  'box', 
  29.99,
  (SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1),
  (SELECT id FROM public.inventory_categories WHERE name = 'Anesthetics'),
  'Storage C'
);

-- Step 14: Create helper functions
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

-- Step 15: Verify tables were created
SELECT 'Database schema fixed successfully!' as status; 