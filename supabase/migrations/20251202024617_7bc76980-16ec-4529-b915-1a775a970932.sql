CREATE TABLE IF NOT EXISTS public.order_item_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES public.category_addons(id) ON DELETE SET NULL,
  addon_name TEXT NOT NULL,
  addon_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_item_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_item_addons_delete_admin ON public.order_item_addons AS PERMISSIVE FOR DELETE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY order_item_addons_insert_auth ON public.order_item_addons AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY order_item_addons_select_auth ON public.order_item_addons AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY order_item_addons_insert_anon ON public.order_item_addons AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY order_item_addons_select_anon ON public.order_item_addons AS PERMISSIVE FOR SELECT TO anon USING (true)