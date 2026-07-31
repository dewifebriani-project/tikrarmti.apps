import * as fs from 'fs';
import * as cheerio from 'cheerio';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');
const $ = cheerio.load(html);

const listItems = $('div[role="listitem"]');

let missingHeadingCount = 0;
listItems.each((i, elem) => {
    const headingDiv = $(elem).find('div[role="heading"]');
    if (!headingDiv.length) {
        const radios = $(elem).find('div[role="radio"]');
        if (radios.length > 0) {
            missingHeadingCount++;
            console.log("Found radio buttons without heading. Text:", $(elem).text().substring(0, 100));
        }
    }
});
console.log(`Missing heading count: ${missingHeadingCount}`);
