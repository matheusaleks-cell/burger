const fs = require('fs');
const path = require('path');

// Find the HTML file
const dir = __dirname;
const files = fs.readdirSync(dir);
const htmlFile = files.find(f => f.includes('iFood.html') || f.includes('ifood.html'));

if (!htmlFile) {
    console.error("HTML file not found!");
    process.exit(1);
}

const content = fs.readFileSync(path.join(dir, htmlFile), 'utf8');

// Regex to find __NEXT_DATA__

let menuData = [];

// Strategy 1: Attempt to find ld+json with Restaurant data
const ldJsonRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let ldMatch;
while ((ldMatch = ldJsonRegex.exec(content)) !== null) {
    try {
        const json = JSON.parse(ldMatch[1]);
        // Check if it's the Restaurant schema
        if (json['@type'] === 'Restaurant' && json.makesOffer) {
            console.log("Found Restaurant ld+json data!");

            // We'll treat this as a "General" category if we can't find others, 
            // or just a raw list of items.
            const items = json.makesOffer.map(offer => ({
                name: offer.itemOffered.name,
                description: offer.itemOffered.description,
                price: offer.priceSpecification ? offer.priceSpecification.price : 0,
                image_url: json.image ? json.image[0] : null // Fallback image
            }));

            menuData.push({
                category: "Geral (Importado)",
                items: items
            });
        }
    } catch (e) {
        // Ignore parse errors in other ld+json blocks
    }
}

// Strategy 2: Regex for categories and items in HTML (Brittle but tries to get structure)
// We look for patterns like: class="...menu-group-list__title...">CATEGORY NAME...
// This is hard to coordinate with items without a DOM parser.
// For now, sticking to ld+json is safer for "Importing products". 
// We can let the user organize them later, or use the "Geral" category.


if (menuData.length > 0) {
    console.log("Successfully extracted data.");
    fs.writeFileSync('ifood_data.json', JSON.stringify(menuData, null, 2));
    console.log("Saved to ifood_data.json");
} else {

    console.error("Could not find menu data in ld+json or __NEXT_DATA__");

    // Fallback: Try regexing for dish-card__description if ld+json failed
    // Debug: Count prices
    const priceMatches = [...content.matchAll(/R\$\s*[\d,]+/g)];
    console.log(`Found ${priceMatches.length} price occurrences in HTML text.`);

    const matches = [...content.matchAll(/class="[^"]*product-card__description[^"]*">(.*?)<\/span>/g)];
    if (matches.length > 0) {
        const items = matches.map(m => ({ name: m[1], price: 0, description: "" }));
        menuData.push({ category: "Scraped Items (Regex)", items });
    } else {
        // Try finding any text that looks like a product name near a price?
        // This is getting desperate. Let's just trust ld+json for now if regex fails.
        if (menuData.length === 0) console.error("No data found via regex either.");
    }

}


