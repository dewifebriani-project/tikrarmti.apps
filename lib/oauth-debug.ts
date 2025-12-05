// Debug utilities for OAuth flow
export const debugOAuth = (action: string, data: any) => {
  console.log(`[OAuth Debug] ${action}:`, data);

  // Also log to console with styling for better visibility
  if (typeof window !== 'undefined') {
    console.log(
      `%c[OAuth] ${action}`,
      'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px;',
      data
    );
  }
};

export const getEnvironmentInfo = () => {
  const info = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side',
    isLocalhost: typeof window !== 'undefined'
      ? window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
      : false
  };

  debugOAuth('Environment Info', info);
  return info;
};