'use client';

import React, { useEffect, useState } from 'react';
import { Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void; errorInfo?: React.ErrorInfo }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Store error info in localStorage for debugging
    try {
      const errorData = {
        timestamp: new Date().toISOString(),
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        componentStack: errorInfo.componentStack,
      };
      localStorage.setItem('errorBoundaryDebugInfo', JSON.stringify(errorData));
    } catch (e) {
      console.error('Failed to store error info:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset, errorInfo }: { error?: Error; reset: () => void; errorInfo?: React.ErrorInfo }) {
  const [showDebug, setShowDebug] = useState(false);
  const [storedErrorInfo, setStoredErrorInfo] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('errorBoundaryDebugInfo');
      if (stored) {
        setStoredErrorInfo(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to read stored error info:', e);
    }
  }, []);

  // Combine current error with stored error info
  const debugInfo = storedErrorInfo || {
    timestamp: new Date().toISOString(),
    errorMessage: error?.message || 'Unknown error',
    errorStack: error?.stack,
    errorName: error?.name,
    componentStack: errorInfo?.componentStack,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops, terjadi kesalahan</h2>
        <p className="text-gray-600 mb-6">
          Maaf, halaman ini mengalami error. Silakan refresh halaman atau coba lagi nanti.
        </p>
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={reset}
            className="bg-green-900 hover:bg-green-800 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Ke Dashboard
          </button>
        </div>

        {/* Debug Toggle Button */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
        >
          <Bug className="w-3 h-3" />
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg text-left">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Error Debug Info
              </h3>
              <button
                onClick={() => {
                  localStorage.removeItem('errorBoundaryDebugInfo');
                  setStoredErrorInfo(null);
                }}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-gray-400">
                <span className="font-bold text-green-400">Timestamp:</span> {debugInfo.timestamp}
              </div>
              {debugInfo.errorName && (
                <div className="text-gray-400">
                  <span className="font-bold text-green-400">Error Name:</span> {debugInfo.errorName}
                </div>
              )}
              {debugInfo.errorMessage && (
                <div className="text-gray-400">
                  <span className="font-bold text-green-400">Message:</span>
                  <div className="text-red-300 mt-1 p-2 bg-red-900/30 rounded">
                    {debugInfo.errorMessage}
                  </div>
                </div>
              )}
              {debugInfo.componentStack && (
                <div className="text-gray-400">
                  <span className="font-bold text-green-400">Component Stack:</span>
                  <pre className="text-xs text-yellow-300 mt-1 p-2 bg-yellow-900/30 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                    {debugInfo.componentStack}
                  </pre>
                </div>
              )}
              {debugInfo.errorStack && (
                <div className="text-gray-400">
                  <span className="font-bold text-green-400">Stack Trace:</span>
                  <pre className="text-xs text-red-300 mt-1 p-2 bg-red-900/30 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                    {debugInfo.errorStack}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                alert('Debug info copied to clipboard');
              }}
              className="mt-3 w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded"
            >
              Copy Debug Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}