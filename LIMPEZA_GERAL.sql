-- ========================================================================
-- SCRIPT DE LIMPEZA E CORREÇÃO DE PERMISSÕES (LIMPEZA_GERAL.sql)
-- ========================================================================
-- Instruções:
-- 1. Acesse https://supabase.com/dashboard/project/xehwyyqqdceqbqilmyht/sql/new
-- 2. Cole este script completo.
-- 3. Clique em "RUN".
-- ========================================================================

BEGIN;

-- 1. CORRIGIR PERMISSÃO DE ADMIN (Definitivo)
-- Garante que o usuário 'administrador@pousadamanager.local' seja admin no banco.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'administrador@pousadamanager.local';
  
  IF v_user_id IS NOT NULL THEN
    -- Remove qualquer role anterior para evitar duplicidade erro
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    -- Insere como admin
    INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');
  END IF;
END $$;

-- 2. ZERAR PEDIDOS (Wipe)
-- Remove todos os pedidos e itens de pedido do sistema.
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;

-- 3. REMOVER ITENS DUPLICADOS
-- Mantém apenas o item mais recente se houver nomes duplicados.
DELETE FROM public.products a USING public.products b
WHERE a.name = b.name        -- Mesmo nome
  AND a.created_at < b.created_at; -- Remove o mais antigo

DELETE FROM public.categories a USING public.categories b
WHERE a.name = b.name
  AND a.created_at < b.created_at;

COMMIT;

-- ========================================================================
-- FIM DO SCRIPT
-- ========================================================================
