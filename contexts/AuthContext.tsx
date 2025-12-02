'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword, deleteUser as supabaseDeleteUser } from '@/lib/auth';
import type { User, AuthContextType } from '@/types';

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
      // First try to select only basic fields that we know exist
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, role, created_at, updated_at')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // If the basic fields query also fails, create a basic user object
        console.error('Error fetching user profile:', error);

        // Try to create the user record if it doesn't exist
        if (error.code === 'PGRST116') {
          console.log('User not found in database, attempting to create profile...');
          try {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
                role: authUser.user_metadata?.role || 'thalibah',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('Failed to create user profile:', insertError);
            } else {
              console.log('User profile created successfully');
              // Try fetching again
              const { data: newProfile, error: refetchError } = await supabase
                .from('users')
                .select('id, email, full_name, avatar_url, role, created_at, updated_at')
                .eq('id', authUser.id)
                .single();

              if (!refetchError && newProfile) {
                setUser({
                  id: authUser.id,
                  email: authUser.email || '',
                  full_name: newProfile.full_name || '',
                  avatar_url: newProfile.avatar_url || undefined,
                  role: newProfile.role,
                  is_active: true,
                  created_at: newProfile.created_at,
                  updated_at: newProfile.updated_at,
                  displayName: newProfile.full_name || '',
                  photoURL: newProfile.avatar_url || undefined,
                  createdAt: new Date(newProfile.created_at),
                  updatedAt: new Date(newProfile.updated_at),
                  isProfileComplete: true,
                });
                return;
              }
            }
          } catch (createError) {
            console.error('Error creating user profile:', createError);
          }
        }

        // Fallback to basic user object
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || '',
          avatar_url: authUser.user_metadata?.avatar_url || undefined,
          role: authUser.user_metadata?.role || 'thalibah',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          displayName: authUser.user_metadata?.full_name || '',
          photoURL: authUser.user_metadata?.avatar_url || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          isProfileComplete: false,
        });
        return;
      }

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || undefined,
          role: profile.role,
          is_active: true,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          displayName: profile.full_name || '',
          photoURL: profile.avatar_url || undefined,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at),
          isProfileComplete: true,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
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