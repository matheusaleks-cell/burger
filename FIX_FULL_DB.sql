-- ============================================================================
-- SCRIPT DE CORREÇÃO TOTAL (FIX_FULL_DB.sql) - VERSÃO 2
-- Execute este script no SQL Editor do Supabase.
-- Ele consolida TODAS as correções necessárias (Pousadas, Orders, Addons e Permissões).
-- ============================================================================

BEGIN;

-- 1. Permissões de Admin & Roles (Seguro)
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING ( public.is_admin(auth.uid()) );

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- 2. Correção de Orders (Kanban & Guest)
-- ============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Permite UPDATE para quem é Authenticated (Admin/Kitchen/Attendant)
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
CREATE POLICY "Authenticated users can update order items" ON public.order_items FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Permite INSERÇÃO e LEITURA pública (Guest)
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can read order items" ON public.order_items;
CREATE POLICY "Public can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read order items" ON public.order_items FOR SELECT USING (true);

-- 3. Correção de Pousadas (Colunas faltantes e RLS)
-- ============================================================================
ALTER TABLE public.pousadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.pousadas;
CREATE POLICY "Enable read access for all users" ON public.pousadas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pousadas;
CREATE POLICY "Enable insert for authenticated users only" ON public.pousadas FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.pousadas;
CREATE POLICY "Enable update for authenticated users only" ON public.pousadas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.pousadas;
CREATE POLICY "Enable delete for authenticated users only" ON public.pousadas FOR DELETE TO authenticated USING (true);

-- Adiciona colunas se não existirem
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS is_hq BOOLEAN DEFAULT FALSE;
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS delivery_radius_km DECIMAL(10,2) DEFAULT 5;
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS fee_per_km DECIMAL(10,2) DEFAULT 1.50;

-- 4. Correção de Categorias e Addons (Ordenação)
-- ============================================================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE public.complement_groups ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.complement_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Garante acesso público aos complementos
ALTER TABLE public.complement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complement_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Complement Groups" ON public.complement_groups;
CREATE POLICY "Public Read Complement Groups" ON public.complement_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Complement Items" ON public.complement_items;
CREATE POLICY "Public Read Complement Items" ON public.complement_items FOR SELECT USING (true);

-- 5. Correção de Customers (Guest Info)
-- ============================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Public can read customers" ON public.customers;
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read customers" ON public.customers FOR SELECT USING (true);

COMMIT;

-- Recarrega o schema cache do PostgREST
NOTIFY pgrst, 'reload config';
