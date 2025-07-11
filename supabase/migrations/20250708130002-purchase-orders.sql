-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    ordered_by UUID,
    ordered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);

-- Add function to update total amount
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.purchase_orders
    SET total_amount = (
        SELECT SUM(total_price)
        FROM public.purchase_order_items
        WHERE purchase_order_id = NEW.purchase_order_id
    )
    WHERE id = NEW.purchase_order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update total amount
CREATE TRIGGER update_purchase_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_total();

-- Insert sample purchase orders
INSERT INTO public.purchase_orders (supplier_id, order_number, status, expected_delivery_date) VALUES
((SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 'PO-2024-001', 'received', '2024-02-01'),
((SELECT id FROM public.suppliers WHERE name = 'Medical Equipment Plus' LIMIT 1), 'PO-2024-002', 'approved', '2024-02-15'),
((SELECT id FROM public.suppliers WHERE name = 'Dental Instruments Inc.' LIMIT 1), 'PO-2024-003', 'pending', '2024-02-28');

-- Insert sample purchase order items
INSERT INTO public.purchase_order_items (
    purchase_order_id,
    inventory_item_id,
    quantity,
    unit_price,
    total_price
) VALUES
(
    (SELECT id FROM public.purchase_orders WHERE order_number = 'PO-2024-001'),
    (SELECT id FROM public.inventory_items WHERE sku = 'FLOSS-001'),
    100,
    2.50,
    250.00
),
(
    (SELECT id FROM public.purchase_orders WHERE order_number = 'PO-2024-001'),
    (SELECT id FROM public.inventory_items WHERE sku = 'PASTE-001'),
    50,
    3.75,
    187.50
),
(
    (SELECT id FROM public.purchase_orders WHERE order_number = 'PO-2024-002'),
    (SELECT id FROM public.inventory_items WHERE sku = 'MIRROR-001'),
    20,
    15.00,
    300.00
); 