const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('app/(protected)/jurnal-harian/components/JurnalEntryForm.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Fix the highlights (just in case they weren't all caught)
const oldHighlight = `ghaibCategory === cat.id || (cat.id === 'tarteel' && formData.tikrar_bi_al_ghaib_type === 'tarteel_40')`;
const newHighlight = `ghaibCategory === cat.id || (cat.id === 'tarteel' && !ghaibCategory && formData.tikrar_bi_al_ghaib_type === 'tarteel_40')`;
content = content.split(oldHighlight).join(newHighlight);

// 2. Fix the onClick logic - use a very loose match for spaces
const oldOnClickRegex = /} else \{\s+setGhaibCategory\(cat\.id as any\)\s+}/;
const newOnClick = `} else {
                                      // RESET: Clear data when switching
                                      setFormData(f => ({ ...f, tikrar_bi_al_ghaib_type: null, tikrar_bi_al_ghaib_subtype: null, tikrar_bi_al_ghaib_20x_multi: [] }))
                                      setGhaibCategory(cat.id as any)
                                    }`;

if (oldOnClickRegex.test(content)) {
    content = content.replace(oldOnClickRegex, newOnClick);
} else {
    // If exact regex fails, try a simpler block replacement
    console.warn('Regex failed, trying direct replace for setGhaibCategory');
    content = content.replace('setGhaibCategory(cat.id as any)', `// RESET: Clear data when switching
                                      setFormData(f => ({ ...f, tikrar_bi_al_ghaib_type: null, tikrar_bi_al_ghaib_subtype: null, tikrar_bi_al_ghaib_20x_multi: [] }))
                                      setGhaibCategory(cat.id as any)`);
}

fs.writeFileSync(targetFile, content);
console.log('✅ UI Fix Patched successfully.');
