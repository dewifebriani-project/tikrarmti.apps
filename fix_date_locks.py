import re

with open("app/(protected)/perjalanan-saya/page.tsx", "r") as f:
    content = f.read()

# Fix Test Lisan
old_test_lisan = """            isTestAction: hasFormPendaftaran && !hasOral,
            isTestDisabled: !isRegistrationStarted,
            testUrl: `/seleksi/rekam-suara?batchId=${batchId}`"""
new_test_lisan = """            isTestAction: hasFormPendaftaran && !hasOral,
            isTestDisabled: !isRegistrationStarted || (isRegistrationDone && !registrationStatus.needsRevision),
            testUrl: `/seleksi/rekam-suara?batchId=${batchId}`"""

content = content.replace(old_test_lisan, new_test_lisan)

# Fix Test Tertulis
old_test_tertulis = """            isTestAction: hasFormPendaftaran && !isAlumnus && !hasWritten,
            isTestDisabled: !isReEnrollmentStarted,
            testUrl: `/seleksi/pilihan-ganda?batchId=${batchId}`"""
new_test_tertulis = """            isTestAction: hasFormPendaftaran && !isAlumnus && !hasWritten,
            isTestDisabled: !isReEnrollmentStarted || isReEnrollmentDoneByDate,
            testUrl: `/seleksi/pilihan-ganda?batchId=${batchId}`"""

content = content.replace(old_test_tertulis, new_test_tertulis)

with open("app/(protected)/perjalanan-saya/page.tsx", "w") as f:
    f.write(content)
