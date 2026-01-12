-- Create a function to fetch all menu data in a single request
-- This avoids N+1 queries and joins everything on the server side

CREATE OR REPLACE FUNCTION public.get_menu_data()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL(10,2),
  category_id UUID,
  image_url TEXT,
  is_active BOOLEAN,
  prep_time_minutes INTEGER,
  display_order INTEGER,
  external_id TEXT,
  promotional_price DECIMAL(10,2),
  availability_status TEXT,
  daily_stock INTEGER,
  available_all BOOLEAN,
  available_for_delivery BOOLEAN,
  available_for_pousada BOOLEAN,
  categories JSONB,
  product_pousadas JSONB,
  addons JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.category_id,
    p.image_url,
    p.is_active,
    p.prep_time_minutes,
    p.display_order,
    p.external_id,
    p.promotional_price,
    p.availability_status,
    p.daily_stock,
    p.available_all,
    p.available_for_delivery,
    p.available_for_pousada,
    to_jsonb(c) as categories,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object('pousada_id', pp.pousada_id))
        FROM product_pousadas pp
        WHERE pp.product_id = p.id
      ),
      '[]'::jsonb
    ) as product_pousadas,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', cg.id,
            'name', cg.name,
            'min_quantity', cg.min_quantity,
            'max_quantity', cg.max_quantity,
            'items', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', ci.id,
                  'name', ci.name,
                  'price', ci.price,
                  'max_quantity', ci.max_quantity,
                  'is_active', ci.is_active
                ) ORDER BY ci.price ASC
              )
              FROM complement_items ci
              WHERE ci.group_id = cg.id AND ci.is_active = true
            )
          ) ORDER BY pcg.display_order ASC
        )
        FROM product_complement_groups pcg
        JOIN complement_groups cg ON cg.id = pcg.complement_group_id
        WHERE pcg.product_id = p.id
          AND cg.updated_at IS NOT NULL -- Just to ensure valid join
      ),
      '[]'::jsonb
    ) as addons
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  ORDER BY p.display_order ASC, p.name ASC;
$$;
