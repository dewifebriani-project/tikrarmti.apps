const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '..', 'app', '(protected)', 'jurnal-harian', 'components', 'JurnalEntryForm.tsx');
let content = fs.readFileSync(target, 'utf8');

// Use a very specific but indentation-neutral approach
const findStr = 'setGhaibCategory(cat.id as any)';
const replaceStr = `// RESET: Clear previous selection when switching categories
                                      setFormData(f => ({ ...f, tikrar_bi_al_ghaib_type: null, tikrar_bi_al_ghaib_subtype: null, tikrar_bi_al_ghaib_20x_multi: [] }))
                                      setGhaibCategory(cat.id as any)`;

if (content.includes(findStr)) {
    content = content.replace(findStr, replaceStr);
    fs.writeFileSync(target, content);
    console.log('✅ JurnalEntryForm.tsx updated successfully.');
} else {
    console.warn('Target string not found!');
    process.exit(1);
}
