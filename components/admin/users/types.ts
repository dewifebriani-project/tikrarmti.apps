export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  nama_kunyah: string | null;
  role: string | null;
  roles: string[] | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  provinsi: string | null;
  kota: string | null;
  alamat: string | null;
  whatsapp: string | null;
  telegram: string | null;
  zona_waktu: string | null;
  tanggal_lahir: string | null;
  tempat_lahir: string | null;
  pekerjaan: string;
  alasan_daftar: string;
  jenis_kelamin: string | null;
  negara: string;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  blacklisted_at: string | null;
  blacklist_notes: string | null;
  blacklist_by: string | null;
  current_tikrar_batch?: {
    id: string;
    name: string;
    status: string;
  } | null;
}
