import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Config
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envConfig = dotenv.config({ path: path.join(__dirname, '.env') }).parsed || {};

// --- LEIA AQUI ---
// Para este script funcionar (fazer upload real), você precisa da chave SERVICE_ROLE (secreta) do Supabase.
// A chave Anon/Public geralmente não tem permissão para criar arquivos se não houver Políticas (RLS) configuradas.
// Substitua abaixo ou coloque no .env como SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkenBuYnhvd2pmdWJlaHpjd3FrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgzNTM1OCwiZXhwIjoyMDgxNDExMzU4fQ.N0OQys7VgDenJPRz4SVLKxfHqrNQOtyP2-u2urKeW7Q";
// -----------------

if (!SUPABASE_URL || SUPABASE_KEY === "SUA_CHAVE_SERVICE_ROLE_AQUI") {
    console.error("❌ ERRO: Você precisa configurar a SUPABASE_SERVICE_ROLE_KEY no script ou no .env!");
    console.log("Vá no Dashboard do Supabase -> Settings -> API -> copie a chave 'service_role' (secret).");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = 'products';
const LOCAL_DIR = path.join(__dirname, 'public/products/burguer_do_now_DEFINITIVO');

async function main() {
    console.log("🚀 Iniciando upload de imagens para o Supabase Storage...");

    // 1. Criar Bucket se não existir
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) console.error("Erro ao listar buckets:", bucketError);

    const bucketExists = buckets?.find(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
        console.log(`📦 Criando bucket '${BUCKET_NAME}'...`);
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, { public: true });
        if (createError) {
            // Se der erro de permissão ou duplicado, tentamos prosseguir
            console.log("Aviso ao criar bucket (pode já existir):", createError.message);
        }
    } else {
        console.log(`✅ Bucket '${BUCKET_NAME}' já existe.`);
    }

    // 2. Ler arquivos locais
    if (!fs.existsSync(LOCAL_DIR)) {
        console.error("❌ Diretório local não encontrado:", LOCAL_DIR);
        process.exit(1);
    }
    const files = fs.readdirSync(LOCAL_DIR);

    for (const file of files) {
        if (file === '.DS_Store') continue;

        const filePath = path.join(LOCAL_DIR, file);
        const fileBuffer = fs.readFileSync(filePath);

        // Caminho no Storage: burguer_now/nome_do_arquivo.jpg
        const storagePath = `burguer_now/${file}`;

        console.log(`📤 Enviando: ${file}...`);

        // Upload (upsert: true substitui se existir)
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                contentType: 'image/jpeg', // Assumindo jpg/png
                upsert: true
            });

        if (error) {
            console.error(`❌ Erro ao enviar ${file}:`, error.message);
            continue;
        }

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        const publicUrl = publicUrlData.publicUrl;
        console.log(`✅ Upload OK! URL: ${publicUrl}`);

        // 3. Atualizar no Banco de Dados
        // Precisamos achar o produto correspondente. Vamos usar a lógica de NOME DO ARQUIVO -> NOME DO PRODUTO APROXIMADO.
        // O ideal é ter um mapa, mas vamos usar a lógica do SQL anterior adaptada para JS.

        let productNameSnippet = "";

        // Mapeamento manual rápido baseado nos nomes dos arquivos (que já higienizamos)
        if (file.includes("big_bacon_now") && !file.includes("combo")) productNameSnippet = "Big Bacon Now";
        else if (file.includes("big_cheese_now") && !file.includes("combo")) productNameSnippet = "Big Cheese Now";
        else if (file.includes("cheese_now") && !file.includes("combo") && !file.includes("supreme")) productNameSnippet = "Cheese Now";
        else if (file.includes("supreme_cheese_now")) productNameSnippet = "Supreme Cheese Now";
        else if (file.includes("now_bacon") && !file.includes("combo") && !file.includes("big")) productNameSnippet = "Now Bacon";

        else if (file.includes("batata_frita_220g")) productNameSnippet = "Batata Frita 220g"; // Simplificado
        else if (file.includes("batata_frita_com_cheddar")) productNameSnippet = "Batata Frita com Cheddar";

        else if (file.includes("combo") && file.includes("big_bacon")) productNameSnippet = "Combo Big Bacon"; // Simplificado, like %Combo%Big Bacon%
        else if (file.includes("combo") && file.includes("big_cheese")) productNameSnippet = "Combo Big Cheese";
        else if (file.includes("combo") && file.includes("cheese_now")) productNameSnippet = "Combo Cheese Now";
        else if (file.includes("combo") && file.includes("now_bacon")) productNameSnippet = "Combo Now Bacon";
        else if (file.includes("combo_casal")) productNameSnippet = "Combo Casal";

        else if (file.includes("coca-cola") || file.includes("refrigerante_lata")) {
            // Pode ser Coca ou Guaraná. Difícil distinguir só pelo nome genérico 'refrigerante_lata'.
            // Mas se o arquivo for 'refrigerante_lata_350_ml.jpg', vamos aplicar a ambom? Ou deixar quieto?
            // Se tiver coca no nome...
            if (file.includes("coca")) productNameSnippet = "Coca Cola";
        }

        // Se conseguimos identificar um snippet
        if (productNameSnippet) {
            // Update via Supabase Query
            // Usando ILIKE patterns
            /*
             UPDATE products SET image_url = publicUrl 
             WHERE name ILIKE `%${snippet}%`
            */
            // Construir query segura é complexo sem builder exato para 'ILIKE', o supabase-js tem .ilike().

            // Vamos fazer update direto
            const { error: dbError } = await supabase
                .from('products')
                .update({ image_url: publicUrl })
                .ilike('name', `%${productNameSnippet}%`);

            if (dbError) console.error(`   ❌ Erro ao atualizar banco para "${productNameSnippet}":`, dbError.message);
            else console.log(`   🔄 Banco atualizado para produtos contendo: "${productNameSnippet}"`);
        } else {
            // Caso especial para os genericos 'refrigerante_lata'
            if (file === "refrigerante_lata_350_ml.jpg") {
                await supabase.from('products').update({ image_url: publicUrl }).in('name', ['Coca Cola Lata', 'Guaraná Lata']);
                console.log(`   🔄 Banco atualizado para Coca e Guaraná (Refrigerantes)`);
            }
        }
    }

    console.log("🏁 Processo finalizado.");
}

main();
