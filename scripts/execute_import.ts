import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sqlFile = path.join(__dirname, 'juz_1a_html_import.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  console.log("Parsing queries...");
  const queries = sql.split(';')
    .map(q => q.trim())
    .filter(q => q.length > 0 && !q.startsWith('--') && q !== 'BEGIN' && q !== 'COMMIT');

  console.log(`Found ${queries.length} queries to execute.`);

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    // Extract values
    const match = query.match(/VALUES \('([^']+)', ([0-9]+), '([^']+)', ([0-9]+), '([^']+)', ([0-9]+), '([^']+)', '((?:[^']|'')*)', '((?:[^']|'')*)'::jsonb, '((?:[^']|'')*)', (true|false)\)/);
    
    if (match) {
      const [_, id, juz_number, question_package, section_number, section_title, question_number, question_type, question_text, options, correct_answer, is_active] = match;
      
      const parsedOptions = JSON.parse(options.replace(/''/g, "'"));
      const parsedText = question_text.replace(/''/g, "'");
      const parsedCorrect = correct_answer.replace(/''/g, "'");
      
      const { error } = await supabaseAdmin.from('exam_questions').insert({
        id,
        juz_number: parseInt(juz_number),
        question_package,
        section_number: parseInt(section_number),
        section_title,
        question_number: parseInt(question_number),
        question_type,
        question_text: parsedText,
        options: parsedOptions,
        correct_answer: parsedCorrect,
        is_active: is_active === 'true'
      });
      
      if (error) {
        console.error(`Error inserting question ${question_number}:`, error);
      } else {
        console.log(`Successfully inserted question ${question_number} (Section ${section_number})`);
      }
    } else {
      console.warn("Could not parse query:", query.substring(0, 50) + "...");
    }
  }
  
  console.log("Import complete!");
}

main();
