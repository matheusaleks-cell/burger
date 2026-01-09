-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pousadas;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pousadas;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.pousadas;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.pousadas;

-- Enable RLS
ALTER TABLE public.pousadas ENABLE ROW LEVEL SECURITY;

-- Allow public read access (necessary for guests)
CREATE POLICY "Enable read access for all users"
ON public.pousadas FOR SELECT
USING (true);

-- Allow authenticated users (admins) to insert
CREATE POLICY "Enable insert for authenticated users only"
ON public.pousadas FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users (admins) to update
CREATE POLICY "Enable update for authenticated users only"
ON public.pousadas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users (admins) to delete
CREATE POLICY "Enable delete for authenticated users only"
ON public.pousadas FOR DELETE
TO authenticated
USING (true);

-- Also ensure the columns exist (redundancy for safety)
ALTER TABLE public.pousadas
ADD COLUMN IF NOT EXISTS is_hq BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(10,2) DEFAULT 5,
ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_per_km DECIMAL(10,2) DEFAULT 1.50;
