-- Create a function to check if setup is needed (works for unauthenticated users)
CREATE OR REPLACE FUNCTION public.check_setup_needed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
$$;