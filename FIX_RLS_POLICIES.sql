-- ============================================================================
-- SCRIPT DE CORREÇÃO DE SEGURANÇA (FIX_RLS_POLICIES.sql)
-- O motivo do erro: O banco estava "trancado demais" e não deixava 
-- o seu usuário ler o próprio cargo de Admin.
-- ============================================================================

-- 1. Permite que o usuário LEIA seu próprio cargo (Isso corrige o bug da "Cozinha")
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Permite que Admins (você) possam ler e editar cargos dos outros (para o futuro)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
USING ( public.is_admin(auth.uid()) );

-- 3. Garante que a função is_admin exista e funcione
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- 4. Bônus: Garante seu Admin de novo (só pra ter certeza)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'matheus@sistema.com'
ON CONFLICT (user_id, role) DO NOTHING;
