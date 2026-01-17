-- Add Reward System columns to pousadas table
ALTER TABLE public.pousadas 
ADD COLUMN IF NOT EXISTS first_order_discount_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_order_discount_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed', 'delivery_free'
ADD COLUMN IF NOT EXISTS first_order_discount_value DECIMAL(10,2) DEFAULT 0;
