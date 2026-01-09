-- Allow anonymous users to view active and available products
CREATE POLICY "Public can view available products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true AND is_available = true);

-- Allow anonymous users to view active categories
CREATE POLICY "Public can view active categories"
ON public.categories
FOR SELECT
TO anon
USING (is_active = true);

-- Allow anonymous users to create orders
CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to view orders by order_number
CREATE POLICY "Public can view orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to create order items
CREATE POLICY "Public can create order items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to view order items
CREATE POLICY "Public can view order items"
ON public.order_items
FOR SELECT
TO anon
USING (true);