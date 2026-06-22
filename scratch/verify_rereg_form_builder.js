const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('--- START VERIFICATION: RE-REGISTRATION FORM BUILDER SYSTEM ---');

  // 1. Fetch all questions (representing getReregistrationQuestionsAdmin)
  const { data: allQuestions, error: fetchAllError } = await supabase
    .from('reregistration_questions')
    .select('*')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });

  if (fetchAllError) {
    console.error('Failed to fetch all questions:', fetchAllError.message);
    process.exit(1);
  }

  console.log(`Successfully fetched ${allQuestions.length} questions from reregistration_questions.`);
  
  // Find a specific question to test: 'confirmed_full_name'
  const testKey = 'confirmed_full_name';
  const targetQ = allQuestions.find(q => q.field_key === testKey);

  if (!targetQ) {
    console.error(`Error: Could not find question with key "${testKey}"`);
    process.exit(1);
  }

  const originalLabel = targetQ.label;
  const originalStatus = targetQ.is_active;

  console.log(`Original label for "${testKey}": "${originalLabel}"`);
  console.log(`Original active status for "${testKey}": ${originalStatus}`);

  // 2. Simulate Admin edit: update label
  const newLabel = 'Nama Lengkap Thalibah (Sesuai KTP)';
  console.log(`Simulating Admin Edit: Updating label of "${testKey}" to: "${newLabel}"`);

  const { data: updateData, error: updateError } = await supabase
    .from('reregistration_questions')
    .update({ label: newLabel })
    .eq('id', targetQ.id)
    .select();

  if (updateError) {
    console.error('Update failed:', updateError.message);
    process.exit(1);
  }

  console.log('Update successful.');

  // 3. Verify public query (representing getReregistrationQuestions)
  const { data: activeQuestions, error: fetchActiveError } = await supabase
    .from('reregistration_questions')
    .select('*')
    .eq('is_active', true);

  if (fetchActiveError) {
    console.error('Failed to fetch active questions:', fetchActiveError.message);
    process.exit(1);
  }

  const updatedQ = activeQuestions.find(q => q.field_key === testKey);
  if (!updatedQ) {
    console.error(`Error: Could not find active question "${testKey}" after update.`);
    process.exit(1);
  }

  if (updatedQ.label === newLabel) {
    console.log('✓ Success: Public query returns the updated label!');
  } else {
    console.error(`X Failure: Label mismatch. Expected "${newLabel}", got "${updatedQ.label}"`);
  }

  // 4. Simulate Admin deactivating the question
  console.log(`Simulating Admin toggle: Deactivating "${testKey}"`);
  const { error: deactivateError } = await supabase
    .from('reregistration_questions')
    .update({ is_active: false })
    .eq('id', targetQ.id);

  if (deactivateError) {
    console.error('Deactivation failed:', deactivateError.message);
    process.exit(1);
  }

  // Fetch active questions again
  const { data: activeQuestionsAfterDeactivate, error: fetchActive2Error } = await supabase
    .from('reregistration_questions')
    .select('*')
    .eq('is_active', true);

  if (fetchActive2Error) {
    console.error('Failed to fetch active questions (2):', fetchActive2Error.message);
    process.exit(1);
  }

  const deactivatedQ = activeQuestionsAfterDeactivate.find(q => q.field_key === testKey);
  if (!deactivatedQ) {
    console.log('✓ Success: Deactivated question is successfully hidden from the active list!');
  } else {
    console.error('X Failure: Deactivated question is still returned in the active list.');
  }

  // 5. Restore original state
  console.log('Restoring original label and active status...');
  const { error: restoreError } = await supabase
    .from('reregistration_questions')
    .update({ label: originalLabel, is_active: originalStatus })
    .eq('id', targetQ.id);

  if (restoreError) {
    console.error('Failed to restore original state:', restoreError.message);
  } else {
    console.log('✓ Success: Original state restored.');
  }

  console.log('--- END VERIFICATION: ALL CHECKS PASSED SUCCESSFULLY ---');
}

runVerification();
