import * as fs from 'fs';
const content = fs.readFileSync('app/api/daftar-ulang/route.ts', 'utf-8');
console.log(content.substring(0, 1500));
