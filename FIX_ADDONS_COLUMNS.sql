-- FIX: Add display_order to complement tables to prevent sort errors
ALTER TABLE public.complement_groups 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE public.complement_items 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Optional: ensure RLS policies are good (safety check)
ALTER TABLE public.complement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complement_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public Read Complement Groups" ON public.complement_groups FOR SELECT USING (true);
    CREATE POLICY "Public Read Complement Items" ON public.complement_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
