-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update the handle_new_user function to support username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_username TEXT;
BEGIN
  -- Extract username from email (username@burgersystem.local)
  extracted_username := split_part(NEW.email, '@', 1);
  
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', extracted_username), extracted_username);
  
  -- First user becomes admin, others become attendants
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'attendant');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to get user id by username
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(p_username TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE username = p_username LIMIT 1;
$$;