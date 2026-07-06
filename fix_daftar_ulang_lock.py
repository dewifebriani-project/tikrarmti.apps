import re

with open("app/(protected)/daftar-ulang/page.tsx", "r") as f:
    content = f.read()

# I will insert the check after `if (!selectedRegistration)` block

old_block = """        if (!selectedRegistration) {
          console.log('[Daftar Ulang] No selected thalibah registration found')
          toast.error('Tidak ditemukan data pendaftaran thalibah yang lolos seleksi. Daftar ulang hanya untuk thalibah yang lolos seleksi.')
          router.push('/perjalanan-saya')
          return
        }

        // Verify if selection result date has been reached"""

new_block = """        if (!selectedRegistration) {
          console.log('[Daftar Ulang] No selected thalibah registration found')
          toast.error('Tidak ditemukan data pendaftaran thalibah yang lolos seleksi. Daftar ulang hanya untuk thalibah yang lolos seleksi.')
          router.push('/perjalanan-saya')
          return
        }

        // Check if user has taken the written test (unless they are alumni)
        let isAlumnus = false;
        try {
          const alumniRes = await fetch('/api/alumni/testimonial/my');
          if (alumniRes.ok) {
            const alumniData = await alumniRes.json();
            isAlumnus = alumniData?.isAlumni === true;
          }
        } catch (e) {
          console.error('Error fetching alumni status:', e);
        }

        const hasWritten = !!(
          selectedRegistration.written_quiz_submitted_at || 
          selectedRegistration.written_submitted_at || 
          selectedRegistration.exam_score != null || 
          selectedRegistration.written_quiz_score != null
        );

        if (!hasWritten && !isAlumnus) {
          toast.error('Anda harus menyelesaikan Test Tertulis terlebih dahulu sebelum mengisi formulir Daftar Ulang.');
          // Redirect them to the test or user journey
          const batchParam = selectedRegistration.batch_id ? `?batchId=${selectedRegistration.batch_id}` : '';
          router.push(`/seleksi/pilihan-ganda${batchParam}`);
          return
        }

        // Verify if selection result date has been reached"""

content = content.replace(old_block, new_block)

with open("app/(protected)/daftar-ulang/page.tsx", "w") as f:
    f.write(content)
