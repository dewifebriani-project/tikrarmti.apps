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
      // Remove existing button if present
      const existingBtn = document.getElementById('eruda-trigger');
      if (existingBtn) {
        existingBtn.remove();
      }

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
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        z-index: 999999;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, monospace;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      `;

      // Add hover effects
      triggerButton.onmouseover = () => {
        triggerButton.style.transform = 'scale(1.05)';
        triggerButton.style.background = '#45a049';
      };

      triggerButton.onmouseout = () => {
        triggerButton.style.transform = 'scale(1)';
        triggerButton.style.background = '#4CAF50';
      };

      triggerButton.onclick = async () => {
        try {
          console.log('🛠️ Manual Eruda trigger clicked');

          // Try direct global eruda first
          if ((window as any).eruda) {
            console.log('✅ Found global eruda, initializing...');
            (window as any).eruda.init();
            (window as any).eruda.show();
            triggerButton.remove();
            return;
          }

          // Try loading via script tag
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/eruda@2.11.2/eruda.min.js';
          script.onload = () => {
            console.log('✅ Eruda loaded via manual trigger');
            if ((window as any).eruda) {
              (window as any).eruda.init({
                defaults: {
                  displaySize: 50,
                  transparency: 0.9
                }
              });
              (window as any).eruda.show();
              triggerButton.remove();
            }
          };
          script.onerror = () => {
            console.error('❌ Failed to load Eruda manually');
            showMobileDebugPanel();
          };
          document.head.appendChild(script);

        } catch (error) {
          console.error('Failed to load Eruda manually:', error);
          showMobileDebugPanel();
        }
      };

      document.body.appendChild(triggerButton);

      // Auto-click on mobile after 2 seconds to draw attention
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobile) {
        setTimeout(() => {
          if (document.getElementById('eruda-trigger')) {
            // Make button pulse to draw attention
            triggerButton.style.animation = 'pulse 2s infinite';
            const style = document.createElement('style');
            style.textContent = `
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            `;
            document.head.appendChild(style);
          }
        }, 2000);
      }

      // Show mobile debug panel as helper function
      const showMobileDebugPanel = () => {
        if (document.getElementById('mobile-debug-helper')) return;

        const panel = document.createElement('div');
        panel.id = 'mobile-debug-helper';
        panel.style.cssText = `
          position: fixed;
          top: 70px;
          right: 10px;
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 11px;
          z-index: 999998;
          max-width: 350px;
          word-wrap: break-word;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        panel.innerHTML = `
          <div style="margin-bottom: 10px; font-weight: bold;">🔍 Debug Helper</div>
          <div style="margin-bottom: 10px;">Console logs available in browser's native console:</div>
          <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; margin-bottom: 10px; font-size: 10px;">
            • Android: Chrome Menu → More Tools → Developer Tools<br>
            • iPhone: Settings → Safari → Advanced → Web Inspector<br>
            • Or connect to desktop and debug via USB
          </div>
          <button onclick="this.parentElement.remove()" style="
            background: #f44336;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 10px;
          ">Close</button>
        `;
        document.body.appendChild(panel);

        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (document.getElementById('mobile-debug-helper')) {
            panel.remove();
          }
        }, 10000);
      };

      // Remove button after Eruda loads
      if (erudaLoaded) {
        triggerButton.remove();
      }
    }
  }, [erudaLoaded, enabled]);

  return null; // This component doesn't render anything visible
}