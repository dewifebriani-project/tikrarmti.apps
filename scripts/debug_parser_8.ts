import * as fs from 'fs';
import * as cheerio from 'cheerio';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');
const $ = cheerio.load(html);

const listItems = $('div[role="listitem"]');
let currentSection = "Unknown";

listItems.each((i, elem) => {
    const headingDiv = $(elem).find('div[role="heading"]');
    if (!headingDiv.length) return;
    
    let questionText = headingDiv.text().trim();
    questionText = questionText.replace(/\s*\*\s*$/, '').trim();

    if (!questionText) return;
    
    if (questionText.includes('Tebak Nama Surat')) { currentSection = "Tebak Nama Surat"; return; }
    if (questionText.includes('Tebak Ayat')) { currentSection = "Tebak Ayat"; return; }
    if (questionText.includes('Sambung Surat')) { currentSection = "Sambung Surat"; return; }
    if (questionText.includes('Tebak Awal Ayat')) { currentSection = "Tebak Awal Ayat"; return; }
    if (questionText.includes('Ayat Mutasyabihat')) { currentSection = "Ayat Mutasyabihat"; return; }
    if (questionText.includes('Tebak halaman')) { currentSection = "Tebak halaman"; return; }

    const radios = $(elem).find('div[role="radio"]');
    const checkboxes = $(elem).find('div[role="checkbox"]');
    
    if (currentSection === "Unknown" && (radios.length > 0 || checkboxes.length > 0)) {
        if (questionText.includes('Apakah antum thalibah MTI') || 
            questionText.includes('Bismillah..') || 
            questionText.includes('Apakah habibaty siap')) {
            // Intro, ignore
        } else {
            console.log("Unknown section question text:", questionText);
        }
    }
});
