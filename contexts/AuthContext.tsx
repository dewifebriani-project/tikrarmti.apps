'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword, deleteUser as supabaseDeleteUser } from '@/lib/auth';
import type { User, UserRole, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
      // Try using the admin client to avoid potential issues
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, role, created_at, updated_at')
        .eq('id', authUser.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        console.error('Error fetching user profile:', error);

        // If there's an error fetching by ID, try checking by email as fallback
        console.log('Error occurred, checking if user exists with email...');

        const { data: existingUser, error: fetchByEmailError } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, role, created_at, updated_at')
          .eq('email', authUser.email)
          .maybeSingle();

        if (fetchByEmailError) {
          console.error('Error fetching user by email:', fetchByEmailError);
          // Error accessing database - sign out for security
          console.log('Database access error. Signing out user for security.');
          await supabase.auth.signOut();
          setUser(null);
          return;
        }

        if (existingUser) {
          // User exists with email
          if (existingUser.id === authUser.id) {
            // IDs match, use this profile
            console.log('User found with matching ID');
            setUser(createUserObjectFromProfile(authUser, existingUser));
            return;
          } else {
            // IDs don't match - potential security issue
            console.error('Security warning: User exists with email but different ID');
            await supabase.auth.signOut();
            setUser(null);
            return;
          }
        } else {
          // User doesn't exist in database at all
          console.log('User not found in database. User must register first.');
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
      }

      if (profile) {
        console.log('User profile found and authenticated');
        setUser(createUserObjectFromProfile(authUser, profile));
      } else {
        // No profile found - user not registered
        console.log('No profile found for user. User must register first.');
        // Jangan logout di sini, biarkan callback yang menangani
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  // Helper function to create user object from database profile
  const createUserObjectFromProfile = (authUser: any, profile: any): User => {
    // Ensure role is a valid UserRole
    const userRole = profile.role || 'calon_thalibah';
    const validRole: UserRole = ['calon_thalibah', 'thalibah', 'musyrifah', 'muallimah', 'admin'].includes(userRole)
      ? userRole as UserRole
      : 'calon_thalibah';

    return {
      id: authUser.id,
      email: authUser.email || '',
      full_name: profile.full_name || '',
      avatar_url: profile.avatar_url || undefined,
      role: validRole,
      is_active: true,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      displayName: profile.full_name || '',
      photoURL: profile.avatar_url || undefined,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      isProfileComplete: true,
    };
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user || !user.id) {
      throw new Error('No user logged in');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: data.displayName || data.namaLengkap || data.full_name,
          avatar_url: data.photoURL || data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const handleDeleteUser = async () => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      await supabaseDeleteUser(user.id);
      setUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Helper functions
  const isProfileComplete = () => {
    return user?.isProfileComplete === true;
  };

  const isAdmin = () => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'admin' || userRole === 'pengurus';
  };

  const isSuperAdmin = () => {
    return user?.role?.toLowerCase() === 'admin';
  };

  const isCalonThalibah = () => {
    return user?.role?.toLowerCase() === 'calon_thalibah';
  };

  const isThalibah = () => {
    return user?.role?.toLowerCase() === 'thalibah';
  };

  const isMusyrifah = () => {
    return user?.role?.toLowerCase() === 'musyrifah';
  };

  const isMuallimah = () => {
    return user?.role?.toLowerCase() === 'muallimah';
  };

  // Access control functions
  const canAccessAdminPanel = () => {
    return isAdmin(); // Only admin can access admin panel
  };

  const canAccessLearning = () => {
    // Thalibah, musyrifah, muallimah, and admin can access learning features
    return isThalibah() || isMusyrifah() || isMuallimah() || isAdmin();
  };

  const canAccessPendaftaran = () => {
    // All authenticated users can access pendaftaran, but with different permissions
    return user !== null;
  };

  const value: AuthContextType = {
    user,
    loading,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    logout,
    updateUserProfile,
    resetPassword,
    deleteUser: handleDeleteUser,
    isProfileComplete,
    isAdmin,
    isSuperAdmin,
    isCalonThalibah,
    isThalibah,
    isMusyrifah,
    isMuallimah,
    canAccessAdminPanel,
    canAccessLearning,
    canAccessPendaftaran,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};