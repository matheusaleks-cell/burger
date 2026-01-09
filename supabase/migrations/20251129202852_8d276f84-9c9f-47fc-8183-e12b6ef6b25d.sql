-- Add availability field to products (separate from is_active)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;