-- Add available_all flag to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS available_all BOOLEAN DEFAULT TRUE;

-- Create junction table for product availability per pousada
CREATE TABLE IF NOT EXISTS public.product_pousadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    pousada_id UUID NOT NULL REFERENCES public.pousadas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, pousada_id)
);

-- Enable RLS
ALTER TABLE public.product_pousadas ENABLE ROW LEVEL SECURITY;

-- Policies for product_pousadas
CREATE POLICY "Allow read access to all users" ON public.product_pousadas
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON public.product_pousadas
    FOR ALL USING (pousadas_admin_policy_check()); -- Reusing existing admin check function if available, or simplified:

-- If specific function not guaranteed, use:
-- CREATE POLICY "Allow admin full access" ON public.product_pousadas
-- FOR ALL USING (
--   EXISTS (
--     SELECT 1 FROM public.user_roles 
--     WHERE user_id = auth.uid() AND role = 'admin'
--   )
-- );
