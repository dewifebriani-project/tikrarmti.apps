import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseHtmlAndImport(htmlFilePath: string, targetJuz: number, targetPackage: string) {
  const html = fs.readFileSync(htmlFilePath, 'utf8');
  const $ = cheerio.load(html);

  const questions: any[] = [];
  let currentSection = 1;

  // First pass: find all correct answers marked with ✓
  const correctAnswersSet = new Set<string>();

  // Attempt 1: Extract from DOM (✓ mark)
  $('span').each((i, el) => {
    const text = $(el).text();
    if (text.includes('✓')) {
      const cleanText = text.replace('✓', '').trim();
      correctAnswersSet.add(cleanText);
    }
  });

  // Attempt 2: Extract from FB_PUBLIC_LOAD_DATA_ script tags (Edit mode HTML export)
  const scriptRegex = /\[1,\s*\[\[\"(.*?)\"\]\]\]/g;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    let cleanText = match[1].trim();
    cleanText = cleanText.replace(/\\n/g, ' ').replace(/\\t/g, ' ').replace(/\\"/g, '"').trim();
    correctAnswersSet.add(cleanText);
  }

  console.log(`Extracted ${correctAnswersSet.size} correct answer texts from HTML`);

  const listItems = $('div[role="listitem"]');
  console.log(`Found ${listItems.length} list items (potential questions)`);

  listItems.each((i, elem) => {
    const headingDiv = $(elem).find('div[role="heading"]');
    if (!headingDiv.length) return;
    
    let questionText = headingDiv.text().trim();
    questionText = questionText.replace(/\s*\*\s*$/, '').trim();

    if (!questionText) return;
    if (questionText.includes('Apakah antum thalibah MTI')) return;

    if (questionText.includes('Bismillah..') || questionText.includes('Apakah habibaty siap')) {
      return; // Skip intro question, already hardcoded in UI
    }

    let correctOpt = '';
    const options: string[] = [];
    $(elem).find('div[role="radio"]').each((j, radio) => {
      let optText = $(radio).attr('data-value');
      if (!optText) {
         optText = $(radio).text().trim();
      }
      if (optText) {
        // To compare, we should normalize spaces just in case
        const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
        
        const isCorrect = Array.from(correctAnswersSet).some(
          ans => normalize(ans) === normalize(optText) || normalize(optText).includes(normalize(ans))
        );
        const cleanText = optText.replace(/\*Correct answer/g, '').trim();
        options.push(cleanText);
        if (isCorrect) correctOpt = cleanText;
      }
    });
    
    if (options.length === 0) {
      $(elem).find('div[role="checkbox"]').each((j, checkbox) => {
        let optText = $(checkbox).attr('data-value');
        if (!optText) optText = $(checkbox).text().trim();
        if (optText) {
           const isCorrect = optText.includes('*Correct answer') || correctAnswerStrings.has(optText.replace(/\*Correct answer/g, '').trim());
           const cleanText = optText.replace(/\*Correct answer/g, '').trim();
           options.push(cleanText);
           if (isCorrect) correctOpt = cleanText;
        }
      });
    }

    if (options.length > 0) {
       let section = 1;
       if (options.some(opt => opt.toLowerCase().includes('halaman'))) {
           section = 2;
       }
       
       const descriptionDiv = $(elem).find('div[dir="auto"]').filter((_, el) => {
           return $(el).text().trim() !== questionText && !options.includes($(el).text().replace(/\*Correct answer/g, '').trim());
       });
       
       let fullQuestionText = questionText.replace(/\*Correct answer/g, '').trim();
       if (questionText === 'Terdapat pada halaman' || questionText === 'Tebak halaman') {
           let longestText = '';
           descriptionDiv.each((_, el) => {
               const txt = $(el).text().trim();
               if (txt.length > longestText.length && txt !== '*') {
                   longestText = txt;
               }
           });
           if (longestText) {
               fullQuestionText = longestText;
           }
       }

       questions.push({
           text: fullQuestionText,
           options: options,
           correctAnswer: correctOpt,
           section: section,
           isIntro: false
       });
    }
  });

  console.log(`Parsed ${questions.length} questions from HTML`);

  console.log(`Deleting existing Juz ${targetJuz}${targetPackage} questions...`);
  await supabase.from('exam_questions').delete().eq('juz_number', targetJuz).eq('question_package', targetPackage);

  // Enforce question limits based on package type
  if (targetPackage === 'A' && questions.length > 50) {
    console.log(`Package A should have exactly 50 questions. Truncating ${questions.length} down to 50.`);
    questions.length = 50;
  } else if (targetPackage === 'B' && questions.length > 100) {
    console.log(`Package B should have exactly 100 questions. Truncating ${questions.length} down to 100.`);
    questions.length = 100;
  }

  const rows = [];
  let qNum = 1;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    let correct = q.isIntro ? q.options[0] : (q.correctAnswer || (q.options.length > 0 ? q.options[0] : ''));
    
    // Create detailed options objects matching UI expectations
    const detailedOptions = q.options.map((optText: string) => ({
      text: optText,
      isCorrect: optText === correct
    }));

    const sectionTitle = q.isIntro ? 'Ketentuan Ujian' : (q.section === 1 ? 'Lanjutkan potongan ayat' : 'Tebak halaman');
    const points = Math.round(100 / questions.length);
    
    rows.push({
      id: uuidv4(),
      juz_number: targetJuz,
      question_package: targetPackage,
      section_number: q.section,
      section_title: sectionTitle,
      question_number: qNum,
      question_type: 'multiple_choice',
      question_text: q.text,
      options: detailedOptions,
      correct_answer: correct,
      points: points,
      is_active: true
    });
    
    qNum++;
  }
  
  console.log("Inserting new questions...");
  const { error } = await supabase.from('exam_questions').insert(rows);
  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully imported!");
  }
}

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error("Usage: npx tsx scripts/parse_html.ts <html_file> <juz_number> <package>");
  process.exit(1);
}

const htmlFile = path.resolve(args[0]);
const targetJuz = parseInt(args[1], 10);
const targetPackage = args[2];

parseHtmlAndImport(htmlFile, targetJuz, targetPackage).catch(console.error);
