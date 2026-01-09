CREATE TABLE IF NOT EXISTS public.category_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.category_addons ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_category_addons_updated_at BEFORE UPDATE ON public.category_addons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY category_addons_all_admin ON public.category_addons AS PERMISSIVE FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY category_addons_select_auth ON public.category_addons AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY category_addons_select_anon ON public.category_addons AS PERMISSIVE FOR SELECT TO anon USING (is_active = true)