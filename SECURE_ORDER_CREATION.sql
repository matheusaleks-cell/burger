-- SECURE ORDER CREATION RPC
-- This function calculates totals on the server-side to prevent price manipulation.

CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_customer_name text,
    p_customer_phone text,
    p_room_number text,      -- Address or Room
    p_order_type text,       -- 'delivery', 'counter', 'room'
    p_pousada_id uuid,
    p_payment_method text,   -- notes about payment
    p_items jsonb,           -- Array of {product_id, quantity, complements: [{id, quantity}]}
    p_delivery_fee numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id uuid;
    v_order_id uuid;
    v_order_number bigint;
    v_total numeric := 0;
    v_item_total numeric;
    v_product_price numeric;
    v_product_name text;
    v_item jsonb;
    v_comp jsonb;
    v_comp_price numeric;
    v_comp_name text;
    v_notes text;
    v_final_notes text;
BEGIN
    -- 1. Find or Create Customer
    SELECT id INTO v_customer_id FROM public.customers WHERE phone = p_customer_phone LIMIT 1;
    
    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (full_name, phone, room_number)
        VALUES (p_customer_name, p_customer_phone, p_room_number)
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE public.customers 
        SET full_name = p_customer_name, room_number = p_room_number 
        WHERE id = v_customer_id;
    END IF;

    -- 2. Create Order Shell (Total 0 initially)
    INSERT INTO public.orders (
        customer_id, 
        pousada_id, 
        status, 
        order_type, 
        room_number, 
        notes, 
        delivery_fee, 
        total
    ) VALUES (
        v_customer_id,
        p_pousada_id,
        'pending',
        p_order_type,
        p_room_number,
        p_payment_method, -- Initial notes
        p_delivery_fee,   -- We trust delivery fee for now (or should validate per neighborhood)
        0 -- Will update later
    ) RETURNING id, order_number INTO v_order_id, v_order_number;

    -- 3. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := 0;
        
        -- Get Product Price (Server Side)
        SELECT price, name INTO v_product_price, v_product_name 
        FROM public.products 
        WHERE id = (v_item->>'product_id')::uuid;
        
        IF v_product_price IS NULL THEN
            RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
        END IF;

        v_item_total := v_product_price;
        
        -- Process Complements (if any)
        v_notes := '';
        IF (v_item ? 'complements') THEN
             FOR v_comp IN SELECT * FROM jsonb_array_elements(v_item->'complements')
             LOOP
                -- Assuming complement structure has {id, quantity}
                -- We need to fetch complement price. 
                -- NOTE: The current schema for complements depends on `complement_items`? 
                -- Let's assume `complement_items` table exists and has `price`.
                
                SELECT price, name INTO v_comp_price, v_comp_name
                FROM public.complement_items
                WHERE id = (v_comp->>'id')::uuid;
                
                IF v_comp_price IS NOT NULL THEN
                    v_item_total := v_item_total + (v_comp_price * (v_comp->>'quantity')::int);
                    v_notes := v_notes || (v_comp->>'quantity') || 'x ' || v_comp_name || ', ';
                END IF;
             END LOOP;
        END IF;

        -- Create Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            notes
        ) VALUES (
            v_order_id,
            (v_item->>'product_id')::uuid,
            v_product_name,
            (v_item->>'quantity')::int,
            v_item_total, -- Price of 1 unit with complements
            NULLIF(v_notes, '')
        );

        -- Add to Grand Total
        v_total := v_total + (v_item_total * (v_item->>'quantity')::int);
    END LOOP;

    -- 4. Update Order Total
    UPDATE public.orders 
    SET total = v_total + p_delivery_fee
    WHERE id = v_order_id;

    RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_total + p_delivery_fee);
END;
$$;

-- Grant Permission
GRANT EXECUTE ON FUNCTION public.create_order_secure TO anon, authenticated, service_role;
