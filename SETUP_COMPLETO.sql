-- ============================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO (SETUP_COMPLETO.sql)
-- Execute este script no SQL Editor do Supabase para configurar todo o banco.
-- ============================================================================

-- 1. BASE SCHEMA (Tabelas Principais)
-- ===================================

-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'attendant', 'kitchen');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for order types
DO $$ BEGIN
    CREATE TYPE public.order_type AS ENUM ('delivery', 'counter', 'room');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for order status
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for payment methods
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('pix', 'card', 'cash');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'attendant',
  UNIQUE (user_id, role)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  prep_time_minutes INTEGER DEFAULT 15 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  order_type order_type NOT NULL DEFAULT 'counter',
  room_number TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_type order_type NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  payment_method payment_method,
  notes TEXT,
  total DECIMAL(10,2) DEFAULT 0 NOT NULL,
  room_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies (Simplified for setup)
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
    CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ADD COMPLEMENTS (Complementos)
-- =================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS daily_stock INTEGER,
ADD COLUMN IF NOT EXISTS display_order INTEGER;

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

ALTER TABLE public.complement_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_complement_groups ENABLE ROW LEVEL SECURITY;

-- 3. ADD MULTI-POUSADA SUPPORT (Filiais)
-- ======================================

-- Tabela de Pousadas
CREATE TABLE IF NOT EXISTS public.pousadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junção Produto <-> Pousada
CREATE TABLE IF NOT EXISTS public.product_pousadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    pousada_id UUID NOT NULL REFERENCES public.pousadas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, pousada_id)
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS available_all BOOLEAN DEFAULT TRUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pousada_id UUID REFERENCES public.pousadas(id);

ALTER TABLE public.pousadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pousadas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public Read Pousadas" ON public.pousadas FOR SELECT USING (true);
    CREATE POLICY "Public Read Product Pousadas" ON public.product_pousadas FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. SEED DATA (Dados Iniciais)
-- =============================

INSERT INTO public.categories (name, description) VALUES
  ('Hambúrgueres', 'Nossos deliciosos hambúrgueres artesanais'),
  ('Bebidas', 'Refrigerantes, sucos e outras bebidas')
ON CONFLICT DO NOTHING;

INSERT INTO public.pousadas (id, name, address, delivery_fee, is_active)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pousada Principal', 'Endereço Central', 5.00, true)
ON CONFLICT (id) DO NOTHING;
