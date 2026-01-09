-- ============================================================================
-- SCRIPT FINAL DE ADMIN (SETUP_ADMIN_FINAL.sql)
-- 1. Garante que seu usuário tem permissão de ADMIN.
-- 2. Limpa qualquer erro de permissões anteriores.
-- ============================================================================

-- IMPORTANTE:
-- Antes de rodar, certifique-se que o usuário 'matheus@sistema.com' existe na aba Authentication > Users.
-- Se não existir, crie ele lá manualmente: 
--   Email: matheus@sistema.com
--   Senha: (a que você quiser, ex: 211198)

BEGIN;

-- 1. Remove permissões antigas pra evitar conflitos
DELETE FROM public.user_roles 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'matheus@sistema.com');

-- 2. Insere a permissão de ADMIN correta
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'matheus@sistema.com';

-- 3. Verifica se deu certo
SELECT email, 'ADMIN CONFIRMADO' as status 
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'matheus@sistema.com' AND ur.role = 'admin';

COMMIT;
