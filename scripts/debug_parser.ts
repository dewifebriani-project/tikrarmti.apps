import * as fs from 'fs';
import * as cheerio from 'cheerio';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');
const $ = cheerio.load(html);

const listItems = $('div[role="listitem"]');
console.log(`Found ${listItems.length} list items`);

let qCount = 0;
let skippedNoOptions = 0;
let skippedIntro = 0;
let skippedEmptyText = 0;
let emptyTexts: string[] = [];

listItems.each((i, elem) => {
    const headingDiv = $(elem).find('div[role="heading"]');
    if (!headingDiv.length) return;
    
    let questionText = headingDiv.text().trim();
    questionText = questionText.replace(/\s*\*\s*$/, '').trim();

    if (!questionText) {
        skippedEmptyText++;
        return;
    }
    
    if (questionText.includes('Apakah antum thalibah MTI') || 
        questionText.includes('Bismillah..') || 
        questionText.includes('Apakah habibaty siap')) {
        skippedIntro++;
        return;
    }

    const radios = $(elem).find('div[role="radio"]');
    const checkboxes = $(elem).find('div[role="checkbox"]');
    
    if (radios.length === 0 && checkboxes.length === 0) {
        skippedNoOptions++;
        emptyTexts.push(questionText);
        return;
    }
    
    qCount++;
});

console.log(`Valid questions: ${qCount}`);
console.log(`Skipped intro: ${skippedIntro}`);
console.log(`Skipped no options: ${skippedNoOptions}`);
console.log(`Skipped empty text: ${skippedEmptyText}`);

if (skippedNoOptions > 0) {
    console.log("Titles of items skipped because of no options:");
    emptyTexts.forEach(t => console.log(t));
}
