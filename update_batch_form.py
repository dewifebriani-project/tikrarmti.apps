import re

with open('components/admin/batch-program/BatchFormModal.tsx', 'r') as f:
    content = f.read()

# Add useMemo import if not present
if 'useMemo' not in content:
    content = content.replace("import { useState } from 'react';", "import { useState, useMemo } from 'react';")

# Add date warning logic before handleSubmit
warning_logic = """
  // Validate date sequence
  const dateWarnings = useMemo(() => {
    const warnings: string[] = [];
    const dates = [
      { name: 'Mulai Pendaftaran', value: formData.registration_start_date },
      { name: 'Selesai Pendaftaran', value: formData.registration_end_date },
      { name: 'Mulai Penilaian Seleksi', value: formData.selection_start_date },
      { name: 'Selesai Penilaian Seleksi', value: formData.selection_end_date },
      { name: 'Pengumuman Seleksi', value: formData.selection_result_date },
      { name: 'Mulai Daftar Ulang', value: formData.re_enrollment_date },
      { name: 'Opening Class', value: formData.opening_class_date },
    ];

    for (let i = 0; i < dates.length - 1; i++) {
      const current = dates[i];
      const next = dates[i + 1];
      if (current.value && next.value) {
        if (new Date(current.value) > new Date(next.value)) {
          warnings.push(`Tanggal ${current.name} tidak boleh lebih lambat dari ${next.name}.`);
        }
      }
    }
    return warnings;
  }, [formData]);

  const handleSubmit"""

content = content.replace('  const handleSubmit', warning_logic)

# Add alert UI above the submit button.
# Let's find where the form buttons are. Usually at the bottom.
ui_logic = """
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-3xl mt-auto">
            {dateWarnings.length > 0 && (
              <div className="flex-1 bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg border border-yellow-200">
                <p className="font-bold mb-1">Perhatian (Urutan Tanggal):</p>
                <ul className="list-disc list-inside">
                  {dateWarnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
"""

# Let's check what the bottom div actually looks like.
