-- Allow Authenticated users (Admin/Kitchen) to UPDATE orders
-- This is critical for the Kanban board to work (moving cards)

DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

CREATE POLICY "Authenticated users can update orders" 
ON public.orders FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Verify Order Items update just in case
DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;

CREATE POLICY "Authenticated users can update order items" 
ON public.order_items FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
