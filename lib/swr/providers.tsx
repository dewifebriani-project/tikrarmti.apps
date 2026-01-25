'use client'

import React from 'react'
import { SWRConfig } from 'swr'
import { SWRConfiguration } from 'swr/_internal'
import { swrConfig } from './config'

/**
 * Props for SWRProvider component
 */
interface SWRProviderProps {
  children: React.ReactNode
  value?: SWRConfiguration
}

/**
 * Error Boundary for handling SWR errors gracefully
 */
class SWRErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SWR Error Boundary caught an error:', error, errorInfo)

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement error reporting
      // trackError(error, { context: 'swr-provider', errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-red-600 mb-4">
              Please refresh the page and try again
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Loading component for SWR loading states
 */
export function SWRLoadingFallback({
  type = 'default'
}: {
  type?: 'default' | 'skeleton' | 'spinner'
}) {
  switch (type) {
    case 'skeleton':
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )

    case 'spinner':
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )

    default:
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      )
  }
}

/**
 * Error component for SWR error states
 */
export function SWRErrorFallback({
  error,
  onRetry
}: {
  error: Error | { message?: string; code?: string; details?: string };
  onRetry?: () => void
}) {
  // Get error message from various error formats
  const getErrorMessage = (err: typeof error): string => {
    if (err instanceof Error) {
      return err.message
    }
    if (typeof err === 'object' && err !== null) {
      if (err.message) return err.message
      if (err.details) return err.details
      if (err.code) return `Error: ${err.code}`
    }
    return 'An unexpected error occurred'
  }

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Error loading data
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {getErrorMessage(error)}
          </p>
          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="text-sm bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * SWR Provider component with error boundaries and fallbacks
 *
 * Provides:
 * - Global SWR configuration
 * - Error boundary for graceful error handling
 * - Default loading and error components
 * - Performance optimizations
 */
export function SWRProvider({ children, value }: SWRProviderProps) {
  // Merge custom config with default config
  const mergedConfig: SWRConfiguration = {
    ...swrConfig,
    ...value,
  }

  return (
    <SWRErrorBoundary>
      <SWRConfig value={mergedConfig}>
        {children}
      </SWRConfig>
    </SWRErrorBoundary>
  )
}

/**
 * Hook for creating consistent fetcher options
 */
export function useFetcherOptions(additionalOptions?: RequestInit) {
  return {
    // Add common headers and options
    headers: {
      'Accept': 'application/json',
      ...additionalOptions?.headers,
    },
    ...additionalOptions,
  }
}

/**
 * Provider with development tools
 * Includes additional debugging and monitoring features in development
 */
export function SWRProviderWithDevTools({
  children,
  value
}: SWRProviderProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const devConfig: SWRConfiguration = isDevelopment ? {
    // Enable dev mode features
    errorRetryCount: 1, // Fewer retries in development
    loadingTimeout: 2000, // Shorter timeout in development

    // Add dev mode logging
    onError: (error: any, key: any) => {
      console.group(`🔴 SWR Error: ${key}`)
      console.error(error)
      console.trace('Stack trace')
      console.groupEnd()
    },

    onSuccess: (data: any, key: any) => {
      console.group(`🟢 SWR Success: ${key}`)
      console.log(data)
      console.groupEnd()
    },
  } : {}

  const mergedConfig: SWRConfiguration = {
    ...swrConfig,
    ...value,
    ...devConfig,
  }

  return (
    <SWRErrorBoundary>
      <SWRConfig value={mergedConfig}>
        {children}

        {/* Dev tools overlay in development */}
        {isDevelopment && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-gray-900 text-white text-xs p-2 rounded shadow-lg opacity-75">
              SWR Dev Mode
            </div>
          </div>
        )}
      </SWRConfig>
    </SWRErrorBoundary>
  )
}

/**
 * Provider with offline support
 * Adds offline detection and fallbacks
 */
export function SWRProviderWithOffline({
  children,
  value
}: SWRProviderProps) {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Modify configuration for offline mode
  const offlineConfig: SWRConfiguration = {
    // Disable revalidation when offline
    revalidateOnFocus: isOnline,
    revalidateOnReconnect: true,

    // Custom error handling for offline
    onError: (error: any, key: any) => {
      // Don't show network errors when offline
      if (!isOnline && error?.message?.includes('fetch')) {
        console.warn(`Offline mode: ${key} - cached data shown`)
        return
      }
    },
  }

  const mergedConfig: SWRConfiguration = {
    ...swrConfig,
    ...value,
    ...offlineConfig,
  }

  return (
    <SWRErrorBoundary>
      <SWRConfig value={mergedConfig}>
        {/* Offline indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black text-center py-1 text-sm">
            You are offline. Showing cached data.
          </div>
        )}

        {children}
      </SWRConfig>
    </SWRErrorBoundary>
  )
}

export default SWRProvider