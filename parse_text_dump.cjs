const fs = require('fs');

const rawText = fs.readFileSync('ifood_menu_dump.txt', 'utf8');
const lines = rawText.split(/\r?\n/).filter(line => line.trim() !== '');

// Known categories based on inspection
const knownCategories = [
    "Destaques",
    "Famosos do Ifood",
    "Os queridinhos do Ifood",
    "Combos do Now",
    "Burguer do Now",
    "Complementos",
    "Bebidas"
];

let sql = `
DO $$
DECLARE
    v_category_id UUID;
    v_clean_price NUMERIC;
BEGIN
`;

let currentCategory = 'Geral (Importado)';
let buffer = [];

// Helper to flush a product from the buffer
function flushProduct() {
    if (buffer.length === 0) return;

    // Heuristic analysis of the buffer block
    // Expected structure variants:
    // Case 1 (Standard):
    // [0] Name
    // [1] Description
    // [2] Serve X
    // [3] Price string (R$ XX,XX...)
    // [4] Name repeat (ignore)

    // Case 2 (No description?):
    // [0] Name
    // [1] Serve X
    // [2] Price

    // Case 3 (Simple):
    // [0] Name
    // [1] Price

    let name = buffer[0];
    let description = '';
    let priceLine = '';
    let price = 0;

    // Find price line (contains "R$")
    let priceIndex = buffer.findIndex(l => l.includes('R$'));

    if (priceIndex !== -1) {
        priceLine = buffer[priceIndex];

        // Extract content between name and price as description
        // Ignoring "Serve X pessoa" line if present
        let descLines = buffer.slice(1, priceIndex).filter(l => !l.toLowerCase().includes('serve '));
        description = descLines.join(' ');

        // Parse price
        // "R$ 53,87R$ 65,50" -> take first
        // "R$ 44,90"
        let matches = priceLine.match(/R\$\s*([\d,]+)/);
        if (matches) {
            price = parseFloat(matches[1].replace(',', '.'));
        }
    }

    // Escape SQL
    const safeName = name.replace(/'/g, "''");
    const safeDesc = description.replace(/'/g, "''");


    // Classification Logic
    let category = "Hambúrgueres"; // Default

    const lowerName = safeName.toLowerCase();

    if (lowerName.includes('combo') || lowerName.includes(' + ')) {
        category = "Combos";
    } else if (lowerName.includes('batata frita')) {
        category = "Complementos";
    } else if (lowerName.includes('refrigerante') || lowerName.includes('lata') || lowerName.includes('coca')) {
        category = "Bebidas";
    }

    // Generate SQL for Category
    sql += `
    -- Category: ${category}
    SELECT id INTO v_category_id FROM categories WHERE name = '${category}';
    IF v_category_id IS NULL THEN
        INSERT INTO categories (name, description, is_active, display_order) 
        VALUES ('${category}', '', true, 
            CASE 
                WHEN '${category}' = 'Combos' THEN 1
                WHEN '${category}' = 'Hambúrgueres' THEN 2
                WHEN '${category}' = 'Complementos' THEN 3
                WHEN '${category}' = 'Bebidas' THEN 4
                ELSE 99
            END
        ) RETURNING id INTO v_category_id;
    END IF;

    INSERT INTO products (name, description, price, category_id, is_active, availability_status, available_all)
    VALUES ('${safeName}', '${safeDesc}', ${price}, v_category_id, true, 'available', true);
    `;

    buffer = [];
}

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignore header crap and old categories
    if (["Ver mais", "Buscar no cardápio", "$Pedido mínimo R$ 20,00"].some(s => line.includes(s))) continue;
    if (line === "Burguer do Now - Buzios") continue;
    if (line === "-") continue;
    if (knownCategories.includes(line)) {
        flushProduct();
        // Ignore the old category name, we determine it derived from product now
        continue;
    }


    // Heuristics for Product separation:
    // If we hit a line that looks like a name (repeated from top of buffer) or we just finished a price line?
    // The dump repeat the name AT THE END of the block usually.
    // "Big Cheese Now ... [Price] ... Big Cheese Now"
    // So if line == buffer[0], it's the end of that block.

    if (buffer.length > 0 && line === buffer[0]) {
        // End of product block
        flushProduct();
    } else {
        buffer.push(line);
        // Safety check: if buffer gets too big or hits next price without flushing? 
        // With the "repeated name" logic it should be robust enough for this specific dump style.
    }
}
// Flush last
flushProduct();

sql += `
END $$;
`;

fs.writeFileSync('SEED_IFOOD_CLEAN.sql', sql);
console.log("Clean SQL generated!");
