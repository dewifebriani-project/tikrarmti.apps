import re

with open('components/admin/batch-program/BatchFormModal.tsx', 'r') as f:
    content = f.read()

warning_ui = """          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between gap-3">
            <div className="flex-1">
              {dateWarnings.length > 0 && (
                <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg border border-yellow-200 mr-4">
                  <p className="font-bold mb-1">Perhatian (Urutan Tanggal Kurang Pas):</p>
                  <ul className="list-disc list-inside">
                    {dateWarnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
"""

content = content.replace(
    '          {/* Footer */}\n          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-3">',
    warning_ui
)

content = content.replace(
    '              {saving ? \'Menyimpan...\' : \'Simpan Batch\'}\n            </button>\n          </div>',
    '              {saving ? \'Menyimpan...\' : \'Simpan Batch\'}\n            </button>\n            </div>\n          </div>'
)


with open('components/admin/batch-program/BatchFormModal.tsx', 'w') as f:
    f.write(content)

