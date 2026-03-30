@echo off
echo 🚀 STARTING NUCLEAR CLEANUP AND DB FIX...

echo 1. Removing Duplicate Routes from Git Index...
git rm -f "app\auth\callback\page.tsx"
git rm -f "app\lengkapi-profile\ProfileForm.tsx"
git rm -rf "app\(protected)\lengkapi-profile"

echo 2. Forcing File Deletion from Disk...
del /F /S /Q "d:\01_PROJECTS\tikrarmti.apps\app\auth\callback\page.tsx"
del /F /S /Q "d:\01_PROJECTS\tikrarmti.apps\app\lengkapi-profile\ProfileForm.tsx"
rd /S /Q "d:\01_PROJECTS\tikrarmti.apps\app\(protected)\lengkapi-profile"

echo 3. Applying Database Migration...
node d:\01_PROJECTS\tikrarmti.apps\scripts\apply-db-fix.ts

echo 4. Final Git Status Check...
git status

echo --- PROCESS COMPLETE ---
