const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = 'd:/01_PROJECTS/tikrarmti.apps';
const filesToDelete = [
  'app/auth/callback/page.tsx',
  'app/lengkapi-profile/ProfileForm.tsx',
  'app/(protected)/lengkapi-profile/page.tsx'
];

const foldersToDelete = [
  'app/(protected)/lengkapi-profile'
];

// 1. Try Git RM first (to update index)
filesToDelete.forEach(f => {
  const fullPath = path.join(root, f);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`git rm -f "${f}"`, { cwd: root, stdio: 'inherit' });
      console.log(`GIT RM Success: ${f}`);
    } catch (e) {
      console.log(`GIT RM Failed: ${f} - ${e.message}`);
    }
  }
});

foldersToDelete.forEach(f => {
  const fullPath = path.join(root, f);
  if (fs.existsSync(fullPath)) {
    try {
      execSync(`git rm -rf "${f}"`, { cwd: root, stdio: 'inherit' });
      console.log(`GIT RM DIR Success: ${f}`);
    } catch (e) {
      console.log(`GIT RM DIR Failed: ${f} - ${e.message}`);
    }
  }
});

// 2. Fallback to File System delete (in case git rm failed or partially worked)
filesToDelete.forEach(f => {
  const fullPath = path.join(root, f);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`FS UNLINK Success: ${f}`);
    } catch (e) {
      console.log(`FS UNLINK Failed: ${f} - ${e.message}`);
    }
  }
});

foldersToDelete.forEach(f => {
  const fullPath = path.join(root, f);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`FS RM Success: ${f}`);
    } catch (e) {
      console.log(`FS RM Failed: ${f} - ${e.message}`);
    }
  }
});
