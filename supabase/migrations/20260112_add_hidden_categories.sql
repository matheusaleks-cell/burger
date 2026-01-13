-- Add hidden_categories column to pousadas table
ALTER TABLE public.pousadas 
ADD COLUMN IF NOT EXISTS hidden_categories UUID[] DEFAULT '{}';

-- Comment explaining the column
COMMENT ON COLUMN public.pousadas.hidden_categories IS 'Array of category IDs that should be hidden for this Pousada';
