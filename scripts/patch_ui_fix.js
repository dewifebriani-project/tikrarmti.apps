const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('app/(protected)/jurnal-harian/components/JurnalEntryForm.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Patch onClick handler to clear state
const oldOnClick = `                                    if (cat.id === 'tarteel') {
                                      handleGhaibSelection('tarteel_40')
                                      setShowGhaibMenu(false)
                                      setGhaibCategory(null)
                                    } else {
                                      setGhaibCategory(cat.id as any)
                                    }`;

const newOnClick = `                                    if (cat.id === 'tarteel') {
                                      handleGhaibSelection('tarteel_40')
                                      setShowGhaibMenu(false)
                                      setGhaibCategory(null)
                                    } else {
                                      // RESET: Clear data when switching categories
                                      setFormData(f => ({ ...f, tikrar_bi_al_ghaib_type: null, tikrar_bi_al_ghaib_subtype: null, tikrar_bi_al_ghaib_20x_multi: [] }))
                                      setGhaibCategory(cat.id as any)
                                    }`;

if (content.includes(oldOnClick)) {
    content = content.replace(oldOnClick, newOnClick);
} else {
    console.warn('Warning: oldOnClick not found EXACTLY. Trying fuzzy match...');
    // Simple regex for onClick block
    content = content.replace(/if\s*\(cat\.id\s*===\s*'tarteel'\)\s*\{[\s\S]*?else\s*\{[\s\S]*?setGhaibCategory\(cat\.id\s*as\s*any\);?\s*\}/, 
        `if (cat.id === 'tarteel') {
                                      handleGhaibSelection('tarteel_40')
                                      setShowGhaibMenu(false)
                                      setGhaibCategory(null)
                                    } else {
                                      // RESET: Clear data when switching
                                      setFormData(f => ({ ...f, tikrar_bi_al_ghaib_type: null, tikrar_bi_al_ghaib_subtype: null, tikrar_bi_al_ghaib_20x_multi: [] }))
                                      setGhaibCategory(cat.id as any)
                                    }`);
}

// 2. Patch highlights to be mutually exclusive
const oldHighlight = `ghaibCategory === cat.id || (cat.id === 'tarteel' && formData.tikrar_bi_al_ghaib_type === 'tarteel_40')`;
const newHighlight = `ghaibCategory === cat.id || (cat.id === 'tarteel' && !ghaibCategory && formData.tikrar_bi_al_ghaib_type === 'tarteel_40')`;

content = content.split(oldHighlight).join(newHighlight);

fs.writeFileSync(targetFile, content);
console.log('✅ JurnalEntryForm.tsx patched successfully.');
