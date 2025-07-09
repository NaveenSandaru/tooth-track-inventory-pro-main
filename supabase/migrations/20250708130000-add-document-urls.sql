-- Add URL fields for document uploads to stock_receipts table
ALTER TABLE public.stock_receipts 
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_note_url TEXT,
ADD COLUMN IF NOT EXISTS qc_report_url TEXT;

-- Create storage bucket for documents if it doesn't exist
-- Note: This needs to be run manually in Supabase dashboard under Storage
-- Bucket name: documents
-- Public bucket: true
-- File size limit: 50MB
-- Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png 