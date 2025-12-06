'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-singleton';
import { supabaseAdmin } from '@/lib/supabase';
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

// Cache for user data to avoid repeated database hits
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
  
        // Add timeout to prevent hanging - increased to 15 seconds for slow connections
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 15000)
        );

        const sessionPromise = supabase.auth.getSession();

        let session;
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          session = result.data.session;
        } catch (timeoutError) {
          console.warn('Session fetch timed out, trying again without timeout...');
          // Try one more time without timeout
          const fallbackResult = await supabase.auth.getSession();
          session = fallbackResult.data.session;
        }

  
        if (session?.user) {
                    await fetchUserProfile(session.user);
        } else {
          // Silent session check - no need to warn when no session on initial load
          setUser(null);
        }
      } catch (error) {
        console.error('Session fetch error:', error);
        // Don't set user to null immediately - wait for auth state change
        console.log('Waiting for auth state change...');
      } finally {
        setLoading(false);
      }
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

  const fetchUserProfile = useCallback(async (authUser: any) => {
    try {
      // Clear expired cache entries (using forEach for compatibility)
      const now = Date.now();
      userCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION) {
          userCache.delete(key);
        }
      });

      // Check cache first
      const cached = userCache.get(authUser.id);
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setUser(cached.user);
        return;
      }

      // Add timeout to database query (increased for slower connections)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 20000)
      );

      // Get user metadata from auth (includes Google photo)
      const googlePhotoUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;

      const queryPromise = supabase
        .from('users')
        .select('id, email, full_name, avatar_url, role, created_at, updated_at')
        .eq('id', authUser.id)
        .maybeSingle();

      let profile, error;
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        profile = result.data;
        error = result.error;
      } catch (timeoutError) {
        console.warn('Database query timed out, attempting to create profile anyway...');
        // If timeout, treat as no profile found and try to create
        profile = null;
        error = null;
      }

      if (error) {
        console.error('Profile fetch error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Don't return here - try to create profile instead
        profile = null;
      }

      if (profile) {
        const userObj = createUserObjectFromProfile(authUser, profile, googlePhotoUrl);

        // Silent profile loading - remove excessive logging for better performance

        // Cache the user data
        userCache.set(authUser.id, {
          user: userObj,
          timestamp: now
        });

        setUser(userObj);
      } else {
        console.warn('No profile found in database for user:', authUser.id);
        console.log('Attempting to auto-create user profile...');

        // Try to auto-create user profile with minimal data
        try {
          const { data: newProfile, error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
              role: 'calon_thalibah',
              password_hash: 'managed_by_auth_system',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              avatar_url: googlePhotoUrl || null
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            console.log('✅ User profile created successfully:', newProfile);
            const userObj = createUserObjectFromProfile(authUser, newProfile, googlePhotoUrl);

            // Cache the user data
            userCache.set(authUser.id, {
              user: userObj,
              timestamp: now
            });

            setUser(userObj);
          } else {
            console.error('Failed to create user profile:', insertError);
            // Jangan setUser(null) agar user tetap bisa login
            // Buat user obj dari auth data saja
            const minimalUserObj = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
              avatar_url: googlePhotoUrl,
              role: 'calon_thalibah' as UserRole,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
              photoURL: googlePhotoUrl,
              createdAt: new Date(),
              updatedAt: new Date(),
              isProfileComplete: false,
            };

            setUser(minimalUserObj);
          }
        } catch (createError) {
          console.error('Error creating user profile:', createError);
          // Jangan setUser(null) agar user tetap bisa login
          const minimalUserObj = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
            avatar_url: googlePhotoUrl,
            role: 'calon_thalibah' as UserRole,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            displayName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
            photoURL: googlePhotoUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            isProfileComplete: false,
          };

          setUser(minimalUserObj);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(null);
    }
  }, []);

  // Helper function to create user object from database profile
  const createUserObjectFromProfile = (authUser: any, profile: any, googlePhotoUrl?: string): User => {
    // Ensure role is a valid UserRole
    const userRole = profile.role || 'calon_thalibah';
    const validRole: UserRole = ['calon_thalibah', 'thalibah', 'musyrifah', 'muallimah', 'admin'].includes(userRole)
      ? userRole as UserRole
      : 'calon_thalibah';

    // Prioritize Google photo URL, then database avatar_url
    const avatarUrl = googlePhotoUrl || profile.avatar_url || undefined;

    return {
      id: authUser.id,
      email: authUser.email || '',
      full_name: profile.full_name || authUser.user_metadata?.full_name || '',
      avatar_url: avatarUrl,
      role: validRole,
      is_active: true,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      displayName: profile.full_name || authUser.user_metadata?.full_name || '',
      photoURL: avatarUrl,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      isProfileComplete: true,
    };
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear cache
      if (user) {
        userCache.delete(user.id);
      }

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
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          full_name: data.displayName || data.namaLengkap || data.full_name || null,
          avatar_url: data.photoURL || data.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => {
        if (prev) {
          const updatedUser = { ...prev, ...data };

          // Update cache
          userCache.set(prev.id, {
            user: updatedUser,
            timestamp: Date.now()
          });

          return updatedUser;
        }
        return null;
      });
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