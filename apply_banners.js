
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const sqlPath = path.join(__dirname, 'FIX_BANNERS.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL...');
        await client.query(sql);
        console.log('SUCCESS: Banners table created/updated.');

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

run();
