ALTER TABLE public.pousadas
ADD COLUMN IF NOT EXISTS is_hq BOOLEAN DEFAULT FALSE;

-- Optional: Set the first pousada as HQ by default if none exists, just to have a fallback (User can change in UI)
UPDATE public.pousadas
SET is_hq = TRUE
WHERE id IN (SELECT id FROM public.pousadas ORDER BY created_at ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.pousadas WHERE is_hq = TRUE);
