
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Load env
const envConfig = dotenv.config({ path: '.env' }).parsed || {};
const dbUrl = process.env.DATABASE_URL || envConfig.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

console.log("Connecting to DB...", dbUrl);

const sql = postgres(dbUrl);

async function run() {
    try {
        await sql`
            ALTER TABLE pousadas 
            ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS pix_key TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cpf',
            ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT '18:00 - 23:00',
            ADD COLUMN IF NOT EXISTS estimated_time_min INTEGER DEFAULT 30,
            ADD COLUMN IF NOT EXISTS estimated_time_max INTEGER DEFAULT 45,
            ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["pix", "card", "cash"]'::jsonb;
        `;
        console.log("Migration applied successfully!");
    } catch (e) {
        console.error("Error applying migration:", e);
    } finally {
        await sql.end();
    }
}

run();
