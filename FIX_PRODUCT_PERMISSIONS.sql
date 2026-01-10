-- ============================================================================
-- FIX PRODUCT PERMISSIONS (FIX_PRODUCT_PERMISSIONS.sql)
-- ============================================================================

-- 1. Garante que RLS está ativo
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Remove políticas antigas conflitantes ou restritivas
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- 3. Cria uma política UNIFICADA para Admins fazerem tudo (SELECT, INSERT, UPDATE, DELETE)
--    O 'USING' permite ver/modificar linhas existentes.
--    O 'WITH CHECK' permite criar novas linhas ou novos valores.
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING ( public.is_admin(auth.uid()) )
WITH CHECK ( public.is_admin(auth.uid()) );

-- 4. Garante que todos (clientes) possam LER os produtos
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
CREATE POLICY "Anyone can read products" 
ON public.products FOR SELECT 
USING ( true );

-- 5. Garante função is_admin (caso não exista, overkill mas seguro)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;
