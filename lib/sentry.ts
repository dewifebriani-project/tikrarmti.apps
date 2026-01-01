/**
 * Sentry Configuration
 *
 * Error tracking and performance monitoring for production.
 * Only initialized when SENTRY_DSN is configured.
 *
 * Environment variables:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN for client-side errors
 * - SENTRY_AUTH_TOKEN: Auth token for server-side Sentry
 */

import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,

  // Enable performance monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Filter out sensitive data
  beforeSend(event: any) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Remove sensitive data from request
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }

    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter((breadcrumb: any) => {
        // Filter out auth-related breadcrumbs
        if (breadcrumb.category === 'auth' || breadcrumb.category === 'http') {
          return false
        }
        return true
      })
    }

    return event
  },

  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
})

/**
 * Capture error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  })
}

/**
 * Capture message with level
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  })
}

/**
 * Set user context
 */
export function setSentryUser(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  })
}

/**
 * Clear user context
 */
export function clearSentryUser() {
  Sentry.setUser(null)
}

export { Sentry }
