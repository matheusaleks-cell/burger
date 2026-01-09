ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
UPDATE products SET display_order = 0 WHERE display_order IS NULL;
