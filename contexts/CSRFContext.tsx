'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CSRFContextType {
  token: string | null;
  isLoading: boolean;
  refreshCSRFToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

interface CSRFProviderProps {
  children: ReactNode;
}

export const CSRFProvider: React.FC<CSRFProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });

      if (response.ok) {
        const csrfToken = response.headers.get('x-csrf-token');
        if (csrfToken) {
          setToken(csrfToken);
          // Store in cookie for future requests
          if (typeof window !== 'undefined') {
            document.cookie = `csrf-token=${csrfToken}; path=/; secure; samesite=strict; max-age=3600`;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCSRFToken = async () => {
    setIsLoading(true);
    await fetchCSRFToken();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check if token exists in cookie first
    const checkCookieAndFetch = () => {
      if (typeof window !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'csrf-token' && value) {
            setToken(value);
            setIsLoading(false);
            return true;
          }
        }
      }
      return false;
    };

    // Only fetch if cookie doesn't exist
    if (!checkCookieAndFetch()) {
      fetchCSRFToken();
    }
  }, [isMounted]);

  // Auto-refresh token every hour
  useEffect(() => {
    const interval = setInterval(refreshCSRFToken, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value: CSRFContextType = {
    token,
    isLoading,
    refreshCSRFToken,
  };

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
};