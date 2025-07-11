-- Create supplier_reviews table
CREATE TABLE public.supplier_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on supplier_reviews" ON public.supplier_reviews FOR ALL USING (true) WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_supplier_reviews_supplier_id ON public.supplier_reviews(supplier_id);
CREATE INDEX idx_supplier_reviews_status ON public.supplier_reviews(status);

-- Add function to update supplier rating
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the average rating in suppliers table
    UPDATE public.suppliers
    SET 
        rating = (
            SELECT AVG(rating)::numeric(2,1)
            FROM public.supplier_reviews
            WHERE supplier_id = NEW.supplier_id
            AND status = 'approved'
        )
    WHERE id = NEW.supplier_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update supplier rating
CREATE TRIGGER update_supplier_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.supplier_reviews
FOR EACH ROW
EXECUTE FUNCTION update_supplier_rating();

-- Add rating column to suppliers table if it doesn't exist
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);

-- Add some sample reviews
INSERT INTO public.supplier_reviews (supplier_id, rating, review_text, status) VALUES
((SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 4, 'Great service and quality products', 'approved'),
((SELECT id FROM public.suppliers WHERE name = 'Medical Equipment Plus' LIMIT 1), 5, 'Excellent delivery times', 'approved'),
((SELECT id FROM public.suppliers WHERE name = 'Dental Supply Co.' LIMIT 1), 3, 'Average service, could improve delivery times', 'pending'),
((SELECT id FROM public.suppliers WHERE name = 'Dental Instruments Inc.' LIMIT 1), 4, 'Good quality instruments', 'pending'); 