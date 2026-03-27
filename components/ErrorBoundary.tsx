'use client';

import React from 'react';

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
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops, terjadi kesalahan</h2>
        <p className="text-gray-600 mb-6">
          Maaf, halaman ini mengalami error. Silakan refresh halaman atau coba lagi nanti.
        </p>
        <div className="flex justify-center gap-3">
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
      </div>
    </div>
  );
}