/**
 * FIX PHONE NUMBER FORMAT
 * Convert +62085... to +6285... (remove leading 0 after +62)
 * This script fixes WhatsApp and Telegram phone numbers in users table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPhoneFormat() {
  console.log('=== FIX PHONE NUMBER FORMAT ===\n');

  try {
    // Step 1: Get all users with phone numbers that need fixing
    console.log('Step 1: Checking for phone numbers that need fixing...\n');

    const { data: usersToFix, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, whatsapp, telegram, phone')
      .or('whatsapp.like.+620%,telegram.like.+620%,phone.like.+620%');

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return;
    }

    if (!usersToFix || usersToFix.length === 0) {
      console.log('✅ No phone numbers need fixing. All formats are correct!\n');
      return;
    }

    console.log(`Found ${usersToFix.length} user(s) with phone numbers to fix:\n`);

    // Show preview of changes
    usersToFix.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No name'} (ID: ${user.id})`);

      if (user.whatsapp && user.whatsapp.startsWith('+620')) {
        const oldWa = user.whatsapp;
        const newWa = user.whatsapp.replace('+620', '+62');
        console.log(`   WhatsApp: ${oldWa} → ${newWa}`);
      }

      if (user.telegram && user.telegram.startsWith('+620')) {
        const oldTg = user.telegram;
        const newTg = user.telegram.replace('+620', '+62');
        console.log(`   Telegram: ${oldTg} → ${newTg}`);
      }

      if (user.phone && user.phone.startsWith('+620')) {
        const oldPh = user.phone;
        const newPh = user.phone.replace('+620', '+62');
        console.log(`   Phone:    ${oldPh} → ${newPh}`);
      }

      console.log('');
    });

    // Step 2: Update each user
    console.log('\nStep 2: Updating phone numbers...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToFix) {
      const updates = {};

      // Fix WhatsApp
      if (user.whatsapp && user.whatsapp.startsWith('+620')) {
        updates.whatsapp = user.whatsapp.replace('+620', '+62');
      }

      // Fix Telegram
      if (user.telegram && user.telegram.startsWith('+620')) {
        updates.telegram = user.telegram.replace('+620', '+62');
      }

      // Fix Phone
      if (user.phone && user.phone.startsWith('+620')) {
        updates.phone = user.phone.replace('+620', '+62');
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated ${user.full_name || user.id}`);
          successCount++;
        }
      }
    }

    // Step 3: Summary
    console.log('\n=== UPDATE SUMMARY ===');
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed to update: ${errorCount}`);
    console.log(`📊 Total processed: ${usersToFix.length}\n`);

    // Step 4: Verify the changes
    console.log('Step 3: Verifying changes...\n');

    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('id, full_name, whatsapp, telegram, phone')
      .or('whatsapp.like.+62%,telegram.like.+62%,phone.like.+62%')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (verifyError) {
      console.error('Error verifying changes:', verifyError);
      return;
    }

    console.log('Recent phone numbers (showing 20 most recent):');
    verifyData.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No name'}`);
      if (user.whatsapp) console.log(`   WhatsApp: ${user.whatsapp}`);
      if (user.telegram) console.log(`   Telegram: ${user.telegram}`);
      if (user.phone) console.log(`   Phone: ${user.phone}`);
      console.log('');
    });

    // Step 5: Check for any remaining issues
    console.log('\nStep 4: Checking for any remaining issues...\n');

    const { data: stillWrong, error: checkError } = await supabase
      .from('users')
      .select('id, full_name, whatsapp, telegram, phone')
      .or('whatsapp.like.+620%,telegram.like.+620%,phone.like.+620%');

    if (checkError) {
      console.error('Error checking for remaining issues:', checkError);
      return;
    }

    if (stillWrong && stillWrong.length > 0) {
      console.log(`⚠️ WARNING: Found ${stillWrong.length} user(s) still with wrong format:`);
      stillWrong.forEach((user) => {
        console.log(`- ${user.full_name || user.id}`);
        if (user.whatsapp && user.whatsapp.startsWith('+620')) {
          console.log(`  WhatsApp: ${user.whatsapp}`);
        }
        if (user.telegram && user.telegram.startsWith('+620')) {
          console.log(`  Telegram: ${user.telegram}`);
        }
        if (user.phone && user.phone.startsWith('+620')) {
          console.log(`  Phone: ${user.phone}`);
        }
      });
      console.log('');
    } else {
      console.log('✅ All phone numbers are now in correct format!\n');
    }

    // Step 6: Statistics
    console.log('=== FINAL STATISTICS ===\n');

    const { data: allUsers, error: statsError } = await supabase
      .from('users')
      .select('whatsapp, telegram, phone');

    if (!statsError && allUsers) {
      const stats = {
        whatsapp: {
          total: allUsers.filter(u => u.whatsapp && u.whatsapp !== '').length,
          correct: allUsers.filter(u => u.whatsapp && u.whatsapp.match(/^\+628[0-9]/)).length,
          wrong: allUsers.filter(u => u.whatsapp && u.whatsapp.startsWith('+620')).length,
        },
        telegram: {
          total: allUsers.filter(u => u.telegram && u.telegram !== '').length,
          correct: allUsers.filter(u => u.telegram && u.telegram.match(/^\+628[0-9]/)).length,
          wrong: allUsers.filter(u => u.telegram && u.telegram.startsWith('+620')).length,
        },
        phone: {
          total: allUsers.filter(u => u.phone && u.phone !== '').length,
          correct: allUsers.filter(u => u.phone && u.phone.match(/^\+628[0-9]/)).length,
          wrong: allUsers.filter(u => u.phone && u.phone.startsWith('+620')).length,
        },
      };

      console.log('WhatsApp:');
      console.log(`  Total numbers: ${stats.whatsapp.total}`);
      console.log(`  Correct format (+6285...): ${stats.whatsapp.correct}`);
      console.log(`  Wrong format (+62085...): ${stats.whatsapp.wrong}`);
      console.log('');

      console.log('Telegram:');
      console.log(`  Total numbers: ${stats.telegram.total}`);
      console.log(`  Correct format (+6285...): ${stats.telegram.correct}`);
      console.log(`  Wrong format (+62085...): ${stats.telegram.wrong}`);
      console.log('');

      console.log('Phone:');
      console.log(`  Total numbers: ${stats.phone.total}`);
      console.log(`  Correct format (+6285...): ${stats.phone.correct}`);
      console.log(`  Wrong format (+62085...): ${stats.phone.wrong}`);
      console.log('');
    }

    console.log('=== DONE ===\n');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixPhoneFormat();
