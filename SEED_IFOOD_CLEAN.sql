
-- SCRIPT DE IMPORTACAO (COPIE A PARTIR DAQUI)
DO $$
DECLARE
    v_category_id UUID;
    v_clean_price NUMERIC;
BEGIN

    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Cheese Now + Fritas + Coca-Cola Lata', 'Pão de brioche, dois suculentos hamburguer artesanal de 150g cada, acompanhados de queijo cheddar duplo (dá até água na boca), com nossa incrível maionese verde pra finalizar + batata frita + Coca-Cola lata *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 53.87, v_category_id, true, 'available', true);
    
    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Bacon Now + Fritas + Coca-Cola Lata', 'Pão de brioche, duas saborosas carnes de 150g cada, acompanhados de queijo cheddar, bacon e molho especial da casa + Porção de batata frita + Coca Cola Lata #Hambúrguer', 56.89, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Cheese Now', 'Pão de brioche, uma deliciosa e suculento hamburguer de 150g acompanhado de queijo cheddar duplo (no momento está sendo servido com queijo Prato) e molho especial da casa. Você come esse burger feliz da vida... Mas sobra espaço para uma batata crocante.', 29.99, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Cheese Now', 'Pão de brioche, dois suculentos hamburguer artesanal de 150g cada, acompanhados de queijo prato duplo (dá até água na boca), com nossa incrível maionese verde pra finalizar. *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 42.85, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Now Bacon', 'Pão de brioche, um delicioso e suculento hamburguer artesanal de 120g acompanhado de queijo cheddar duplo, fatias de bacon (perfeito pra você que é apaixonado por bacon) e nossa incrível maionese verde. *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 32.99, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Cheese Now', 'Pão de brioche, uma deliciosa e suculento hamburguer de 150g acompanhado de queijo cheddar duplo (no momento está sendo servido com queijo Prato) e molho especial da casa. Você come esse burger feliz da vida... Mas sobra espaço para uma batata crocante.', 29.99, v_category_id, true, 'available', true);
    
    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Combo Casal + 2 Cocas', '2 Burger do Now + Batata Frita c/ cheddar e bacon + 2 Cocas Burger Burguer Hambúrguer', 74.9, v_category_id, true, 'available', true);
    
    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Cheese Now + Fritas + Refrigerante Lata', 'Pão de brioche, um delicioso e suculento hamburguer artesanal de 150g acompanhado de queijo cheddar duplo (no momento está sendo servido com queijo Prato) e nossa incrivel maionese verde + batata frita + Refrigerante Lata *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 45.98, v_category_id, true, 'available', true);
    
    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Now Bacon + Fritas + Refrigerante Lata', 'Pão de brioche, uma deliciosa e suculenta carne de 150g acompanhada de queijo cheddar, fatias de bacon e molho especial da casa + Porção de batata frita + Refrigerante Lata #Hambúrguer', 47.98, v_category_id, true, 'available', true);
    
    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Cheese Now + Fritas + Coca-Cola Lata', 'Pão de brioche, dois suculentos hamburguer artesanal de 150g cada, acompanhados de queijo cheddar duplo (dá até água na boca), com nossa incrível maionese verde pra finalizar + batata frita + Coca-Cola lata *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 53.87, v_category_id, true, 'available', true);
    
    -- Category: Combos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Combos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Combos', '', true, 
            CASE 
                WHEN 'Combos' = 'Combos' THEN 1
                WHEN 'Combos' = 'Hambúrgueres' THEN 2
                WHEN 'Combos' = 'Complementos' THEN 3
                WHEN 'Combos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Bacon Now + Fritas + Coca-Cola Lata', 'Pão de brioche, duas saborosas carnes de 150g cada, acompanhados de queijo cheddar, bacon e molho especial da casa + Porção de batata frita + Coca Cola Lata #Hambúrguer', 56.89, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Cheese Now', 'Pão de brioche, dois suculentos hamburguer artesanal de 150g cada, acompanhados de queijo prato duplo (dá até água na boca), com nossa incrível maionese verde pra finalizar. *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 42.85, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Big Bacon Now', 'Pão de brioche, duas saborosas carnes de 120g cada, acompanhadas de queijo cheddar, bacon e molho especial da casa. Hambúrguer em dobro', 44.9, v_category_id, true, 'available', true);
    
    -- Category: Hambúrgueres
    SELECT id INTO v_category_id FROM categories WHERE name = 'Hambúrgueres';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Hambúrgueres', '', true, 
            CASE 
                WHEN 'Hambúrgueres' = 'Combos' THEN 1
                WHEN 'Hambúrgueres' = 'Hambúrgueres' THEN 2
                WHEN 'Hambúrgueres' = 'Complementos' THEN 3
                WHEN 'Hambúrgueres' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Supreme Cheese Now', 'Essa maravilha é composta por pão de brioche, três incríveis e suculentos hamburguer artesanal de 120g cada, acompanhadas de queijo cheddar duplo e finalizado com nossa incrível maionese verde. (Produto somente para pessoas Supremas) *Para evitar desperdício, marque na opção abaixo se desejar sachês*', 54.99, v_category_id, true, 'available', true);
    
    -- Category: Complementos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Complementos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Complementos', '', true, 
            CASE 
                WHEN 'Complementos' = 'Combos' THEN 1
                WHEN 'Complementos' = 'Hambúrgueres' THEN 2
                WHEN 'Complementos' = 'Complementos' THEN 3
                WHEN 'Complementos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Batata Frita 220g', '', 18.99, v_category_id, true, 'available', true);
    
    -- Category: Complementos
    SELECT id INTO v_category_id FROM categories WHERE name = 'Complementos';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Complementos', '', true, 
            CASE 
                WHEN 'Complementos' = 'Combos' THEN 1
                WHEN 'Complementos' = 'Hambúrgueres' THEN 2
                WHEN 'Complementos' = 'Complementos' THEN 3
                WHEN 'Complementos' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Batata Frita com Cheddar e Bacon 220g', '', 23.99, v_category_id, true, 'available', true);
    
    -- Category: Bebidas
    SELECT id INTO v_category_id FROM categories WHERE name = 'Bebidas';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('Bebidas', '', true, 
            CASE 
                WHEN 'Bebidas' = 'Combos' THEN 1
                WHEN 'Bebidas' = 'Hambúrgueres' THEN 2
                WHEN 'Bebidas' = 'Complementos' THEN 3
                WHEN 'Bebidas' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('Refrigerante Lata 350 ml', '', 8, v_category_id, true, 'available', true);
    
END $$;
