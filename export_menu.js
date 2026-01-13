
import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
});

async function exportMenu() {
    try {
        await client.connect();

        const tables = [
            'categories',
            'products',
            'complement_groups',
            'complement_items',
            'product_complement_groups',
            'product_pousadas' // For visibility info
        ];

        let sqlOutput = "-- AUTOMATIC MENU EXPORT --\n";
        sqlOutput += "-- Date: " + new Date().toISOString() + "\n\n";

        for (const table of tables) {
            const res = await client.query(`SELECT * FROM public.${table}`);

            if (res.rows.length > 0) {
                sqlOutput += `-- Data for ${table} --\n`;
                for (const row of res.rows) {
                    const columns = Object.keys(row).join(', ');
                    const values = Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'boolean') return val.toString();
                        if (typeof val === 'number') return val;
                        if (Array.isArray(val)) return `'${JSON.stringify(val)}'`; // Very basic array handling
                        // Escape single quotes
                        return `'${val.toString().replace(/'/g, "''")}'`;
                    }).join(', ');

                    sqlOutput += `INSERT INTO public.${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
                }
                sqlOutput += "\n";
            }
        }

        fs.writeFileSync('MENU_BACKUP.sql', sqlOutput);
        console.log('Menu exported to MENU_BACKUP.sql');

    } catch (err) {
        console.error('Error exporting menu:', err);
    } finally {
        await client.end();
    }
}

exportMenu();
