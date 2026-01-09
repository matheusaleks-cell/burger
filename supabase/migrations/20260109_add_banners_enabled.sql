-- Add show_banners column to pousadas table
ALTER TABLE pousadas 
ADD COLUMN IF NOT EXISTS show_banners BOOLEAN DEFAULT true;

COMMENT ON COLUMN pousadas.show_banners IS 'Master switch to show/hide the promo carousel';
