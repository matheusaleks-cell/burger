-- Migration to delete the admin user to allow recreation
-- This is necessary because we lost access and don't have the service role key readily available to delete via API

DO $$
BEGIN
  -- Attempt to delete the user from auth.users (cascade should handle profile)
  -- We target the email 'admin@pousadamanager.local'
  DELETE FROM auth.users WHERE email = 'admin@pousadamanager.local';
  
  -- Also clean up the 'gerente' user just in case we want a clean slate, 
  -- but maybe keep it as backup. Let's just delete admin for now.
END
$$;
