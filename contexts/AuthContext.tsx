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
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session fetch error:', error);
        setUser(null);
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

      // Add timeout to database query
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 2000)
      );

      const queryPromise = supabase
        .from('users')
        .select('id, email, full_name, avatar_url, role, created_at, updated_at')
        .eq('id', authUser.id)
        .maybeSingle();

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Profile fetch error:', error);
        setUser(null);
        return;
      }

      if (profile) {
        const userObj = createUserObjectFromProfile(authUser, profile);

        // Cache the user data
        userCache.set(authUser.id, {
          user: userObj,
          timestamp: now
        });

        setUser(userObj);
      } else {
        // No profile found - user not registered
        setUser(null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(null);
    }
  }, []);

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