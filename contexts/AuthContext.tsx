'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-singleton';
import { supabaseAdmin } from '@/lib/supabase';
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword, deleteUser as supabaseDeleteUser } from '@/lib/auth';
import { getDeviceInfo, getAuthTimeout, getRetryCount, shouldUseOptimizedOAuth } from '@/lib/platform-detection';
import { authPerformance } from '@/lib/auth-performance';
import { sessionManager, sessionMaintenance } from '@/lib/session-manager';
import type { User, UserRole, AuthContextType } from '@/types';

// Extend Window interface for activity timeout
declare global {
  interface Window {
    activityTimeout?: NodeJS.Timeout;
  }
}

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
    // Get initial session - optimized with platform detection
    const getInitialSession = async () => {
      const sessionStart = authPerformance.startSession();
      const device = getDeviceInfo();
      const timeout = getAuthTimeout(device.isSlowConnection ? 8000 : 5000);
      const maxRetries = getRetryCount();
      let retryCount = 0;

      const attemptSession = async (): Promise<any> => {
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Session timeout')), timeout)
          );

          const sessionPromise = supabase.auth.getSession();
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          return result.data.session;
        } catch (error) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.warn(`Session fetch attempt ${retryCount} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            return attemptSession();
          }
          throw error;
        }
      };

      try {
        const session = await attemptSession();

        if (session?.user) {
          const isOAuthProvider = session.user.app_metadata?.provider === 'google' || session.user.app_metadata?.provider === 'apple';

          // Use optimized OAuth flow for mobile/tablet
          if (isOAuthProvider && shouldUseOptimizedOAuth() && userCache.has(session.user.id)) {
            const cached = userCache.get(session.user.id)!;
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
              setUser(cached.user);
              setLoading(false);
              const profileEnd = performance.now();
              authPerformance.endSession(sessionStart, sessionStart, profileEnd);
              return;
            }
          }

          const profileStart = performance.now();
          await fetchUserProfile(session.user);
          const profileEnd = performance.now();
          authPerformance.endSession(sessionStart, profileStart, profileEnd);
        } else {
          setUser(null);
          const profileEnd = performance.now();
          authPerformance.endSession(sessionStart, sessionStart, profileEnd);
        }
      } catch (error) {
        console.warn('Session fetch failed, treating as no session');
        setUser(null);
        const profileEnd = performance.now();
        authPerformance.endSession(sessionStart, sessionStart, profileEnd);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const isOAuthProvider = session.user.app_metadata?.provider === 'google' || session.user.app_metadata?.provider === 'apple';

          // Use optimized OAuth flow for mobile/tablet
          if (isOAuthProvider && shouldUseOptimizedOAuth() && userCache.has(session.user.id)) {
            const cached = userCache.get(session.user.id)!;
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
              setUser(cached.user);
              setLoading(false);
              return;
            }
          }

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
      const now = Date.now();

      // Check cache first - most important optimization
      const cached = userCache.get(authUser.id);
      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setUser(cached.user);
        return;
      }

      // Clear expired cache entries (limit cleanup to 5 entries for performance)
      let cleaned = 0;
      userCache.forEach((value, key) => {
        if (cleaned < 5 && now - value.timestamp > CACHE_DURATION) {
          userCache.delete(key);
          cleaned++;
        }
      });

      // Platform-specific timeout
      const device = getDeviceInfo();
      const timeout = getAuthTimeout(device.isSlowConnection ? 12000 : 8000);
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), timeout)
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
        console.warn('Database query timeout, using minimal user data');
        // Create minimal user object from auth data only
        const minimalUserObj = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
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
        return;
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

  // Session maintenance - auto refresh and extend session
  useEffect(() => {
    // Start session maintenance when user is logged in
    if (user && user.id) {
      console.log('Starting session maintenance for user:', user.id);

      // Check session immediately
      const checkSessionImmediately = async () => {
        try {
          const isSessionValid = await sessionManager.checkSession();

          if (!isSessionValid) {
            console.log('Session invalid, attempting refresh...');
            const refreshed = await sessionManager.refreshSession();

            if (!refreshed) {
              console.warn('Session refresh failed, user may need to re-login');
              // Don't automatically logout, let it handle naturally
            }
          } else {
            console.log('Session is valid');
          }
        } catch (error) {
          console.error('Session check error:', error);
        }
      };

      checkSessionImmediately();

      // Start periodic session maintenance (every 30 minutes)
      sessionMaintenance.start(30);

      // Optimized user activity listener with reduced frequency
      const handleUserActivity = (event: Event) => {
        // Debounced activity handler with longer timeout
        if (window.activityTimeout) {
          clearTimeout(window.activityTimeout);
        }

        window.activityTimeout = setTimeout(async () => {
          try {
            // Fast session check without detailed info
            const isSessionValid = await sessionManager.checkSession();

            if (!isSessionValid) {
              console.log('Activity detected invalid session, refreshing...');
              const refreshed = await sessionManager.refreshSession();
              if (!refreshed) {
                console.warn('Activity refresh failed, skipping force refresh to reduce delay');
              }
            }
          } catch (error) {
            console.error('Activity session check failed:', error);
          }
        }, 5000); // Increased to 5 seconds to reduce frequency

        // Only handle critical mobile events (not all touch/scroll events)
        if (event.type === 'touchstart' && 'ontouchstart' in window) {
          // Only check session on first touch, not continuous touches
          const quickCheck = async () => {
            try {
              // Use a simple session existence check
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                console.log('No session detected on touch');
                // Don't immediately refresh to avoid delay, let periodic maintenance handle it
              }
            } catch (error) {
              // Silent fail to avoid disrupting user experience
            }
          };

          setTimeout(quickCheck, 200);
        }
      };

      // Reduced event listeners to minimize authentication overhead
      const events = [
        // Primary events only (removed scroll and touchmove to reduce frequency)
        'mousedown', 'click', 'keydown', 'visibilitychange', 'focus'
      ];

      events.forEach(event => {
        // Use capture phase for better responsiveness
        document.addEventListener(event, handleUserActivity, {
          capture: true,
          passive: true // Better performance for scroll/touch events
        });
      });

      // Additional mobile-specific listeners
      if ('ontouchstart' in window) {
        // Mobile device detected
        console.log('Mobile device detected, enabling enhanced session handling');

        // Handle orientation changes which can affect session
        const handleOrientationChange = async () => {
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for orientation change to complete
            const isSessionValid = await sessionManager.checkSession();
            if (!isSessionValid) {
              await sessionManager.forceRefreshSession();
            }
          } catch (error) {
            console.error('Orientation change session check failed:', error);
          }
        };

        window.addEventListener('orientationchange', handleOrientationChange);

        // Store orientation change handler for cleanup
        (window as any).orientationChangeHandler = handleOrientationChange;
      }

      // Handle page visibility changes (mobile app switching)
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
          // Page became visible, check session
          try {
            console.log('Page became visible, checking session...');
            const isSessionValid = await sessionManager.checkSession();
            if (!isSessionValid) {
              console.warn('Session invalid when page became visible, attempting refresh...');
              await sessionManager.forceRefreshSession();
            }
          } catch (error) {
            console.error('Visibility change session check failed:', error);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup function
      return () => {
        console.log('Cleaning up session maintenance');
        sessionMaintenance.stop();

        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });

        // Cleanup mobile-specific listeners
        if ((window as any).orientationChangeHandler) {
          window.removeEventListener('orientationchange', (window as any).orientationChangeHandler);
        }

        document.removeEventListener('visibilitychange', handleVisibilityChange);

        if (window.activityTimeout) {
          clearTimeout(window.activityTimeout);
        }
      };
    }
  }, [user]);

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