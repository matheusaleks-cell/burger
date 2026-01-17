
-- Add ask_room column to pousadas
ALTER TABLE public.pousadas 
ADD COLUMN IF NOT EXISTS ask_room BOOLEAN DEFAULT TRUE;

-- Update existing records to true (optional since default is true)
UPDATE public.pousadas SET ask_room = TRUE WHERE ask_room IS NULL;
