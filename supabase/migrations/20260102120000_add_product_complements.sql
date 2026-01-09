-- Adiciona colunas na tabela products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS daily_stock INTEGER;

-- Adiciona constraint para availability_status
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_availability_status') THEN 
        ALTER TABLE public.products
        ADD CONSTRAINT check_availability_status CHECK (availability_status IN ('available', 'unavailable', 'paused'));
    END IF; 
END $$;

-- Tabela de Grupos de Complementos
CREATE TABLE IF NOT EXISTS public.complement_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_quantity INTEGER DEFAULT 0 NOT NULL,
  max_quantity INTEGER,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de Itens de Complemento
CREATE TABLE IF NOT EXISTS public.complement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.complement_groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  max_quantity INTEGER,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de relacionamento Produto <-> Grupo de Complementos
CREATE TABLE IF NOT EXISTS public.product_complement_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  complement_group_id UUID REFERENCES public.complement_groups(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, complement_group_id)
);

-- RLS Policies
ALTER TABLE public.complement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_complement_groups ENABLE ROW LEVEL SECURITY;

-- Policies for complement_groups
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for complement_groups') THEN 
        CREATE POLICY "Public read access for complement_groups" ON public.complement_groups FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin write access for complement_groups') THEN 
        CREATE POLICY "Admin write access for complement_groups" ON public.complement_groups FOR ALL USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Policies for complement_items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for complement_items') THEN 
        CREATE POLICY "Public read access for complement_items" ON public.complement_items FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin write access for complement_items') THEN 
        CREATE POLICY "Admin write access for complement_items" ON public.complement_items FOR ALL USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Policies for product_complement_groups
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for product_complement_groups') THEN 
        CREATE POLICY "Public read access for product_complement_groups" ON public.product_complement_groups FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin write access for product_complement_groups') THEN 
        CREATE POLICY "Admin write access for product_complement_groups" ON public.product_complement_groups FOR ALL USING (public.is_admin(auth.uid()));
    END IF;
END $$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_complement_groups_updated_at ON public.complement_groups;
CREATE TRIGGER update_complement_groups_updated_at BEFORE UPDATE ON public.complement_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_complement_items_updated_at ON public.complement_items;
CREATE TRIGGER update_complement_items_updated_at BEFORE UPDATE ON public.complement_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
