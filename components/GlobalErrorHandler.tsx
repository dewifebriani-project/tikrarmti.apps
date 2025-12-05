'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      // Ignore specific browser extension errors
      if (event.reason?.message?.includes('message channel closed')) {
        event.preventDefault();
        return;
      }
    };

    // Handle runtime errors
    const handleError = (event: ErrorEvent) => {
      console.error('Runtime error:', event.error);

      // Ignore specific browser extension errors
      if (event.error?.message?.includes('message channel closed')) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}