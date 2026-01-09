const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://idzpnbxowjfubehzcwqk.supabase.co";
const supabaseKey = "sb_publishable_1Pzk4DqDuk9W0vloMljGrQ_vPZipAZ5";

const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
    const { data, error } = await supabase.from('pousadas').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

list();
