
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCategories() {
    console.log("Fetching categories...");
    const { data: categories, error } = await supabase.from("categories").select("*");

    if (error) {
        console.error("Error fetching categories:", error);
        return;
    }

    console.log("Current Categories:", categories.map(c => c.name));

    const correctName = "Hambúrguer";
    const duplicateName = "Hambúrgueres";

    const correctCat = categories.find(c => c.name === correctName);
    const duplicateCat = categories.find(c => c.name === duplicateName);

    if (duplicateCat) {
        console.log(`Found duplicate category '${duplicateName}' with ID: ${duplicateCat.id}. Deleting...`);
        // First move products to correct if exists, or just warn
        if (correctCat) {
            const { error: updateError } = await supabase
                .from("products")
                .update({ category_id: correctCat.id })
                .eq("category_id", duplicateCat.id);
            if (updateError) console.error("Error moving products:", updateError);
        }

        const { error: delError } = await supabase.from("categories").delete().eq("id", duplicateCat.id);
        if (delError) console.error("Error deleting duplicate:", delError);
        else console.log("Deleted duplicate category.");
    }

    if (!correctCat) {
        console.log(`Category '${correctName}' not found. Creating it...`);
        const { data, error: createError } = await supabase
            .from("categories")
            .insert([{ name: correctName, description: "Nossos deliciosos hambúrgueres", is_active: true }])
            .select()
            .single();

        if (createError) console.error("Error creating category:", createError);
        else console.log("Created category:", data);
    } else {
        console.log(`Category '${correctName}' already exists.`);
    }

    console.log("Done.");
}

fixCategories();
