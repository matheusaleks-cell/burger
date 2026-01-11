import fs from 'fs';
import path from 'path';

const dir = 'public/products/burguer_do_now_DEFINITIVO';

if (!fs.existsSync(dir)) {
    console.error("Directory not found:", dir);
    process.exit(1);
}

const files = fs.readdirSync(dir);

files.forEach(file => {
    // Replace: + with _, spaces with _, lowercase
    const newName = file
        .replace(/\+/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_') // collapse multiple underscores
        .toLowerCase();

    if (file !== newName) {
        const oldPath = path.join(dir, file);
        const newPath = path.join(dir, newName);
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: "${file}" -> "${newName}"`);
    }
});
