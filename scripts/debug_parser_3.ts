import * as fs from 'fs';
import * as cheerio from 'cheerio';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');

// The string "*Correct answer" appears next to the correct option.
// Let's count how many occurrences of "*Correct answer" there are.
const count = (html.match(/\*Correct answer/g) || []).length;
console.log(`Found ${count} occurrences of '*Correct answer'`);

// Also find all divs with role="heading" and print them
const $ = cheerio.load(html);
let headingCount = 0;
$('div[role="heading"]').each((i, el) => {
    headingCount++;
    // print the first 30 chars
    // console.log($(el).text().trim().substring(0, 30));
});
console.log(`Found ${headingCount} headings`);
