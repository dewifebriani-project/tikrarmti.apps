import re

with open("components/admin/tikrar/TikrarModals.tsx", "r") as f:
    content = f.read()

old_domisili = """                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Domisili</label>
                      <p className="text-sm font-bold text-gray-900">{reviewData.user?.provinsi || reviewData.domicile || '-'}</p>
                    </div>"""

new_domisili = """                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Domisili</label>
                      <p className="text-sm font-bold text-gray-900">{reviewData.user?.kota ? `${reviewData.user.kota}, ${reviewData.user.provinsi}` : reviewData.user?.provinsi || reviewData.domicile || '-'}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Tempat, Tanggal Lahir (Usia)</label>
                      <p className="text-sm font-bold text-gray-900">
                        {reviewData.user?.tempat_lahir || '-'}, {reviewData.user?.tanggal_lahir || reviewData.birth_date || '-'} 
                        {reviewData.age ? ` (${reviewData.age} tahun)` : ''}
                      </p>
                    </div>"""

content = content.replace(old_domisili, new_domisili)

with open("components/admin/tikrar/TikrarModals.tsx", "w") as f:
    f.write(content)
