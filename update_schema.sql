-- 1. Create Delivery Neighborhoods Table
CREATE TABLE IF NOT EXISTS public.delivery_neighborhoods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Neighborhoods
ALTER TABLE public.delivery_neighborhoods ENABLE ROW LEVEL SECURITY;

-- Policies for Neighborhoods (Read Public, Write Admin)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.delivery_neighborhoods;
CREATE POLICY "Enable read access for all users" ON public.delivery_neighborhoods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for admins" ON public.delivery_neighborhoods;
CREATE POLICY "Enable all access for admins" ON public.delivery_neighborhoods FOR ALL USING (public.is_admin(auth.uid()));


-- 2. Create System Settings Table (for First Order Logic, branding, etc)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for Settings
DROP POLICY IF EXISTS "Enable read access for all users" ON public.system_settings;
CREATE POLICY "Enable read access for all users" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable all access for admins" ON public.system_settings;
CREATE POLICY "Enable all access for admins" ON public.system_settings FOR ALL USING (public.is_admin(auth.uid()));


-- 3. Update Products Table (Visibility Flags)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'visible_in_delivery') THEN
        ALTER TABLE public.products ADD COLUMN visible_in_delivery BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'visible_in_pousada') THEN
        ALTER TABLE public.products ADD COLUMN visible_in_pousada BOOLEAN DEFAULT true;
    END IF;
END $$;


-- 4. Seed Initial Neighborhoods (Example)
INSERT INTO public.delivery_neighborhoods (name, fee)
VALUES 
    ('Centro', 5.00),
    ('Manguinhos', 7.00),
    ('Geribá', 8.00),
    ('Ferradura', 10.00),
    ('Tartaruga', 8.00),
    ('João Fernandes', 12.00)
ON CONFLICT DO NOTHING;
