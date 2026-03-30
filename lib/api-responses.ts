import { NextResponse } from 'next/server'
import { ApiResponseBuilder } from './api-wrapper'
import { z } from 'zod'

/**
 * Utility functions for Next.js API routes that combine ApiResponseBuilder with NextResponse
 */

export const ApiResponses = {
  /**
   * Create success response
   */
  success: <T>(data: T, message?: string, statusCode: number = 200) => {
    const response = ApiResponseBuilder.success(data, message)
    return NextResponse.json(response, { status: statusCode })
  },

  /**
   * Create paginated response
   */
  paginated: <T>(
    data: T[],
    pagination: {
      page: number
      limit: number
      total: number
    },
    message?: string,
    statusCode: number = 200
  ) => {
    const response = ApiResponseBuilder.paginated(data, pagination, message)
    return NextResponse.json(response, { status: statusCode })
  },

  /**
   * Create error response
   */
  error: (
    code: string,
    message: string,
    details?: Record<string, unknown> | unknown,
    statusCode: number = 500
  ) => {
    const response = ApiResponseBuilder.error(code, message, details, statusCode)
    return NextResponse.json(response, { status: statusCode })
  },

  /**
   * Create validation error
   */
  validationError: (details: z.ZodIssue[]) => {
    const response = ApiResponseBuilder.validationError(details)
    return NextResponse.json(response, { status: 400 })
  },

  /**
   * Create validation error with custom format
   */
  customValidationError: (details: Array<{field: string; message: string; code: string}>) => {
    const zodIssues: z.ZodIssue[] = details.map(detail => ({
      code: z.ZodIssueCode.custom,
      path: [detail.field],
      message: detail.message
    }))
    const response = ApiResponseBuilder.validationError(zodIssues)
    return NextResponse.json(response, { status: 400 })
  },

  /**
   * Create not found error
   */
  notFound: (message: string = 'Resource not found') => {
    const response = ApiResponseBuilder.notFound(message)
    return NextResponse.json(response, { status: 404 })
  },

  /**
   * Create unauthorized error
   */
  unauthorized: (message: string = 'Unauthorized') => {
    const response = ApiResponseBuilder.unauthorized(message)
    return NextResponse.json(response, { status: 401 })
  },

  /**
   * Create forbidden error
   */
  forbidden: (message: string = 'Forbidden') => {
    const response = ApiResponseBuilder.forbidden(message)
    return NextResponse.json(response, { status: 403 })
  },

  /**
   * Create conflict error
   */
  conflict: (message: string = 'Resource conflict') => {
    const response = ApiResponseBuilder.conflict(message)
    return NextResponse.json(response, { status: 409 })
  },

  /**
   * Create rate limit error
   */
  rateLimit: (message: string = 'Rate limit exceeded') => {
    const response = ApiResponseBuilder.rateLimit(message)
    return NextResponse.json(response, { status: 429 })
  },

  /**
   * Create server error
   */
  serverError: (message: string = 'Internal server error') => {
    const response = ApiResponseBuilder.serverError(message)
    return NextResponse.json(response, { status: 500 })
  },

  /**
   * Handle Supabase error with safe message (no sensitive data exposure)
   */
  databaseError: (error: { code?: string; message?: string; details?: string } | null | undefined) => {
    // Log full error for debugging (server-side only)
    if (error) {
      console.error('[Database Error]', JSON.stringify(error))
    }

    // Return safe message to client
    const response = ApiResponseBuilder.error(
      'DATABASE_ERROR',
      'A database error occurred. Please try again later.',
      undefined,
      500
    )
    return NextResponse.json(response, { status: 500 })
  },

  /**
   * Handle unknown errors safely
   */
  handleUnknown: (error: unknown) => {
    // Log full error for debugging (server-side only)
    console.error('[Unknown Error]', error)

    // Return safe message to client
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    const response = ApiResponseBuilder.error(
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again later.',
      process.env.NODE_ENV === 'development' ? { message } : undefined,
      500
    )
    return NextResponse.json(response, { status: 500 })
  }
}