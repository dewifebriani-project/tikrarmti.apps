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

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        setUser(null);
        return;
      }

      if (!session?.user) {
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
        // Set client-side session with returned tokens
        if (data.session) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          if (setSessionError) {
            console.error('Error setting client session:', setSessionError);
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

    // Immediately clear user state
    setUser(null);

    // Clear storage properly
    if (typeof window !== 'undefined') {
      // Clear specific auth keys first
      const keysToRemove = [
        'mti-auth-token',
        'supabase.auth.token',
        'sb-access-token',
        'sb-refresh-token'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Then clear everything as fallback
      localStorage.clear();
      sessionStorage.clear();
    }

    // Call server logout without waiting
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    // Supabase logout (don't wait for completion)
    supabase.auth.signOut().catch(() => {});

    // Redirect immediately using multiple methods
    if (typeof window !== 'undefined') {
      // Method 1: Direct assignment
      window.location.href = '/login';

      // Method 2: Fallback after 50ms
      setTimeout(() => {
        window.location.replace('/login');
      }, 50);

      // Method 3: Final fallback after 100ms
      setTimeout(() => {
        window.location.assign('/login');
      }, 100);
    }

    console.log('LOGOUT: Redirect commands sent');
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
