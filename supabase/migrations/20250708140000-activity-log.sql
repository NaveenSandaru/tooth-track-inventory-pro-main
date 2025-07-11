-- Create activity log table for tracking inventory actions
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('Stock Added', 'Stock Used', 'New Item Added', 'Stock Alert', 'Item Updated', 'Item Expired', 'Item Deleted')),
  item_id UUID REFERENCES public.inventory_items(id),
  item_name TEXT NOT NULL,
  quantity TEXT,
  user_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for activity_log
CREATE POLICY "Allow all operations on activity_log" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample activity logs
INSERT INTO public.activity_log (action, item_id, item_name, quantity, user_name) VALUES
('Stock Added', (SELECT id FROM public.inventory_items WHERE name = 'Dental Floss' LIMIT 1), 'Dental Floss', '50 rolls', 'Dr. Smith'),
('Stock Used', (SELECT id FROM public.inventory_items WHERE name = 'Toothpaste' LIMIT 1), 'Toothpaste', '5 tubes', 'Dr. Johnson'),
('New Item Added', (SELECT id FROM public.inventory_items WHERE name = 'Dental Mirror' LIMIT 1), 'Dental Mirror', '10 pieces', 'Admin'),
('Stock Alert', (SELECT id FROM public.inventory_items WHERE name = 'Toothpaste' LIMIT 1), 'Toothpaste', 'Below minimum', 'System'); 