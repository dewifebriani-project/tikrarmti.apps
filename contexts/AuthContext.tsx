'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  photoURL?: string;
  displayName?: string;
  created_at?: string;
  whatsapp?: string;
  telegram?: string;
  negara?: string;
  provinsi?: string;
  kota?: string;
  alamat?: string;
  zona_waktu?: string;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  jenis_kelamin?: string;
  pekerjaan?: string;
  alasan_daftar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

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

  // Fetch user data from database
  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching user data:', error);
      return null;
    }
  };

  // Create user profile in database if not exists
  const createUserProfileIfNotExists = async (authUser: any) => {
    try {
      console.log('Checking if user profile exists for:', authUser.email);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (existingUser) {
        console.log('User profile already exists');
        return existingUser;
      }

      console.log('Creating user profile for:', authUser.email);

      // Create user profile
      const { data, error } = await (supabase as any)
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
          role: authUser.user_metadata?.role || 'calon_thalibah',
          password_hash: 'managed_by_auth_system', // Required field
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }

      console.log('User profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception creating user profile:', error);
      return null;
    }
  };

  // Initialize user session
  const initializeUser = async () => {
    try {
      setLoading(true);

      // Mobile detection for debugging
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('=== AuthContext Initialize User ===');
      console.log('Is Mobile:', isMobile);
      console.log('User Agent:', navigator.userAgent.substring(0, 100));
      console.log('Has localStorage:', typeof window !== 'undefined' && !!window.localStorage);
      console.log('=================================');

      // Try to validate session via API endpoint (server-side cookies)
      let apiErrorOccurred = false;
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            console.log('Session validated via API, user:', data.user.email);
            setUser(data.user);
            return;
          }
        } else {
          apiErrorOccurred = true;
          console.log('API session validation returned error:', response.status);
        }
      } catch (apiError) {
        apiErrorOccurred = true;
        console.log('API session validation failed, trying client-side');
      }

      // Mobile/Production fallback: Try to restore from localStorage first
      const isProduction = process.env.NODE_ENV === 'production';
      const isProductionDomain = typeof window !== 'undefined' &&
        (window.location.hostname === 'markaztikrar.id' ||
         window.location.hostname === 'www.markaztikrar.id');

      // For production domain, try token verification endpoint first
      if (isProductionDomain && typeof window !== 'undefined') {
        try {
          const storedTokens = localStorage.getItem('mti-auth-tokens');
          if (storedTokens) {
            const tokens = JSON.parse(storedTokens);
            console.log('Production: Found stored tokens, verifying with server...');

            // Call token verification endpoint
            const verifyResponse = await fetch('/api/auth/verify-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.valid && verifyData.user) {
                console.log('Production: Token verification successful, setting user');
                setUser(verifyData.user);

                // Update stored tokens if refreshed
                if (verifyData.session) {
                  localStorage.setItem('mti-auth-tokens', JSON.stringify({
                    access_token: verifyData.session.access_token,
                    refresh_token: verifyData.session.refresh_token,
                    expires_at: verifyData.session.expires_at,
                  }));
                }
                return;
              }
            } else {
              console.log('Production: Token verification failed, clearing tokens');
              localStorage.removeItem('mti-auth-tokens');
            }
          }
        } catch (verifyError) {
          console.error('Production: Token verification error:', verifyError);
        }
      }

      if ((isMobile || apiErrorOccurred || isProductionDomain) && typeof window !== 'undefined') {
        try {
          const storedTokens = localStorage.getItem('mti-auth-tokens');
          if (storedTokens) {
            const tokens = JSON.parse(storedTokens);

            // Check if tokens are still valid
            if (tokens.expires_at && Date.now() < tokens.expires_at * 1000) {
              console.log('Mobile: Restoring session from localStorage');

              const { error: setSessionError } = await supabase.auth.setSession({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
              });

              if (!setSessionError) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                  setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || '',
                    role: session.user.user_metadata?.role || 'calon_thalibah',
                    created_at: session.user.created_at,
                  });
                  console.log('Mobile: Session restored from localStorage');
                  return;
                }
              }
            } else {
              console.log('Mobile: Stored tokens expired, clearing localStorage');
              localStorage.removeItem('mti-auth-tokens');
            }
          }
        } catch (error) {
          console.warn('Mobile: Could not restore from localStorage:', error);
        }
      }

      // Fallback: Get current session from client-side
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        setUser(null);
        return;
      }

      if (!session?.user) {
        console.log('No session found');
        setUser(null);
        return;
      }

      // Fetch user data from database, create if not exists
      let userData = await fetchUserData(session.user.id);

      if (!userData) {
        // Create user profile if not exists
        userData = await createUserProfileIfNotExists(session.user);
      }

      if (userData) {
        setUser({
          id: (userData as any).id,
          email: (userData as any).email,
          full_name: (userData as any).full_name,
          role: (userData as any).role,
          avatar_url: (userData as any).avatar_url,
          created_at: (userData as any).created_at,
          whatsapp: (userData as any).whatsapp,
          telegram: (userData as any).telegram,
          negara: (userData as any).negara,
          provinsi: (userData as any).provinsi,
          kota: (userData as any).kota,
          alamat: (userData as any).alamat,
          zona_waktu: (userData as any).zona_waktu,
          tanggal_lahir: (userData as any).tanggal_lahir,
          tempat_lahir: (userData as any).tempat_lahir,
          jenis_kelamin: (userData as any).jenis_kelamin,
          pekerjaan: (userData as any).pekerjaan,
          alasan_daftar: (userData as any).alasan_daftar,
        });
      } else {
        // Fallback to auth user metadata if database operations failed
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role,
        });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize user on mount
  useEffect(() => {
    initializeUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        // Store tokens in localStorage for mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && typeof window !== 'undefined' && session.access_token && session.refresh_token) {
          localStorage.setItem('mti-auth-tokens', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          }));
        }

        // Fetch user data, create if not exists
        let userData = await fetchUserData(session.user.id);

        if (!userData) {
          // Create user profile if not exists
          userData = await createUserProfileIfNotExists(session.user);
        }

        if (userData) {
          setUser({
            id: (userData as any).id,
            email: (userData as any).email,
            full_name: (userData as any).full_name,
            role: (userData as any).role,
            avatar_url: (userData as any).avatar_url,
            created_at: (userData as any).created_at,
            whatsapp: (userData as any).whatsapp,
            telegram: (userData as any).telegram,
            negara: (userData as any).negara,
            provinsi: (userData as any).provinsi,
            kota: (userData as any).kota,
            alamat: (userData as any).alamat,
            zona_waktu: (userData as any).zona_waktu,
            tanggal_lahir: (userData as any).tanggal_lahir,
            tempat_lahir: (userData as any).tempat_lahir,
            jenis_kelamin: (userData as any).jenis_kelamin,
            pekerjaan: (userData as any).pekerjaan,
            alasan_daftar: (userData as any).alasan_daftar,
          });
        } else {
          // Fallback to auth user metadata if database operations failed
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name,
            role: session.user.user_metadata?.role,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if mobile device for additional handling
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Set client-side session with returned tokens
        if (data.session) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          if (setSessionError) {
            console.error('Error setting client session:', setSessionError);
          }

          // For mobile devices or production domains, store tokens in localStorage as additional fallback
          const isProductionDomain = typeof window !== 'undefined' &&
            (window.location.hostname === 'markaztikrar.id' ||
             window.location.hostname === 'www.markaztikrar.id');

          if ((isMobile || isProductionDomain) && typeof window !== 'undefined') {
            try {
              localStorage.setItem('mti-auth-tokens', JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at
              }));
              console.log('Mobile: Stored auth tokens in localStorage as fallback');
            } catch (error) {
              console.warn('Mobile: Could not store tokens in localStorage:', error);
            }
          }
        }

        // Set user state immediately with returned data
        if (data.user_data) {
          setUser(data.user_data);
        }

        // Skip initializeUser() since we already have fresh data from API
        // This prevents the race condition where dashboard renders before user state is set
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('LOGOUT: Process started');

    try {
      // Step 1: Clear user state immediately
      setUser(null);

      // Step 2: Clear localStorage tokens (for mobile fallback)
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('mti-auth-tokens');
          console.log('LOGOUT: Cleared localStorage tokens');
        } catch (error) {
          console.warn('LOGOUT: Could not clear localStorage:', error);
        }
      }

      // Step 3: Call server logout API to delete cookies - WAIT for completion
      console.log('LOGOUT: Calling server API to delete cookies');
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('LOGOUT: Server cookies deleted');

      // Step 4: Sign out from Supabase client
      console.log('LOGOUT: Signing out from Supabase');
      await supabase.auth.signOut();
      console.log('LOGOUT: Supabase sign out complete');

      // Step 4: Clear all local storage
      if (typeof window !== 'undefined') {
        const keysToRemove = [
          'mti-auth-token',
          'mti-auth-tokens',
          'supabase.auth.token',
          'sb-access-token',
          'sb-refresh-token',
          'sb-access-token-fallback',
          'sb-refresh-token-fallback'
        ];

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        // Clear all storage as final step
        localStorage.clear();
        sessionStorage.clear();
        console.log('LOGOUT: Local storage cleared');
      }

      // Step 5: Redirect to login after everything is cleared
      console.log('LOGOUT: Redirecting to login');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('LOGOUT: Error during logout process:', error);
      // Still redirect even if there's an error
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshUser = async () => {
    await initializeUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
