-- ============================================================================
-- SCRIPT DE CORREÇÃO DE ADMIN (FIX_ADMIN_ACCESS.sql)
-- Execute este script no SQL Editor do Supabase para virar Admin na força bruta!
-- ============================================================================

-- 1. Remove qualquer permissão incorreta que possa ter ficado
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%matheus%');

-- 2. Insere a permissão de ADMIN para seu usuário
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email LIKE '%matheus%';

-- 3. Confirma o resultado
SELECT u.email, r.role 
FROM auth.users u
JOIN public.user_roles r ON u.id = r.user_id
WHERE u.email LIKE '%matheus%';
