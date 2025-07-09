-- Create base tables that are referenced by other tables
-- This migration should run before the main migration

-- Create suppliers table
CREATE TABLE public.suppliers (
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
CREATE TABLE public.inventory_items (
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

-- Enable RLS on base tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for base tables
CREATE POLICY "Allow all operations on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);

-- Insert some default suppliers
INSERT INTO public.suppliers (name, contact_person, email, phone, address, city, state, postal_code) VALUES
('Dental Supply Co.', 'John Smith', 'john@dentalsupply.com', '(555) 123-4567', '123 Dental St', 'New York', 'NY', '10001'),
('Medical Equipment Plus', 'Sarah Johnson', 'sarah@medequip.com', '(555) 234-5678', '456 Medical Ave', 'Los Angeles', 'CA', '90210'),
('Dental Instruments Inc.', 'Mike Wilson', 'mike@dentalinstruments.com', '(555) 345-6789', '789 Instrument Blvd', 'Chicago', 'IL', '60601');

-- Insert some sample inventory items
INSERT INTO public.inventory_items (name, description, sku, current_stock, minimum_stock, unit_of_measurement, unit_price, supplier_id, location) VALUES
('Dental Floss', 'Waxed dental floss 50m', 'FLOSS-001', 100, 20, 'rolls', 2.50, (SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 'Storage A'),
('Toothpaste', 'Fluoride toothpaste 100g', 'PASTE-001', 50, 10, 'tubes', 3.75, (SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 'Storage A'),
('Dental Mirror', 'Stainless steel dental mirror', 'MIRROR-001', 25, 5, 'pieces', 15.00, (SELECT id FROM public.suppliers WHERE name = 'Dental Instruments Inc.' LIMIT 1), 'Storage B'); 