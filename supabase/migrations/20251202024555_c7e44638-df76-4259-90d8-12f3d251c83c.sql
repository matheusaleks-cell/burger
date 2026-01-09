CREATE POLICY pousadas_all_admin ON public.pousadas AS PERMISSIVE FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY pousadas_select_auth ON public.pousadas AS PERMISSIVE FOR SELECT TO authenticated USING (true);

CREATE POLICY pousadas_select_anon ON public.pousadas AS PERMISSIVE FOR SELECT TO anon USING (is_active = true)