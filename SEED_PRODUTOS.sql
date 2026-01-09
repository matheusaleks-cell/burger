-- ============================================================================
-- SCRIPT DE DADOS DE TESTE (SEED_PRODUTOS.sql)
-- Execute para popular o menu com produtos de exemplo.
-- ============================================================================

-- IDs Fixos para garantir consistência (os mesmos do SETUP_COMPLETO ou gerados agora)
DO $$
DECLARE
    v_cat_hamburguer UUID;
    v_cat_bebidas UUID;
    v_pousada_principal UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Mesmo ID do setup
    v_prod_xbacon UUID;
    v_prod_coca UUID;
    v_prod_especial UUID;
BEGIN

    -- 1. Recuperar Categorias (criadas no SETUP_COMPLETO)
    SELECT id INTO v_cat_hamburguer FROM public.categories WHERE name = 'Hambúrgueres' LIMIT 1;
    SELECT id INTO v_cat_bebidas FROM public.categories WHERE name = 'Bebidas' LIMIT 1;

    -- 2. Inserir Produtos
    
    -- Produto Global (Disponível em TODAS as pousadas)
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES (
        'X-Bacon Supremo', 
        'Pão brioche, burger 180g, muito bacon crocante e queijo cheddar.', 
        35.00, 
        v_cat_hamburguer, 
        'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80', -- Imagem Exemplo
        true, 
        true -- GLOBAL
    ) RETURNING id INTO v_prod_xbacon;

    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES (
        'Coca-Cola Lata', 
        'Lata 350ml gelada.', 
        6.00, 
        v_cat_bebidas, 
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
        true, 
        true -- GLOBAL
    ) RETURNING id INTO v_prod_coca;

    -- Produto Exclusivo (Disponível APENAS na Pousada Principal)
    INSERT INTO public.products (name, description, price, category_id, image_url, is_active, available_all)
    VALUES (
        'Especial da Casa', 
        'Receita secreta disponível apenas aqui.', 
        45.00, 
        v_cat_hamburguer, 
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', 
        true, 
        false -- NÃO É GLOBAL
    ) RETURNING id INTO v_prod_especial;

    -- 3. Vincular Produto Exclusivo à Pousada Principal
    INSERT INTO public.product_pousadas (product_id, pousada_id)
    VALUES (v_prod_especial, v_pousada_principal);

END $$;
