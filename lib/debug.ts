/**
 * Debug Logging Utility
 *
 * Environment-controlled logging for development and production.
 * In production, only errors and warnings are logged.
 * In development, all logs are enabled.
 *
 * Usage:
 * import { debug } from '@/lib/debug'
 *
 * debug.auth('User logged in', userId)
 * debug.api('Request received', '/api/users', 'GET')
 * debug.error('Something failed', error)
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const DEBUG_ENABLED = process.env.DEBUG === 'true' || isDevelopment

type LogLevel = 'auth' | 'api' | 'db' | 'error' | 'perf' | 'security'

const debug = {
  /**
   * Authentication logging (info in dev, silent in prod)
   */
  auth: (message: string, data?: any) => {
    if (DEBUG_ENABLED) {
      console.log(`[AUTH] ${message}`, data || '')
    }
  },

  /**
   * API logging (info in dev, silent in prod unless error)
   */
  api: (message: string, data?: any) => {
    if (DEBUG_ENABLED) {
      console.log(`[API] ${message}`, data || '')
    }
  },

  /**
   * Database logging (info in dev, silent in prod)
   */
  db: (message: string, data?: any) => {
    if (DEBUG_ENABLED) {
      console.log(`[DB] ${message}`, data || '')
    }
  },

  /**
   * Error logging (always logged)
   */
  error: (message: string, error?: Error | any, data?: any) => {
    console.error(`[ERROR] ${message}`, error || '', data || '')
  },

  /**
   * Performance logging (info in dev, silent in prod)
   */
  perf: (metric: string, value: number, unit: string = 'ms') => {
    if (DEBUG_ENABLED) {
      console.log(`[PERF] ${metric}: ${value}${unit}`)
    }
  },

  /**
   * Security logging (always logged)
   */
  security: (message: string, data?: any) => {
    console.warn(`[SECURITY] ${message}`, data || '')
  },

  /**
   * Warning logging (always logged)
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },

  /**
   * Generic logging (info in dev, silent in prod)
   */
  log: (message: string, data?: any) => {
    if (DEBUG_ENABLED) {
      console.log(`[LOG] ${message}`, data || '')
    }
  },
}

export default debug
