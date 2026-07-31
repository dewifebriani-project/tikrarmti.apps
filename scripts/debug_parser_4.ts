import * as fs from 'fs';
import * as cheerio from 'cheerio';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');

const $ = cheerio.load(html);
let headings: string[] = [];
$('div[role="heading"]').each((i, el) => {
    headings.push($(el).text().trim());
});

fs.writeFileSync('scratch/headings.txt', headings.join('\n'));
console.log(`Wrote ${headings.length} headings to scratch/headings.txt`);
