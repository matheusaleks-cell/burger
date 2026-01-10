
-- Create category if not exists and get ID
DO $$
DECLARE
    v_category_id UUID;
BEGIN
    SELECT id INTO v_category_id FROM categories WHERE name = 'Geral (Importado)';
    
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order)
        VALUES ('Geral (Importado)', 'Produtos importados do iFood', true, 99)
        RETURNING id INTO v_category_id;
    END IF;

    -- Insert Products

    INSERT INTO products (name, description, price, image_url, category_id, is_active, is_available, availability_status, available_all)
    VALUES ('Now Bacon', 'Pão de brioche, um delicioso e suculento hamburguer artesanal de 120g acompanhado de queijo cheddar duplo, fatias de bacon (perfeito pra você que é apaixonado por bacon) e nossa incrível maionese verde.

*Para evitar desperdício, marque na opção abaixo se desejar sachês*', 32.99, 'https://static.ifood-static.com.br/image/upload/t_thumbnail/logosgde/02bca55d-f766-4768-8110-d3f670339c23/202509031707_s2w2_c.png', v_category_id, true, true, 'available', true);

    INSERT INTO products (name, description, price, image_url, category_id, is_active, is_available, availability_status, available_all)
    VALUES ('Cheese Now', 'Pão de brioche, uma deliciosa e suculento hamburguer de 150g acompanhado de queijo cheddar duplo (no momento está sendo servido com queijo Prato) e molho especial da casa.

Você come esse burger feliz da vida... Mas sobra espaço para uma batata crocante.', 29.99, 'https://static.ifood-static.com.br/image/upload/t_thumbnail/logosgde/02bca55d-f766-4768-8110-d3f670339c23/202509031707_s2w2_c.png', v_category_id, true, true, 'available', true);

END $$;
