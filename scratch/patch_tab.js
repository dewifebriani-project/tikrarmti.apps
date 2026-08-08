const fs = require('fs');
const path = 'components/AdminJadwalHarianTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Pencil, X to imports
content = content.replace('Image as ImageIcon', 'Image as ImageIcon, Pencil, X');

// 2. Add zoom_link_id to select
content = content.replace('zoom_link,', 'zoom_link,\n          zoom_link_id,');

// 3. Add states
content = content.replace('const [activeBatchName, setActiveBatchName] = useState<string>(\'\');', 
  `const [activeBatchName, setActiveBatchName] = useState<string>('');
  const [zoomLinks, setZoomLinks] = useState<any[]>([]);
  const [editingHalaqah, setEditingHalaqah] = useState<any>(null);
  const [editForm, setEditForm] = useState({ start_time: '', end_time: '', zoom_link_id: '' });
  const [isSaving, setIsSaving] = useState(false);`);

// 4. Add zoomLinks fetch
content = content.replace('setActiveBatchName(batch.name);', 
  `setActiveBatchName(batch.name);
      const { data: links } = await supabase.from('batch_zoom_links').select('id, name').eq('batch_id', batch.id).order('name');
      setZoomLinks(links || []);`);

// 5. Add formatting for zoom_link_id
content = content.replace('zoom_link: h.zoom?.url || h.zoom_link || \'\',', 
  `zoom_link: h.zoom?.url || h.zoom_link || '',
        zoom_link_id: h.zoom_link_id,`);

// 6. Add handlers
content = content.replace('const handleCopyRekapan = () => {', 
  `const openEditModal = (h: any) => {
    setEditingHalaqah(h);
    setEditForm({
      start_time: h.start_time || '',
      end_time: h.end_time || '',
      zoom_link_id: h.zoom_link_id || ''
    });
  };

  const saveEdit = async () => {
    if (!editingHalaqah) return;
    setIsSaving(true);
    try {
      const res = await fetch(\`/api/admin/halaqah/\${editingHalaqah.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Gagal');
      toast.success('Jadwal berhasil diupdate');
      setEditingHalaqah(null);
      fetchSchedule();
    } catch(err) {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyRekapan = () => {`);

// 7. Add edit button
content = content.replace('<button\n                                onClick={() => copyToClipboard(generateHalaqahReminder(halaqah, dateForTemplate), \'Reminder Kelas berhasil disalin!\')}', 
`<button
                                onClick={() => openEditModal(halaqah)}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 w-full"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Jadwal
                              </button>
                              <button
                                onClick={() => copyToClipboard(generateHalaqahReminder(halaqah, dateForTemplate), 'Reminder Kelas berhasil disalin!')}`);

// 8. Add modal JSX
const modalJSX = `
      {/* Edit Modal Overlay */}
      {editingHalaqah && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Edit Jadwal: {editingHalaqah.name}</h3>
              <button onClick={() => setEditingHalaqah(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Jam Mulai</label>
                  <input type="time" value={editForm.start_time} onChange={e => setEditForm({...editForm, start_time: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Jam Selesai</label>
                  <input type="time" value={editForm.end_time} onChange={e => setEditForm({...editForm, end_time: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Link Zoom</label>
                <select value={editForm.zoom_link_id} onChange={e => setEditForm({...editForm, zoom_link_id: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500">
                  <option value="">Pilih Zoom Link</option>
                  {zoomLinks.map(zl => (
                    <option key={zl.id} value={zl.id}>{zl.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
              <button onClick={() => setEditingHalaqah(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button onClick={saveEdit} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('    <div className="space-y-6">', '    <div className="space-y-6">' + modalJSX);

fs.writeFileSync(path, content);
console.log('Patched AdminJadwalHarianTab.tsx successfully!');
