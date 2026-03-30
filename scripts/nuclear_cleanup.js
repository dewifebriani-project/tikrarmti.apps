const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const projectRoot = 'd:/01_PROJECTS/tikrarmti.apps';
const targets = [
  'app/auth/callback/page.tsx',
  'app/lengkapi-profile/ProfileForm.tsx',
  'app/(protected)/lengkapi-profile'
];

console.log('--- START NUCLEAR CLEANUP ---');

targets.forEach(targetPath => {
  const fullPath = path.join(projectRoot, targetPath).replace(/\\/g, '/');
  
  if (!fs.existsSync(fullPath)) {
    console.log(`[PASS] Not found on disk: ${targetPath}`);
    // Still try git rm in case it's only in index
  }

  // 1. Attempt Git RM
  try {
    execSync(`git rm -rf "${targetPath}"`, { cwd: projectRoot, stdio: 'inherit' });
    console.log(`[GOT] git rm success: ${targetPath}`);
  } catch (e) {
    console.log(`[INFO] git rm failed/skipped: ${targetPath}`);
  }

  // 2. Force FS Delete if still exists
  if (fs.existsSync(fullPath)) {
    try {
      const stats = fs.lstatSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`[FORCE] Directory deleted: ${targetPath}`);
      } else {
        fs.unlinkSync(fullPath);
        console.log(`[FORCE] File deleted: ${targetPath}`);
      }
    } catch (e) {
      console.error(`[ERROR] Could not delete ${targetPath}: ${e.message}`);
    }
  }
});

console.log('--- CLEANUP COMPLETE ---');
console.log('Current Git Status:');
try {
  execSync('git status', { cwd: projectRoot, stdio: 'inherit' });
} catch (e) {}
