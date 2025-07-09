-- Add system configuration table
CREATE TABLE IF NOT EXISTS public.system_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name TEXT,
  auto_reorder BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 10,
  expiry_warning_days INTEGER DEFAULT 30,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add URL fields for document uploads to stock_receipts table
ALTER TABLE public.stock_receipts 
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_note_url TEXT,
ADD COLUMN IF NOT EXISTS qc_report_url TEXT;

-- Enable RLS on system_configuration
ALTER TABLE public.system_configuration ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for system_configuration
CREATE POLICY "Allow all operations on system_configuration" ON public.system_configuration FOR ALL USING (true) WITH CHECK (true);

-- Insert default system configuration
INSERT INTO public.system_configuration (clinic_name, auto_reorder, low_stock_threshold, expiry_warning_days, currency) VALUES
('Dental Clinic', false, 10, 30, 'USD')
ON CONFLICT DO NOTHING; 