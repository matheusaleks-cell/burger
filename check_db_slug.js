
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using Anon key is fine for select usually if RLS allows

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlug() {
    console.log("Checking 'pousadas' table structure...");

    // Attempt to select 'slug' from pousadas.
    // If column doesn't exist, Supabase/PostgREST usually returns an error or ignores it?
    // PostgREST error: "Could not find the 'slug' column of 'pousadas'"

    const { data, error } = await supabase
        .from('pousadas')
        .select('slug')
        .limit(1);

    if (error) {
        console.error("Error selecting slug:", error);
        console.log("CONCLUSION: The 'slug' column likely DOES NOT EXIST. Migration needed.");
    } else {
        console.log("Success! 'slug' column detected.");
        console.log("Data sample:", data);

        // Also check if the specific partner exists
        const { data: partner, error: pError } = await supabase
            .from('pousadas')
            .select('*')
            .eq('slug', 'adega-acai');

        console.log("Partner 'adega-acai' lookup:", partner);
    }
}

checkSlug();
