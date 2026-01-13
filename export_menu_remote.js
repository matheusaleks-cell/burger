
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
// Better if we had SERVICE_ROLE_KEY but usually products are public read.

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportMenu() {
    try {
        console.log("Fetching menu data from Supabase...");

        const tables = [
            'neighborhoods', // Added neighborhoods as it was active context
            'categories',
            'products',
            'complement_groups',
            'complement_items',
            'product_complement_groups',
            'pousadas',
            'product_pousadas'
        ];

        let sqlOutput = "-- AUTOMATIC MENU EXPORT --\n";
        sqlOutput += "-- Date: " + new Date().toISOString() + "\n\n";

        for (const table of tables) {
            console.log(`Fetching ${table}...`);
            const { data, error } = await supabase.from(table).select('*');

            if (error) {
                console.error(`Error fetching ${table}:`, error.message);
                sqlOutput += `-- Error fetching ${table}: ${error.message}\n\n`;
                continue;
            }

            if (data && data.length > 0) {
                sqlOutput += `-- Data for ${table} --\n`;
                for (const row of data) {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'boolean') return val.toString();
                        if (typeof val === 'number') return val;
                        if (typeof val === 'object') return `'${JSON.stringify(val)}'`;
                        // Escape single quotes for SQL
                        return `'${val.toString().replace(/'/g, "''")}'`;
                    }).join(', ');

                    sqlOutput += `INSERT INTO public.${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
                }
                sqlOutput += "\n";
            } else {
                sqlOutput += `-- Table ${table} is empty --\n\n`;
            }
        }

        fs.writeFileSync('MENU_EXPORT.sql', sqlOutput);
        console.log('✅ Menu exported to MENU_EXPORT.sql');

    } catch (err) {
        console.error('Error exporting menu:', err);
    }
}

exportMenu();
