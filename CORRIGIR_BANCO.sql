-- 1. Create table for Product-Pousada Availability
CREATE TABLE IF NOT EXISTS public.product_pousadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    pousada_id UUID NOT NULL REFERENCES public.pousadas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, pousada_id)
);

-- 2. Add 'Available Everywhere' flag to Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS available_all BOOLEAN DEFAULT TRUE;

-- 3. Enable Security
ALTER TABLE public.product_pousadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON public.product_pousadas
    FOR SELECT USING (true);

CREATE POLICY "Allow insert/update for authenticated users" ON public.product_pousadas
    FOR ALL USING (auth.role() = 'authenticated');
    
-- 4. Create Pousadas Table (Safeguard in case it's missing)
CREATE TABLE IF NOT EXISTS public.pousadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Seed a Test Pousada (Optional, avoids empty list)
INSERT INTO public.pousadas (id, name, address, delivery_fee, is_active)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pousada Principal', 'Endereço Central', 5.00, true)
ON CONFLICT (id) DO NOTHING;
