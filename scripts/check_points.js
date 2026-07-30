const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('docs/bank-soal/Ujian Juz 1A MTI Batch 2 - Google Forms.htm', 'utf8');
const $ = cheerio.load(html);
const listItems = $('div[role="listitem"]');
listItems.each((i, elem) => {
    const text = $(elem).text();
    const match = text.match(/(\d+)\s*poin/i);
    if (match) {
        console.log(`Question ${i}: ${match[1]} poins`);
    } else {
        console.log(`Question ${i}: no poins found`);
    }
});
