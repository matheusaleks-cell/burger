INSERT INTO public.pousadas (id, name, address, delivery_fee, is_active)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pousada Teste Auto', 'Rua Teste 123', 5.00, true)
ON CONFLICT (id) DO UPDATE 
SET delivery_fee = 5.00, is_active = true;
