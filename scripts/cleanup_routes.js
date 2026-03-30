const fs = require('fs');
const path = require('path');

const root = 'd:/01_PROJECTS/tikrarmti.apps';
const pathsToDelete = [
  path.join(root, 'app/auth/callback/page.tsx'),
  path.join(root, 'app/lengkapi-profile/ProfileForm.tsx'),
  path.join(root, 'app/(protected)/lengkapi-profile/page.tsx')
];

pathsToDelete.forEach(p => {
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
      console.log(`Successfully deleted: ${p}`);
    } catch (e) {
      console.error(`Error deleting ${p}: ${e.message}`);
    }
  } else {
    console.log(`Path does not exist: ${p}`);
  }
});

const dirToDelete = path.join(root, 'app/(protected)/lengkapi-profile');
if (fs.existsSync(dirToDelete)) {
  try {
    fs.rmSync(dirToDelete, { recursive: true, force: true });
    console.log(`Successfully deleted directory: ${dirToDelete}`);
  } catch (e) {
    console.error(`Error deleting directory ${dirToDelete}: ${e.message}`);
  }
}
