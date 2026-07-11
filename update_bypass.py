import re

with open('app/(protected)/perjalanan-saya/page.tsx', 'r') as f:
    content = f.read()

# Subphase 1: Test Tertulis
content = content.replace(
    'isTestDisabled: !isReEnrollmentStarted || isReEnrollmentDoneByDate,',
    'isTestDisabled: (!isReEnrollmentStarted || isReEnrollmentDoneByDate) && !isAdmin,'
)

# Subphase 2: Kuis Pemahaman Akad
content = content.replace(
    'isTestDisabled: !isReEnrollmentStarted || isReEnrollmentDoneByDate || (!isAlumnus && !(hasFormPendaftaran && hasWritten)),',
    'isTestDisabled: ((!isReEnrollmentStarted || isReEnrollmentDoneByDate) && !isAdmin) || (!isAlumnus && !(hasFormPendaftaran && hasWritten)),'
)

with open('app/(protected)/perjalanan-saya/page.tsx', 'w') as f:
    f.write(content)

