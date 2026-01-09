-- Enable RLS (just in case)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow anyone (Guests) to create orders
-- We drop existing policies to avoid conflicts/duplicates if they exist with different names
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can read order items" ON public.order_items;

-- Create permissive policies for guest usage
CREATE POLICY "Public can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Allow reading orders (needed for .select() after insert and for tracking)
CREATE POLICY "Public can read orders" 
ON public.orders FOR SELECT 
USING (true);

-- Allow creating items
CREATE POLICY "Public can create order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- Allow reading items
CREATE POLICY "Public can read order items" 
ON public.order_items FOR SELECT 
USING (true);

-- Also ensure Customers table is accessible if needed (though not currently used in this flow)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read customers" ON public.customers FOR SELECT USING (true);
