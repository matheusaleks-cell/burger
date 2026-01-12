    -- 1. Create table if not exists
    CREATE TABLE IF NOT EXISTS delivery_neighborhoods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        fee DECIMAL(10,2) NOT NULL DEFAULT 0,
        active BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- 2. Enable RLS
    ALTER TABLE delivery_neighborhoods ENABLE ROW LEVEL SECURITY;

    -- 3. Policies
    -- Allow public read access (so customers can see the list)
    CREATE POLICY "Allow public read access" ON delivery_neighborhoods
        FOR SELECT USING (true);

    -- Allow admin full access (if needed later)
    -- (Assuming 'admin' role or similar logic exists, typically we use service_role key for seeds, 
    -- but for client admin panel usage: )
    CREATE POLICY "Allow admin all" ON delivery_neighborhoods
        FOR ALL USING (auth.role() = 'service_role'); 
    -- Note: User might be using a specific admin flag, but usually service_role is enough for initial seed.
    -- If the user logs in as an admin user, we might need a policy based on users table role.
    -- For now, public read is the critical part for the reported error.

    -- 4. Clear existing data to avoid duplicates (optional, but safe for a fresh insert of this specific list)
    TRUNCATE TABLE delivery_neighborhoods;

    -- 5. Insert Data
    INSERT INTO delivery_neighborhoods (name, fee, active) VALUES
    ('Manguinhos', 8.00, true),
    ('Geribá', 8.00, true),
    ('Albatroz', 8.00, true),
    ('Barbuda', 8.00, true),
    ('Portal da Ferradura', 10.00, true),
    ('Bosque de Geribá', 10.00, true),
    ('Vila Caranga', 10.00, true),
    ('Tartaruga', 12.00, true),
    ('Ferradura', 12.00, true),
    ('Ferradurinha', 14.00, true),
    ('Centro (Vila)', 12.00, true),
    ('Alto de Búzios', 14.00, true),
    ('Humaitá / Armação', 14.00, true),
    ('Brava', 15.00, true),
    ('Forno', 15.00, true),
    ('Ossos', 16.00, true),
    ('João Fernandes', 18.00, true);

    -- 6. Verify
    SELECT count(*) as total_bairros FROM delivery_neighborhoods;
