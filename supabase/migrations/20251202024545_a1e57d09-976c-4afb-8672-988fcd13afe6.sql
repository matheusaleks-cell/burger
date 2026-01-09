CREATE TABLE IF NOT EXISTS public.pousadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pousadas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pousadas_updated_at BEFORE UPDATE ON public.pousadas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()