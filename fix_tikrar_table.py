import re

with open("components/admin/tikrar/TikrarTable.tsx", "r") as f:
    content = f.read()

# 1. Add header
old_headers = """              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Readiness</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Juz & Slot</th>"""

new_headers = """              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Readiness</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Infaq / Kader</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/75 border-b border-gray-100 select-none">Juz & Slot</th>"""

content = content.replace(old_headers, new_headers)

# 2. Add cell
old_cell = """                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1.5 max-w-[200px]">"""

new_cell = """                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1">
                    {t.ready_for_team === 'Ya' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                        <Users className="w-3 h-3" /> Siap Kader
                      </span>
                    ) : t.ready_for_team === 'Belum' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
                        <Users className="w-3 h-3" /> Belum Siap
                      </span>
                    ) : null}
                    
                    {t.infaq_amount && (
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="font-semibold text-gray-700">Infaq:</span><br/>
                        {t.infaq_amount}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 align-top">
                  <div className="flex flex-col gap-1.5 max-w-[200px]">"""

content = content.replace(old_cell, new_cell)

# Adjust colspan for empty state
content = content.replace("colSpan={7}", "colSpan={8}")

# Make sure Users icon is imported
if "Users" not in content[:500]:
    content = content.replace("import { CheckCircle2, XCircle", "import { CheckCircle2, XCircle, Users")

with open("components/admin/tikrar/TikrarTable.tsx", "w") as f:
    f.write(content)
