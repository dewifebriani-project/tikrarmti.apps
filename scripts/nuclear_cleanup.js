const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const root = 'd:/01_PROJECTS/tikrarmti.apps';
const targets = [
  'app/auth/callback/page.tsx',
  'app/lengkapi-profile/ProfileForm.tsx', // Redundant
  'app/(protected)/lengkapi-profile'
];

console.log('🚀 NUCLEAR CLEANUP START...');

targets.forEach(target => {
  const full = path.join(root, target).replace(/\\/g, '/');
  if (fs.existsSync(full)) {
    try {
      console.log(`🗑 Removing from Git index: ${target}`);
      execSync(`git rm -rf "${target}"`, { cwd: root, stdio: 'inherit' });
    } catch (e) {
      console.warn(`⚠️ git rm failed for ${target}, forcing FS delete: ${e.message}`);
    }
    
    // Force FS delete if it wasn't removed by git rm
    if (fs.existsSync(full)) {
      try {
        const stats = fs.lstatSync(full);
        if (stats.isDirectory()) {
          fs.rmSync(full, { recursive: true, force: true });
        } else {
          fs.unlinkSync(full);
        }
        console.log(`✅ FS DELETE: ${target}`);
      } catch (e2) {
        console.error(`❌ ERROR DELETING ${target}: ${e2.message}`);
      }
    }
  } else {
    console.log(`⏭ Skip (not found): ${target}`);
  }
});

console.log('--- CLEANUP COMPLETE ---');
console.log('Current Git Status:');
try {
  execSync('git status', { cwd: root, stdio: 'inherit' });
} catch (e) {}
