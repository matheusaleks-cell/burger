
import pg from 'pg';
const { Client } = pg;

// Standard Supabase local DB config
// If this fails, user might have changed port, but 54322 is default.
const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres'
});

async function fix() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const email = 'administrador@pousadamanager.local';

        // 1. Get User ID
        const resUser = await client.query("SELECT id FROM auth.users WHERE email = $1", [email]);
        if (resUser.rows.length === 0) {
            console.error('User not found!');
            process.exit(1);
        }
        const userId = resUser.rows[0].id;
        console.log(`Found user ID: ${userId}`);

        // 2. Force Admin Role
        // We use ON CONFLICT to upsert
        const upsertQuery = `
      INSERT INTO public.user_roles (user_id, role)
      VALUES ($1, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    `;

        await client.query(upsertQuery, [userId]);
        console.log('SUCCESS: Admin role forced for user.');

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

fix();
