-- Add visibility flags to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS available_for_delivery BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS available_for_pousada BOOLEAN DEFAULT TRUE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
