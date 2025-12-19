'use client';

import { useEffect, useState } from 'react';

interface ErudaConsoleProps {
  enabled?: boolean;
}

export default function ErudaConsole({ enabled = true }: ErudaConsoleProps) {
  const [erudaLoaded, setErudaLoaded] = useState(false);

  useEffect(() => {
    // Load on both mobile and desktop for debugging
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!enabled) {
      return;
    }

    console.log('🔍 Initializing Eruda debugging...');
    console.log('📱 Device Info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      isMobile,
      screen: {
        width: screen.width,
        height: screen.height
      }
    });

    // Try multiple methods to load eruda
    const loadEruda = async () => {
      try {
        console.log('📦 Loading Eruda module...');

        // Method 1: Try dynamic import
        const eruda = await import('eruda');
        const erudaInstance = eruda.default;

        console.log('✅ Eruda module loaded successfully');

        // Initialize eruda with enhanced settings
        erudaInstance.init({
          defaults: {
            displaySize: isMobile ? 50 : 70, // Smaller size for mobile
            transparency: 0.9,
            theme: 'Monokai' // Dark theme for better visibility
          }
        });

        // Show eruda by default
        erudaInstance.show();

        // Add custom CSS for better experience
        const style = document.createElement('style');
        style.textContent = `
          .eruda-container {
            font-size: ${isMobile ? '10px' : '12px'} !important;
            z-index: 999999 !important;
          }
          .eruda-console .eruda-log {
            font-size: ${isMobile ? '9px' : '11px'} !important;
          }
          .eruda-tool {
            font-size: ${isMobile ? '10px' : '12px'} !important;
          }
        `;
        document.head.appendChild(style);

        setErudaLoaded(true);
        console.log('🛠️ Eruda debugging console initialized successfully!');

        // Add a visible indicator that Eruda is loaded
        const indicator = document.createElement('div');
        indicator.id = 'eruda-indicator';
        indicator.style.cssText = `
          position: fixed;
          bottom: ${isMobile ? '60px' : '20px'};
          right: ${isMobile ? '10px' : '20px'};
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          z-index: 999999;
          font-family: monospace;
        `;
        indicator.textContent = 'Eruda Console Active';
        document.body.appendChild(indicator);

        // Remove indicator after 5 seconds
        setTimeout(() => {
          if (document.getElementById('eruda-indicator')) {
            document.getElementById('eruda-indicator')?.remove();
          }
        }, 5000);

      } catch (error) {
        console.error('❌ Failed to load Eruda:', error);

        // Fallback: Try loading via script tag
        try {
          console.log('🔄 Trying fallback method...');
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/eruda@2.11.2/eruda.min.js';
          script.onload = () => {
            // @ts-ignore
            if (window.eruda) {
              // @ts-ignore
              window.eruda.init({
                defaults: {
                  displaySize: isMobile ? 50 : 70,
                  transparency: 0.9,
                  theme: 'Monokai'
                }
              });
              // @ts-ignore
              window.eruda.show();
              setErudaLoaded(true);
              console.log('✅ Eruda loaded via fallback method');
            }
          };
          document.head.appendChild(script);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
    };

    // Load Eruda after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(loadEruda, 1000);

    // Add global error handlers
    window.addEventListener('error', (event) => {
      console.error('🔥 Global Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🔥 Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise
      });
    });

    console.log('✅ Mobile debugging setup completed');
    console.log('💡 Tip: Eruda console should appear in the corner. If not, try refreshing or check for errors above.');

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      const indicator = document.getElementById('eruda-indicator');
      if (indicator) {
        indicator.remove();
      }
    };
  }, [enabled]);

  // Add a manual trigger button if Eruda fails to load
  useEffect(() => {
    if (!erudaLoaded && enabled) {
      const triggerButton = document.createElement('button');
      triggerButton.id = 'eruda-trigger';
      triggerButton.textContent = '🛠️ Debug Console';
      triggerButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 999999;
        cursor: pointer;
        font-family: monospace;
      `;
      triggerButton.onclick = async () => {
        try {
          const eruda = await import('eruda');
          eruda.default.init();
          eruda.default.show();
          triggerButton.remove();
        } catch (error) {
          console.error('Failed to load Eruda manually:', error);
        }
      };

      // Only add button if it doesn't exist
      if (!document.getElementById('eruda-trigger')) {
        document.body.appendChild(triggerButton);
      }

      // Remove button after Eruda loads
      if (erudaLoaded) {
        triggerButton.remove();
      }
    }
  }, [erudaLoaded, enabled]);

  return null; // This component doesn't render anything visible
}