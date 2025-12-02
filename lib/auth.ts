import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import type { User, UserRole } from '@/types/database';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Check if user has completed registration
export const checkUserRegistrationComplete = async (email: string): Promise<boolean> => {
  try {
    // Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return false;
    }

    // Check if all required fields are filled
    const hasRequiredFields = !!(
      user.full_name &&
      user.phone
    );

    return hasRequiredFields;
  } catch (error: any) {
    console.error('Error checking user registration:', error);
    return false;
  }
};

// Check if user has been approved for thalibah role
export const checkUserApprovedForThalibah = async (email: string): Promise<{ approved: boolean; reason: string }> => {
  try {
    // Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return { approved: false, reason: 'User tidak ditemukan. Silakan registrasi terlebih dahulu.' };
    }

    // If user is already thalibah, allow login
    if (user.role === 'thalibah') {
      return { approved: true, reason: 'User sudah terdaftar sebagai thalibah' };
    }

    // If user is calon_thalibah, check if they have an approved pendaftaran
    if (user.role === 'calon_thalibah') {
      const { data: pendaftaran, error: pendaftaranError } = await supabase
        .from('pendaftaran_batch2')
        .select('status')
        .eq('userId', user.id)
        .eq('status', 'approved')
        .single();

      if (pendaftaranError || !pendaftaran) {
        return {
          approved: false,
          reason: 'Pendaftaran Anda belum disetujui. Silakan tunggu persetujuan dari admin atau lengkapi pendaftaran di halaman pendaftaran.'
        };
      }

      return { approved: true, reason: 'User telah disetujui sebagai thalibah' };
    }

    // If user has other roles (admin, musyrifah, muallimah), allow login
    if (['admin', 'musyrifah', 'muallimah'].includes(user.role)) {
      return { approved: true, reason: 'User dengan role ' + user.role + ' diizinkan' };
    }

    return { approved: false, reason: 'Role user tidak dikenal. Hubungi admin.' };
  } catch (error: any) {
    console.error('Error checking user approval:', error);
    return { approved: false, reason: 'Terjadi kesalahan saat memeriksa status user.' };
  }
};

// Login dengan Email dan Password
export const loginWithEmail = async (email: string, password: string) => {
  try {
    // Check if user is approved for login based on role and pendaftaran status
    const { approved, reason } = await checkUserApprovedForThalibah(email);
    if (!approved) {
      throw new Error(reason);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Login dengan Google
export const loginWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Register dengan Email dan Password
export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
  role: UserRole = 'calon_thalibah'
) => {
  try {
    console.log('Starting user registration:', { email, name, role });

    // Create auth user using regular client first to test
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
        },
      },
    });

    if (error) {
      console.error('Auth signup error:', error);
      throw error;
    }

    console.log('Auth user created:', data.user);

    // Create user profile in the users table
    if (data.user?.id) {
      await createUserProfile(data.user.id, email, name, role);
    }

    return data.user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message);
  }
};

// Create user profile in Supabase
export const createUserProfile = async (
  userId: string,
  email: string,
  name: string,
  role: UserRole
) => {
  try {
    console.log('Creating user profile:', { userId, email, name, role });

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: name,
        role: role,
        password_hash: 'managed_by_auth_system', // Database requires this field to be NOT NULL
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    console.log('Profile creation result:', { data, error });

    if (error) {
      console.error('Profile creation error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
  } catch (error: any) {
    console.error('Profile creation exception:', error);
    throw new Error(error.message || 'Failed to create user profile');
  }
};

// Interface untuk registration form data
interface RegistrationFormData {
  email?: string;
  namaLengkap?: string;
  phoneNumber?: string;
  photoURL?: string;
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
}

// Create user profile in users table
export const createRegistrationDocument = async (
  userId: string,
  registrationData: RegistrationFormData
) => {
  try {
    // Update user profile with additional data
    const updateData: any = {
      full_name: registrationData.namaLengkap,
      phone: registrationData.phoneNumber,
      avatar_url: registrationData.photoURL,
      updated_at: new Date().toISOString(),
    };

    const { error: userError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (userError) throw userError;

    // Store detailed registration data in a separate table if needed
    // For now, we'll store the essential info in the users table
    // Additional registration-specific data can be stored in a pendaftaran_detail table if needed

    return { success: true };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update user profile in Supabase
export const updateUserData = async (
  userId: string,
  data: Partial<User> | RegistrationFormData
) => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Handle both new and legacy field names using type guards
    if ('full_name' in data || 'namaLengkap' in data) {
      updateData.full_name = (data as any).full_name || (data as any).namaLengkap;
    }
    if ('phone' in data || 'phoneNumber' in data) {
      updateData.phone = (data as any).phone || (data as any).phoneNumber;
    }
    if ('avatar_url' in data || 'photoURL' in data) {
      updateData.avatar_url = (data as any).avatar_url !== undefined ?
        (data as any).avatar_url : (data as any).photoURL;
    }
    if ('role' in data) {
      updateData.role = (data as any).role;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update password
export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete user
export const deleteUser = async (userId: string) => {
  try {
    // Delete from users first (foreign key constraint)
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) throw userError;

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get user by ID
export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId: string, newRole: UserRole) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Validate user registration for Google OAuth callback
export const validateGoogleUserRegistration = async (email: string): Promise<boolean> => {
  return await checkUserRegistrationComplete(email);
};