-- ============================================================================
-- RESTORE_REAL_MENU.sql
-- Recria o cardápio com os dados REAIS fornecidos pelo cliente.
-- ============================================================================

-- 1. GARANTIR ESTRUTURA
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.pousadas ADD COLUMN IF NOT EXISTS is_hq BOOLEAN DEFAULT FALSE;

-- 2. LIMPEZA (CUIDADO: Isso remove produtos antigos para deixar O SEU cardápio limpo)
-- Se quiser manter os antigos, remova as linhas abaixo.
DELETE FROM public.order_items;
DELETE FROM public.product_complement_groups;
DELETE FROM public.product_pousadas;
DELETE FROM public.products;
DELETE FROM public.categories;

-- 3. RECRIAR CATEGORIAS REALMENTE USADAS
DO $$
DECLARE
    -- Variáveis para guardar os IDs das categorias
    v_cat_burgers UUID;
    v_cat_combos UUID;
    v_cat_bebidas UUID;
    v_cat_acompanhamentos UUID;
    v_cat_adicionais UUID;
    v_cat_sobremesas UUID;
    
    v_hq_id UUID;
BEGIN
    -- Configurar HQ (Loja Principal)
    SELECT id INTO v_hq_id FROM public.pousadas LIMIT 1;
    IF v_hq_id IS NULL THEN
        INSERT INTO public.pousadas (name, address, is_hq, is_active) VALUES ('Loja Principal', 'Centro', TRUE, TRUE) RETURNING id INTO v_hq_id;
    ELSE
        UPDATE public.pousadas SET is_hq = TRUE WHERE id = v_hq_id;
    END IF;

    -- Inserir Categorias na Ordem Pedida
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Hambúrgueres', 'Nossos deliciosos hambúrgueres artesanais', 0, true) RETURNING id INTO v_cat_burgers;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Combos', 'Combos especiais com hambúrguer + bebida + acompanhamento', 1, true) RETURNING id INTO v_cat_combos;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Bebidas', 'Refrigerantes, sucos e outras bebidas', 2, true) RETURNING id INTO v_cat_bebidas;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Acompanhamentos', 'Batatas, onion rings e outros acompanhamentos', 3, true) RETURNING id INTO v_cat_acompanhamentos;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Adicionais', 'Adicionais de proteína, queijo, salada e molhos', 4, true) RETURNING id INTO v_cat_adicionais;
    INSERT INTO public.categories (name, description, display_order, is_active) VALUES ('Sobremesas', 'Milk-shakes e sobremesas', 5, true) RETURNING id INTO v_cat_sobremesas;

    -- 4. INSERIR PRODUTOS REAIS

    -- === HAMBÚRGUERES ===
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all) VALUES 
    (
        'Manguinhos Burger', 
        'Pão, Carne 120g, Queijo Prato e Maionese da Casa', 
        27.90, 
        v_cat_burgers, 
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', 
        true, true
    ),
    (
        'Geribá Bacon', 
        'Pão, Carne 120g, Queijo Prato, Bacon, Maionese', 
        32.90, 
        v_cat_burgers, 
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80', 
        true, true
    ),
    (
        'Tartaruga Salad', 
        'Pão, Carne 120g, Queijo Prato, Alface, Tomate, Cebola Roxa e Maionese', 
        35.90, 
        v_cat_burgers, 
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80', 
        true, true
    ),
    (
        'Double Geribá Bacon', 
        'Pão, 2 carnes de 120g, cheddar e bacon', 
        39.90, 
        v_cat_burgers, 
        'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80', 
        true, true
    );

    -- === COMBOS ===
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all) VALUES 
    (
        'Combo Manguinhos Burger', 
        'Manguinhos Burger + Batata + Refrigerante', 
        48.90, 
        v_cat_combos, 
        'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=500&q=80', 
        true, true
    ),
    (
        'Combo Double Geribá Bacon', 
        'Pão, 2 Carnes 120g, cheddar e bacon + Batata 100g + Refri Lata', 
        51.90, 
        v_cat_combos, 
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80', 
        true, true
    ),
    (
        'Combo Geribá Bacon', 
        'Geriba Bacon + Batata + Refrigerante', 
        53.90, 
        v_cat_combos, 
        'https://images.unsplash.com/photo-1625813506062-0aeb1d7a0956?w=500&q=80', 
        true, true
    ),
    (
        'Combo Tartaruga Salad', 
        'Cheese Salada + Batata + Refrigerante', 
        55.90, 
        v_cat_combos, 
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80', 
        true, true
    );

    -- === BEBIDAS ===
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all) VALUES 
    (
        'Água S/ Gás 500ml', 
        'Garrafa', 
        5.00, 
        v_cat_bebidas, 
        'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=500&q=80', 
        true, true
    ),
    (
        'Água C/ Gás 500ml', 
        'Garrafa', 
        6.00, 
        v_cat_bebidas, 
        'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=500&q=80', 
        true, true
    ),
    (
        'Amstel Latão 473ml', 
        'Cerveja', 
        10.00, 
        v_cat_bebidas, 
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80', 
        true, true
    );

END $$;
