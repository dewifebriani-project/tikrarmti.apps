/**
 * Auth utilities
 * Helper functions for authentication
 *
 * SECURITY: These utilities use the browser client with HttpOnly cookies.
 * No token storage in localStorage/sessionStorage.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Register user with email and password
 */
export async function registerWithEmail(email: string, password: string, name: string, role: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        role,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update user data
 */
export async function updateUserData(userId: string, userData: Record<string, unknown>) {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from('users')
    .update(userData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Logout current user
 */
export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    throw error;
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}
