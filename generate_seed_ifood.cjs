const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ifood_data.json', 'utf8'));

let sql = `
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
`;

data.forEach(group => {
    // group.category is "Geral (Importado)" usually

    group.items.forEach(item => {
        let price = 0;
        if (typeof item.price === 'string') {
            // Handle "32.99-32.99" or "R$ 32,99"
            let cleanPrice = item.price.replace('R$', '').trim().replace(',', '.');
            if (cleanPrice.includes('-')) {
                cleanPrice = cleanPrice.split('-')[0].trim();
            }
            price = parseFloat(cleanPrice);
        } else {
            price = item.price;
        }

        if (isNaN(price)) price = 0;

        const name = item.name.replace(/'/g, "''"); // Escape quotes
        const description = item.description ? item.description.replace(/'/g, "''") : '';
        const imageUrl = item.image_url ? item.image_url.replace(/'/g, "''") : '';

        sql += `
    INSERT INTO products (name, description, price, image_url, category_id, is_active, is_available, availability_status, available_all)
    VALUES ('${name}', '${description}', ${price}, '${imageUrl}', v_category_id, true, true, 'available', true);
`;
    });
});

sql += `
END $$;
`;

fs.writeFileSync('SEED_IFOOD.sql', sql);
console.log('SEED_IFOOD.sql generated.');
