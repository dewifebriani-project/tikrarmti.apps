export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for compatibility with existing forms
  displayName?: string;
  photoURL?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isProfileComplete?: boolean;
  // Supabase auth metadata fields (optional)
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    provider?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    [key: string]: any;
  };
  phoneNumber?: string;
  namaLengkap?: string;
  namaPanggilan?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  pendidikanTerakhir?: string;
  pekerjaan?: string;
  namaWali?: string;
  nomorWali?: string;
  hubunganWali?: string;
  alasanDaftar?: string;
  programYangDiikuti?: string[];
  experience?: string;
  motivation?: string;
  target?: string;
  availability?: string;
  profilePhoto?: string;
}

export type UserRole = 'calon_thalibah' | 'thalibah' | 'musyrifah' | 'muallimah' | 'admin';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  registerWithEmail: (email: string, password: string, userData?: any) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteUser: () => Promise<void>;
  isProfileComplete: () => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isCalonThalibah: () => boolean;
  isThalibah: () => boolean;
  isMusyrifah: () => boolean;
  isMuallimah: () => boolean;
  canAccessAdminPanel: () => boolean;
  canAccessLearning: () => boolean;
  canAccessPendaftaran: () => boolean;
}

export interface PendaftaranData {
  uid?: string;
  email: string;
  namaLengkap: string;
  namaPanggilan: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  nomorWhatsApp: string;
  pendidikanTerakhir: string;
  pekerjaan: string;
  namaWali: string;
  nomorWali: string;
  hubunganWali: string;
  alasanDaftar: string;
  programTahfidz: string;
  experience: string;
  motivation: string;
  target: string;
  availability: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'pending' | 'approved' | 'rejected';
}