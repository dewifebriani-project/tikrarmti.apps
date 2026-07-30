import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('docs/bank-soal/Ujian Juz 1A MTI Batch 2 - Google Forms.htm', 'utf8');
const $ = cheerio.load(html);

const correctAnswers: string[] = [];
$('div').each((i, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('✓ ')) {
        correctAnswers.push(text.replace('✓ ', '').trim());
    }
});
console.log(`Found ${correctAnswers.length} correct answers`);
if (correctAnswers.length > 0) {
    console.log(correctAnswers.slice(0, 5));
}
