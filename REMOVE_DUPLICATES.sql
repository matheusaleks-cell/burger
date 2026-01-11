-- REMOVE BUTTONS DUPLICADOS
-- Este script mantem apenas o produto mais recente de cada nome e remove os antigos.

DELETE FROM products
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id, 
            -- Agrupa pelo nome (ignorando maiusculas/minusculas e espaços extras)
            ROW_NUMBER() OVER (
                PARTITION BY TRIM(LOWER(name)) 
                ORDER BY created_at DESC
            ) as rn
        FROM products
    ) t
    WHERE t.rn > 1
);

-- Opcional: Remover categorias duplicadas também
DELETE FROM categories
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (
                PARTITION BY TRIM(LOWER(name)) 
                ORDER BY created_at DESC
            ) as rn
        FROM categories
    ) t
    WHERE t.rn > 1
);
