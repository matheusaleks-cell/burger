
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envConfig = dotenv.config({ path: '.env' }).parsed || {};
const dbUrl = process.env.DATABASE_URL || envConfig.DATABASE_URL;

if (!dbUrl) {
    console.error("DATABASE_URL not found!");
    process.exit(1);
}

console.log("Connecting to DB...");

const sql = postgres(dbUrl);

async function run() {
    try {
        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260112_get_menu_rpc.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Applying RPC...");
        // Split by semicolon might be risky for functions, but let's try just executing the whole block 
        // usually postgres driver handles multi-statement or block.
        // The file is one create function statement.

        await sql.unsafe(migrationSql);

        console.log("RPC applied successfully!");
    } catch (e) {
        console.error("Error applying RPC:", e);
    } finally {
        await sql.end();
    }
}

run();
