const preferred_juz = '1, 27, 28, 29, 30';
const juzList = preferred_juz.split(',').map(s => s.trim()).filter(Boolean);
console.log(juzList);
