-- SCRIPT DE DIAGNÓSTICO E CORREÇÃO FINAL
-- Execute no Editor SQL do Supabase.

DO $$
DECLARE
  v_user_record record;
  v_count integer;
  v_updated_count integer := 0;
BEGIN
  RAISE NOTICE '=== INICIANDO DIAGNÓSTICO DE USUÁRIOS MATHEUS ===';

  -- 1. Listar usuários encontrados para registro
  FOR v_user_record IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE email ILIKE '%matheus%' 
       OR raw_user_meta_data->>'full_name' ILIKE '%matheus%'
       OR raw_user_meta_data->>'username' ILIKE '%matheus%'
  LOOP
    RAISE NOTICE 'Encontrado: Email=%, ID=%', v_user_record.email, v_user_record.id;
    
    -- 2. Limpar role antigo deste usuário
    DELETE FROM public.user_roles WHERE user_id = v_user_record.id;
    
    -- 3. Inserir role de admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_record.id, 'admin');
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'NENHUM usuário "Matheus" encontrado. Verifique se o nome está correto no cadastro.';
  ELSE
    RAISE NOTICE '=== SUCESSO! % usuários atualizados para Admin. ===', v_updated_count;
  END IF;

  -- 4. REFORÇAR POLÍTICAS DE SEGURANÇA (Garantia extra)
  RAISE NOTICE 'Atualizando políticas de segurança...';
  
  -- Função is_admin
  CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
  RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $func$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
  $func$;

  -- Habilitar RLS
  ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

  -- Recriar política de Admin
  DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
  CREATE POLICY "Admins can manage products" 
  ON public.products 
  FOR ALL 
  USING ( public.is_admin(auth.uid()) )
  WITH CHECK ( public.is_admin(auth.uid()) );

  -- Recriar política de Leitura
  DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
  CREATE POLICY "Anyone can read products" 
  ON public.products FOR SELECT 
  USING ( true );

  RAISE NOTICE '=== TUDO PRONTO. Tente atualizar o produto agora. ===';
END $$;
