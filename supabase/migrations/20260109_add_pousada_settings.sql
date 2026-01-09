-- Add settings columns to pousadas table
ALTER TABLE pousadas 
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pix_key TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cpf', -- cpf, cnpj, email, phone, random
ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT '18:00 - 23:00',
ADD COLUMN IF NOT EXISTS estimated_time_min INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS estimated_time_max INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["pix", "card", "cash"]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN pousadas.is_open IS 'Indicates if the store/pousada is currently open for orders';
COMMENT ON COLUMN pousadas.estimated_time_min IS 'Minimum estimated time for delivery/preparation in minutes';
COMMENT ON COLUMN pousadas.estimated_time_max IS 'Maximum estimated time for delivery/preparation in minutes';
