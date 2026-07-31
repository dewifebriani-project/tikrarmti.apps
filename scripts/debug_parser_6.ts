import * as fs from 'fs';
import * as cheerio from 'cheerio';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');
const $ = cheerio.load(html);

const listItems = $('div[role="listitem"]');
listItems.each((i, elem) => {
    const headingDiv = $(elem).find('div[role="heading"]');
    if (!headingDiv.length) return;
    
    let questionText = headingDiv.text().trim();
    if (questionText.includes('Apakah antum thalibah MTI') || 
        questionText.includes('Bismillah..') || 
        questionText.includes('Apakah habibaty siap')) {
        console.log("Skipped intro text:", questionText);
    }
});
