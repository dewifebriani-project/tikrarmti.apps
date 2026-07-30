import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  console.log("Deleting existing Juz 1A questions...");
  await client.query("DELETE FROM public.exam_questions WHERE juz_number = 1 AND question_package = 'A';");
  
  console.log("Reading SQL file...");
  const sqlFile = path.join(__dirname, 'juz_1a_html_import.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log("Executing SQL...");
  await client.query(sql);
  
  console.log("Done.");
  await client.end();
}

run();
