import * as fs from 'fs';

const htmlFilePath = "docs/bank-soal/Ujian Juz 28B MTI Batch 2 - Google Forms.html";
const html = fs.readFileSync(htmlFilePath, 'utf8');

const scriptMatch = html.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.*\]);/);
if (scriptMatch) {
    const data = JSON.parse(scriptMatch[1]);
    const formItems = data[1][1];
    
    let mcCount = 0;
    
    formItems.forEach((item: any) => {
        if (!item || !item[3]) return;
        
        // 2: Multiple Choice, 3: Dropdown, 4: Checkboxes
        if (item[3] === 2 || item[3] === 3 || item[3] === 4 || item[3] === 7) {
            mcCount++;
        }
    });

    console.log(`Found ${mcCount} questions with choices in JSON.`);
} else {
    console.log("Not found.");
}
