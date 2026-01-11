-- Add columns for First Order Reward configuration
ALTER TABLE pousadas 
ADD COLUMN IF NOT EXISTS first_order_discount_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_order_discount_type TEXT DEFAULT 'delivery_free', -- 'percentage', 'fixed', 'delivery_free'
ADD COLUMN IF NOT EXISTS first_order_discount_value NUMERIC DEFAULT 0;

-- Refresh schema cache (conceptually)
NOTIFY pgrst, 'reload schema';
