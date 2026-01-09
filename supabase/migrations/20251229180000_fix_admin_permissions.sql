-- Force correct role for the administrator user
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'administrador@pousadamanager.local';
  
  -- If user exists, force update their role to 'admin'
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin';
  END IF;
END
$$;
