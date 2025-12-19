'use client';

import { useEffect } from 'react';

interface ErudaConsoleProps {
  enabled?: boolean;
}

export default function ErudaConsole({ enabled = true }: ErudaConsoleProps) {
  useEffect(() => {
    // Only load on mobile devices and in development
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!enabled || !isMobile) {
      return;
    }

    // Dynamic import eruda
    import('eruda').then((eruda) => {
      const erudaInstance = eruda.default;

      // Initialize eruda
      erudaInstance.init({
        defaults: {
          displaySize: 50, // Smaller size for mobile
          transparency: 0.9,
          theme: 'Monokai' // Dark theme for better visibility
        }
      });

      // Show eruda by default on mobile
      erudaInstance.show();

      // Add custom CSS for better mobile experience
      const style = document.createElement('style');
      style.textContent = `
        .eruda-container {
          font-size: 12px !important;
        }
        .eruda-console .eruda-log {
          font-size: 11px !important;
        }
      `;
      document.head.appendChild(style);

      console.log('🛠️ Eruda debugging console initialized for mobile');
      console.log('📱 Mobile Info:', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        isMobile,
        screen: {
          width: screen.width,
          height: screen.height
        }
      });

      // Add global error handler
      window.addEventListener('error', (event) => {
        console.error('🔥 Global Error:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });

      // Add unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        console.error('🔥 Unhandled Promise Rejection:', {
          reason: event.reason,
          promise: event.promise
        });
      });

      console.log('✅ Mobile debugging setup completed');
    }).catch((error) => {
      console.warn('Failed to load Eruda:', error);
    });

    // Cleanup on unmount
    return () => {
      import('eruda').then((eruda) => {
        const erudaInstance = eruda.default;
        if (erudaInstance) {
          erudaInstance.destroy();
        }
      }).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, [enabled]);

  return null; // This component doesn't render anything visible
}