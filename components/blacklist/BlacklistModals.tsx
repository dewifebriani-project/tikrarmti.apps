'use client';

import { Ban, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlacklistModalsProps {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (val: boolean) => void;
  addForm: { userId: string; reason: string; notes: string };
  setAddForm: (val: any) => void;
  isSubmitting: boolean;
  onAdd: () => void;
  
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (val: boolean) => void;
  selectedUser: any | null;
  onRemove: (id: string) => void;
}

export function BlacklistModals({
  isAddModalOpen, setIsAddModalOpen, addForm, setAddForm, isSubmitting, onAdd,
  isDetailModalOpen, setIsDetailModalOpen, selectedUser, onRemove
}: BlacklistModalsProps) {
  return (
    <>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" /> Tambah User ke Blacklist
            </DialogTitle>
            <DialogDescription>Masukkan User ID dan alasan untuk mem-blacklist user dari pendaftaran</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="userId">User ID *</Label>
              <Input id="userId" value={addForm.userId} onChange={(e) => setAddForm({ ...addForm, userId: e.target.value })} placeholder="Masukkan User ID (UUID)" required />
            </div>
            <div>
              <Label htmlFor="reason">Alasan Blacklist *</Label>
              <Input id="reason" value={addForm.reason} onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })} placeholder="Contoh: Duplikat pendaftaran, dll" required />
            </div>
            <div>
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea id="notes" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Catatan tambahan..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={onAdd} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</> : <><Ban className="h-4 w-4 mr-2" /> Blacklist User</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Detail Blacklist</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-gray-500 text-sm">Nama</Label><p className="font-medium">{selectedUser.full_name || '-'}</p></div>
                <div><Label className="text-gray-500 text-sm">Email</Label><p className="font-medium">{selectedUser.email}</p></div>
                <div><Label className="text-gray-500 text-sm">WhatsApp</Label><p className="font-medium">{selectedUser.whatsapp || '-'}</p></div>
                <div><Label className="text-gray-500 text-sm">Tanggal Diblacklist</Label><p className="font-medium">{new Date(selectedUser.blacklisted_at).toLocaleString('id-ID')}</p></div>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Alasan Blacklist</Label>
                <Alert className="mt-1"><AlertTriangle className="h-4 w-4" /><AlertDescription>{selectedUser.blacklist_reason || '-'}</AlertDescription></Alert>
              </div>
              {selectedUser.blacklist_notes && (
                <div><Label className="text-gray-500 text-sm">Catatan</Label><p className="text-sm bg-gray-50 p-3 rounded-md mt-1">{selectedUser.blacklist_notes}</p></div>
              )}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setIsDetailModalOpen(false); onRemove(selectedUser.id); }}><ShieldCheck className="h-4 w-4 mr-2" /> Hapus dari Blacklist</Button>
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Tutup</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
  );
}
