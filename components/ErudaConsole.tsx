'use client';

import { useEffect, useState, useRef } from 'react';

interface ErudaConsoleProps {
  enabled?: boolean;
}

export default function ErudaConsole({ enabled = true }: ErudaConsoleProps) {
  const [erudaLoaded, setErudaLoaded] = useState(false);
  const logCaptureRef = useRef<any[]>([]);

  useEffect(() => {
    // Load on both mobile and desktop for debugging
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!enabled) {
      return;
    }

    // Enhanced console logging that works even if Eruda fails
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Capture all console logs
    const createEnhancedLogger = (type: 'log' | 'error' | 'warn' | 'info' | 'debug') => {
      return (...args: any[]) => {
        // Store logs for later display
        logCaptureRef.current.push({
          type,
          timestamp: new Date().toISOString(),
          args: args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
        });

        // Call original console method
        originalConsole[type](...args);

        // Also show in mobile debug panel if available
        if (isMobile && !erudaLoaded) {
          showMobileDebugPanel();
        }
      };
    };

    // Override console methods
    console.log = createEnhancedLogger('log');
    console.error = createEnhancedLogger('error');
    console.warn = createEnhancedLogger('warn');
    console.info = createEnhancedLogger('info');
    console.debug = createEnhancedLogger('debug');

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

    // Mobile debug panel fallback
    const showMobileDebugPanel = () => {
      if (document.getElementById('mobile-debug-panel')) return;

      const panel = document.createElement('div');
      panel.id = 'mobile-debug-panel';
      panel.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        font-family: monospace;
        font-size: 10px;
        z-index: 999999;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #444;
      `;
      header.innerHTML = `
        <span>🛠️ Mobile Debug Console</span>
        <button id="close-debug" style="background: #f44336; color: white; border: none; padding: 5px 10px; cursor: pointer;">Close</button>
      `;

      const logContainer = document.createElement('div');
      logContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      `;

      // Display captured logs
      const logs = logCaptureRef.current.slice(-50); // Show last 50 logs
      logContainer.textContent = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.args.join(' ')}`).join('\n\n');

      panel.appendChild(header);
      panel.appendChild(logContainer);
      document.body.appendChild(panel);

      // Close button functionality
      const closeBtn = document.getElementById('close-debug');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          panel.remove();
        });
      }

      // Auto-scroll to bottom
      logContainer.scrollTop = logContainer.scrollHeight;
    };

    // Try multiple methods to load eruda
    const loadEruda = async () => {
      try {
        console.log('📦 Attempting to load Eruda via CDN...');

        // Try CDN first (more reliable on mobile)
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/eruda@2.11.2/eruda.min.js';
        script.crossOrigin = 'anonymous';

        script.onload = () => {
          // @ts-ignore
          if (window.eruda) {
            console.log('✅ Eruda loaded successfully from CDN');
            try {
              // @ts-ignore
              window.eruda.init({
                defaults: {
                  displaySize: isMobile ? 50 : 70,
                  transparency: 0.9,
                  theme: 'Monokai'
                },
                tool: ['console', 'network', 'elements', 'resources']
              });

              // @ts-ignore
              window.eruda.show();

              setErudaLoaded(true);
              console.log('🛠️ Eruda debugging console initialized successfully!');

              // Remove mobile debug panel if it exists
              const mobilePanel = document.getElementById('mobile-debug-panel');
              if (mobilePanel) {
                mobilePanel.remove();
              }
            } catch (initError) {
              console.error('❌ Failed to initialize Eruda:', initError);
              showMobileDebugPanel();
            }
          }
        };

        script.onerror = () => {
          console.error('❌ Failed to load Eruda from CDN');
          showMobileDebugPanel();
        };

        document.head.appendChild(script);

      } catch (error) {
        console.error('❌ Failed to setup Eruda:', error);
        showMobileDebugPanel();
      }
    };

    // Load Eruda after a short delay
    const timeoutId = setTimeout(loadEruda, 500);

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
      // Restore original console methods
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
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
          // Show manual debug panel
          const panel = document.createElement('div');
          panel.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 10px;
            z-index: 999999;
            max-width: 300px;
            word-wrap: break-word;
          `;
          panel.innerHTML = `
            <div>❌ Eruda failed to load</div>
            <div style="margin-top: 5px; font-size: 9px;">Check browser console for details</div>
            <button onclick="this.parentElement.remove()" style="margin-top: 5px; background: #f44336; color: white; border: none; padding: 2px 5px; cursor: pointer; font-size: 9px;">Close</button>
          `;
          document.body.appendChild(panel);
          setTimeout(() => panel.remove(), 5000);
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