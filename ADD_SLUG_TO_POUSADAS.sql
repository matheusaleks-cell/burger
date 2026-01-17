-- Add slug column to pousadas
ALTER TABLE public.pousadas 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_pousadas_slug ON public.pousadas(slug);

-- Ensure hidden_categories exists (JSONB array of category IDs)
ALTER TABLE public.pousadas 
ADD COLUMN IF NOT EXISTS hidden_categories TEXT[] DEFAULT '{}';

-- Function to find pousada by slug (RPC)
CREATE OR REPLACE FUNCTION public.get_pousada_by_slug(p_slug TEXT)
RETURNS SETOF public.pousadas
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.pousadas WHERE slug = p_slug LIMIT 1;
$$;
