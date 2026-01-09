-- Drop strict admin-only policies
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

-- Create broader policies for authenticated users
CREATE POLICY "Allow delete orders for auth users" 
ON orders 
FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow delete order items for auth users" 
ON order_items 
FOR DELETE 
TO authenticated 
USING (true);
