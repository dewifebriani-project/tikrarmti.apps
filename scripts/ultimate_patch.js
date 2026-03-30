const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '..', 'app', '(protected)', 'jurnal-harian', 'components', 'JurnalEntryForm.tsx');
console.log('Target:', target);

if (!fs.existsSync(target)) {
    console.error('File not found!');
    process.exit(1);
}

let content = fs.readFileSync(target, 'utf8');

const oldStr = 'setGhaibCategory(cat.id as any)';
const newStr = `// RESET: Clear data when switching categories
                                      setFormData(f => ({ ...f, tikrar_bi_al_ghaib_type: null, tikrar_bi_al_ghaib_subtype: null, tikrar_bi_al_ghaib_20x_multi: [] }))
                                      setGhaibCategory(cat.id as any)`;

if (content.includes(oldStr)) {
    content = content.split(oldStr).join(newStr);
    fs.writeFileSync(target, content);
    console.log('✅ Successfully patched JurnalEntryForm.tsx');
} else {
    console.error('Target string not found in file!');
    process.exit(1);
}
