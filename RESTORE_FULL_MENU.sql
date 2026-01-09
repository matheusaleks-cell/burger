-- ============================================================================
-- RESTORE_FULL_MENU.sql
-- Script para recriar o cardápio completo (Combos, Lanches, Bebidas, etc.)
-- Também aplica as correções de colunas necessárias.
-- ============================================================================

-- 1. CORREÇÕES DE ESTRUTURA (GARANTIA)
-- ====================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS is_hq BOOLEAN DEFAULT FALSE;

-- 2. LIMPEZA (OPCIONAL - Descomente se quiser zerar antes de recriar)
-- DELETE FROM public.order_items;
-- DELETE FROM public.orders;
-- DELETE FROM public.product_complement_groups;
-- DELETE FROM public.product_pousadas;
-- DELETE FROM public.products;
-- DELETE FROM public.categories;

-- 3. RECRIAR CATEGORIAS
-- =====================
DO $$
DECLARE
    v_cat_combos UUID;
    v_cat_lanches UUID;
    v_cat_porcoes UUID;
    v_cat_bebidas UUID;
    v_cat_sobremesas UUID;
    v_hq_id UUID;
BEGIN
    -- Identificar ou Criar Pousada Principal (HQ)
    -- Tenta pegar a primeira existente
    SELECT id INTO v_hq_id FROM public.pousadas LIMIT 1;
    
    -- Se não existir nenhuma, cria uma
    IF v_hq_id IS NULL THEN
        INSERT INTO public.pousadas (name, address, is_hq, is_active)
        VALUES ('Loja Principal', 'Centro', TRUE, TRUE)
        RETURNING id INTO v_hq_id;
    ELSE
        -- Marca a encontrada como HQ
        UPDATE public.pousadas SET is_hq = TRUE WHERE id = v_hq_id;
    END IF;

    -- Inserir Categorias
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Combos', 'Melhor custo benefício', 1, true) RETURNING id INTO v_cat_combos;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Lanches', 'Hambúrgueres Artesanais', 2, true) RETURNING id INTO v_cat_lanches;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Porções', 'Para compartilhar', 3, true) RETURNING id INTO v_cat_porcoes;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Bebidas', 'Refrigerantes e Sucos', 4, true) RETURNING id INTO v_cat_bebidas;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Sobremesas', 'Para fechar com chave de ouro', 5, true) RETURNING id INTO v_cat_sobremesas;

    -- 4. RECRIAR PRODUTOS
    -- ===================

    -- COMBOS
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES 
    ('Combo Casal', '2 X-Salada + 1 Fritas G + 1 Coca 2L', 65.00, v_cat_combos, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80', true, true),
    ('Combo Solteiro', '1 X-Bacon + 1 Fritas P + 1 Refri Lata', 35.00, v_cat_combos, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', true, true);

    -- LANCHES
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES 
    ('X-Burger', 'Pão, carne artesanal, queijo e molho especial.', 22.00, v_cat_lanches, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', true, true),
    ('X-Salada', 'Pão, carne, queijo, alface, tomate e maionese.', 25.00, v_cat_lanches, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80', true, true),
    ('X-Bacon', 'Pão, carne, muito bacon crocante e cheddar.', 29.90, v_cat_lanches, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80', true, true),
    ('X-Tudo', 'Pão, 2 carnes, ovo, bacon, calabresa, salada e tudo que tem direito.', 38.00, v_cat_lanches, 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=500&q=80', true, true),
    ('Smash Burger', 'Pão, 2 carnes smash de 80g, queijo duplo e picles.', 28.00, v_cat_lanches, 'https://images.unsplash.com/photo-1629858632646-0428be0b2170?w=500&q=80', true, true);

    -- PORÇÕES
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES 
    ('Batata Frita P', 'Porção individual (200g)', 15.00, v_cat_porcoes, 'https://images.unsplash.com/photo-1573080496987-a22320b91e92?w=500&q=80', true, true),
    ('Batata Frita G', 'Porção para dividir (500g)', 28.00, v_cat_porcoes, 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&q=80', true, true),
    ('Batata c/ Cheddar e Bacon', 'Batata Frita coberta com cheddar cremoso e cubos de bacon.', 35.00, v_cat_porcoes, 'https://images.unsplash.com/photo-1585109649139-3668018951a7?w=500&q=80', true, true),
    ('Anéis de Cebola', 'Onion Rings crocantes (12 unidades)', 24.00, v_cat_porcoes, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&q=80', true, true);

    -- BEBIDAS
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES 
    ('Coca-Cola Lata', '350ml', 6.00, v_cat_bebidas, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', true, true),
    ('Coca-Cola 2L', 'Garrafa', 14.00, v_cat_bebidas, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500&q=80', true, true),
    ('Guaraná Antarctica', 'Lata 350ml', 6.00, v_cat_bebidas, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', true, true),
    ('Água Mineral', '500ml', 4.00, v_cat_bebidas, 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=500&q=80', true, true);

    -- SOBREMESAS
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES 
    ('Pudim de Leite', 'Fatia generosa', 12.00, v_cat_sobremesas, 'https://images.unsplash.com/photo-1594950669176-32d1656c125d?w=500&q=80', true, true),
    ('Mousse de Maracujá', 'No potinho', 10.00, v_cat_sobremesas, 'https://images.unsplash.com/photo-1507920191834-8c83a7c6f018?w=500&q=80', true, true);

END $$;
