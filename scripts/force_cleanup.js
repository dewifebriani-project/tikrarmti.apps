const fs = require('fs');
const path = require('path');

const projectRoot = 'd:/01_PROJECTS/tikrarmti.apps';

const absolutePaths = [
  path.join(projectRoot, 'app/auth/callback/page.tsx'),
  path.join(projectRoot, 'app/lengkapi-profile/ProfileForm.tsx'),
  path.join(projectRoot, 'app/(protected)/lengkapi-profile/page.tsx')
];

absolutePaths.forEach(p => {
  const normalizedPath = p.replace(/\\/g, '/');
  if (fs.existsSync(normalizedPath)) {
    try {
      fs.unlinkSync(normalizedPath);
      console.log(`DELETED: ${normalizedPath}`);
    } catch (e) {
      console.log(`FAILED TO DELETE: ${normalizedPath} - ${e.message}`);
    }
  } else {
    console.log(`NOT FOUND: ${normalizedPath}`);
  }
});

const dirPath = path.join(projectRoot, 'app/(protected)/lengkapi-profile').replace(/\\/g, '/');
if (fs.existsSync(dirPath)) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`DELETED DIR: ${dirPath}`);
  } catch (e) {
    console.log(`FAILED TO DELETE DIR: ${dirPath} - ${e.message}`);
  }
}
