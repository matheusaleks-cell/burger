-- ============================================================================
-- SCRIPT DE CORREÇÃO AUTOMÁTICA (SEM EDIÇÃO NECESSÁRIA)
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_email_found text;
BEGIN
  -- 1. Tentar encontrar usuário que contenha 'matheus' no email
  SELECT id, email INTO v_user_id, v_email_found
  FROM auth.users 
  WHERE email ILIKE '%matheus%'
  LIMIT 1;

  -- 2. Verificação se encontrou
  IF v_user_id IS NULL THEN
     -- Tenta buscar nos metadados como fallback
     SELECT id, email INTO v_user_id, v_email_found
     FROM auth.users
     WHERE raw_user_meta_data->>'full_name' ILIKE '%matheus%'
     OR raw_user_meta_data->>'username' ILIKE '%matheus%'
     LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível encontrar nenhum usuário "matheus" automaticamente.';
  END IF;

  RAISE NOTICE 'Usuário encontrado: % (ID: %)', v_email_found, v_user_id;

  -- 3. Limpar permissões antigas (Correção do erro 42P10)
  DELETE FROM public.user_roles WHERE user_id = v_user_id;

  -- 4. Inserir permissão de ADMIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin');

  RAISE NOTICE '---------------------------------------------------';
  RAISE NOTICE 'SUCESSO! O usuário % agora é admin.', v_email_found;
  RAISE NOTICE 'Pode tentar atualizar o produto novamente.';
  RAISE NOTICE '---------------------------------------------------';
END $$;
