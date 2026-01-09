-- FIX: Add missing 'display_order' column to categories table
-- This is required because the frontend now sorts categories by this field.
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- FIX: Ensure 'is_hq' exists on pousadas (just in case)
ALTER TABLE public.pousadas 
ADD COLUMN IF NOT EXISTS is_hq BOOLEAN DEFAULT FALSE;

-- FIX: Ensure 'profiles' has necessary columns (common issue)
-- Uncomment if needed, but usually profiles is handled by triggers
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Verify/Refresh schema cache (optional, but good practice if supported by your setup, otherwise just running this is enough)
NOTIFY pgrst, 'reload config';
