-- Add CRM columns to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
