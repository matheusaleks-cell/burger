-- Add location and delivery fee configuration to pousadas table
ALTER TABLE public.pousadas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS delivery_radius_km INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS base_delivery_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_per_km DECIMAL(10,2) DEFAULT 1.50;

-- Update RLS if necessary (likely already covers update if admin)
-- Creating a default location for the existing Pousada (Example: Center of Sao Paulo or a generic place)
-- Let's update the first pousada to have some dummy data for testing
UPDATE public.pousadas
SET 
  latitude = -23.550520, 
  longitude = -46.633308, -- Sao Paulo Center
  delivery_radius_km = 10,
  base_delivery_fee = 2.00,
  fee_per_km = 1.00
WHERE name = 'Pousada Principal';
