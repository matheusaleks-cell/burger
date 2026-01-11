-- 1. Ensure New Context Columns Exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS available_for_delivery BOOLEAN DEFAULT TRUE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS available_for_pousada BOOLEAN DEFAULT TRUE;

-- 2. Insert/Ensure 'Bebidas' Category and Products
DO $$
DECLARE
    v_category_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM categories WHERE name ILIKE '%Bebidas%' LIMIT 1;
    
    -- If 'Bebidas' doesn't exist, create it
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, display_order, is_active)
        VALUES ('Bebidas', 'Refrigerantes, Águas e Cervejas', 99, true)
        RETURNING id INTO v_category_id;
    END IF;

    -- 3. Insert New Drinks (Manual Upsert)

    -- Coca Cola Lata 8,00
    IF EXISTS (SELECT 1 FROM products WHERE name = 'Coca Cola Lata') THEN
        UPDATE products SET price = 8.00, image_url = '/products/burguer_do_now_DEFINITIVO/refrigerante_lata_350_ml.jpg', availability_status = 'available', available_for_delivery = true, available_for_pousada = true WHERE name = 'Coca Cola Lata';
    ELSE
        INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all, image_url, available_for_delivery, available_for_pousada)
        VALUES ('Coca Cola Lata', 'Refrigerante 350ml', 8.00, v_category_id, true, 'available', true, '/products/burguer_do_now_DEFINITIVO/refrigerante_lata_350_ml.jpg', true, true);
    END IF;

    -- Guaraná Lata 8,00
    IF EXISTS (SELECT 1 FROM products WHERE name = 'Guaraná Lata') THEN
        UPDATE products SET price = 8.00, image_url = '/products/burguer_do_now_DEFINITIVO/refrigerante_lata_350_ml.jpg', availability_status = 'available', available_for_delivery = true, available_for_pousada = true WHERE name = 'Guaraná Lata';
    ELSE
        INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all, image_url, available_for_delivery, available_for_pousada)
        VALUES ('Guaraná Lata', 'Refrigerante 350ml', 8.00, v_category_id, true, 'available', true, '/products/burguer_do_now_DEFINITIVO/refrigerante_lata_350_ml.jpg', true, true);
    END IF;

    -- Agua 500ml 5,00
    IF EXISTS (SELECT 1 FROM products WHERE name = 'Água Mineral 500ml') THEN
        UPDATE products SET price = 5.00, availability_status = 'available' WHERE name = 'Água Mineral 500ml';
    ELSE
        INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all, image_url, available_for_delivery, available_for_pousada)
        VALUES ('Água Mineral 500ml', 'Sem gás', 5.00, v_category_id, true, 'available', true, NULL, true, true);
    END IF;

    -- Água com Gás 500ml 5,00
    IF EXISTS (SELECT 1 FROM products WHERE name = 'Água com Gás 500ml') THEN
        UPDATE products SET price = 5.00, availability_status = 'available' WHERE name = 'Água com Gás 500ml';
    ELSE
        INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all, image_url, available_for_delivery, available_for_pousada)
        VALUES ('Água com Gás 500ml', 'Com gás', 5.00, v_category_id, true, 'available', true, NULL, true, true);
    END IF;

    -- Agua 1,5l 8,00
    IF EXISTS (SELECT 1 FROM products WHERE name = 'Água Mineral 1,5L') THEN
        UPDATE products SET price = 8.00, availability_status = 'available' WHERE name = 'Água Mineral 1,5L';
    ELSE
        INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all, image_url, available_for_delivery, available_for_pousada)
        VALUES ('Água Mineral 1,5L', 'Sem gás', 8.00, v_category_id, true, 'available', true, NULL, true, true);
    END IF;

    -- Heineken 12,00
    IF EXISTS (SELECT 1 FROM products WHERE name = 'Heineken Long Neck') THEN
        UPDATE products SET price = 12.00, availability_status = 'available' WHERE name = 'Heineken Long Neck';
    ELSE
        INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all, image_url, available_for_delivery, available_for_pousada)
        VALUES ('Heineken Long Neck', 'Cerveja 330ml', 12.00, v_category_id, true, 'available', true, NULL, true, true);
    END IF;

    -- 4. VINCULAR IMAGENS (Nomes Higienizados: minúsculas, sem +, sem espaços)
    
    -- Big Bacon Now
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/big_bacon_now.jpg'
    WHERE name ILIKE '%Big Bacon Now%' AND name NOT ILIKE '%Combo%';

    -- Big Cheese Now
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/big_cheese_now.jpg'
    WHERE name ILIKE '%Big Cheese Now%' AND name NOT ILIKE '%Combo%';

    -- Cheese Now
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/cheese_now.jpg'
    WHERE name ILIKE '%Cheese Now%' AND name NOT ILIKE '%Combo%';

    -- Now Bacon
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/now_bacon.jpg'
    WHERE name ILIKE '%Now Bacon%' AND name NOT ILIKE '%Combo%';

    -- Supreme Cheese Now
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/supreme_cheese_now.jpg'
    WHERE name ILIKE '%Supreme Cheese Now%' AND name NOT ILIKE '%Combo%';

    -- Batata Frita 220g (Simples)
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/batata_frita_220g.jpg'
    WHERE name ILIKE '%Batata%' AND name NOT ILIKE '%Cheddar%' AND name NOT ILIKE '%Bacon%';

    -- Batata Frita com Cheddar e Bacon
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/batata_frita_com_cheddar_e_bacon_220g.jpg'
    WHERE name ILIKE '%Batata%' AND (name ILIKE '%Cheddar%' OR name ILIKE '%Bacon%');

    -- Combos (Substituído + por _)
    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/big_bacon_now_fritas_coca-cola_lata.jpg'
    WHERE name ILIKE '%Combo%' AND name ILIKE '%Big Bacon%';

    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/big_cheese_now_fritas_coca-cola_lata.jpg'
    WHERE name ILIKE '%Combo%' AND name ILIKE '%Big Cheese%';

    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/cheese_now_fritas_refrigerante_lata.jpg'
    WHERE name ILIKE '%Combo%' AND name ILIKE '%Cheese Now%';

    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/now_bacon_fritas_refrigerante_lata.jpg'
    WHERE name ILIKE '%Combo%' AND name ILIKE '%Now Bacon%';

    UPDATE products SET image_url = '/products/burguer_do_now_DEFINITIVO/combo_casal_2_cocas.jpg'
    WHERE name ILIKE '%Casal%';

END $$;
