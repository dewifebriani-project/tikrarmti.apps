import { z } from 'zod'
import { apiResponseSchemas } from './schemas'

/**
 * Standard API Response Types
 */
export interface ApiResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

export interface PaginatedResponse<T = any> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  message?: string
  timestamp: string
}

/**
 * API Response Builder
 */
export class ApiResponseBuilder {
  /**
   * Create success response
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: Omit<PaginatedResponse<T>['pagination'], 'totalPages' | 'hasNext' | 'hasPrev'> & {
      total: number
    },
    message?: string
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(pagination.total / pagination.limit)
    const hasNext = pagination.page < totalPages
    const hasPrev = pagination.page > 1

    return {
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages,
        hasNext,
        hasPrev,
      },
      message: message || 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Create error response
   */
  static error(
    code: string,
    message: string,
    details?: any,
    statusCode: number = 500
  ): ApiError & { statusCode: number } {
    const error: ApiError & { statusCode: number } = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
      statusCode,
    }
    return error
  }

  /**
   * Create validation error
   */
  static validationError(details: z.ZodIssue[]): ApiError & { statusCode: number } {
    return this.error(
      'VALIDATION_ERROR',
      'Data validation failed',
      {
        issues: details.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      },
      400
    )
  }

  /**
   * Create not found error
   */
  static notFound(message: string = 'Resource not found'): ApiError & { statusCode: number } {
    return this.error('NOT_FOUND', message, undefined, 404)
  }

  /**
   * Create unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized'): ApiError & { statusCode: number } {
    return this.error('UNAUTHORIZED', message, undefined, 401)
  }

  /**
   * Create forbidden error
   */
  static forbidden(message: string = 'Forbidden'): ApiError & { statusCode: number } {
    return this.error('FORBIDDEN', message, undefined, 403)
  }

  /**
   * Create conflict error
   */
  static conflict(message: string = 'Resource conflict'): ApiError & { statusCode: number } {
    return this.error('CONFLICT', message, undefined, 409)
  }

  /**
   * Create rate limit error
   */
  static rateLimit(message: string = 'Rate limit exceeded'): ApiError & { statusCode: number } {
    return this.error('RATE_LIMIT', message, undefined, 429)
  }

  /**
   * Create server error
   */
  static serverError(message: string = 'Internal server error'): ApiError & { statusCode: number } {
    return this.error('SERVER_ERROR', message, undefined, 500)
  }
}

/**
 * Express.js Response Helpers
 */
export const sendSuccess = <T>(
  res: any,
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  const response = ApiResponseBuilder.success(data, message)
  return res.status(statusCode).json(response)
}

export const sendPaginated = <T>(
  res: any,
  data: T[],
  pagination: Omit<PaginatedResponse<T>['pagination'], 'totalPages' | 'hasNext' | 'hasPrev'> & {
    total: number
  },
  message?: string,
  statusCode: number = 200
) => {
  const response = ApiResponseBuilder.paginated(data, pagination, message)
  return res.status(statusCode).json(response)
}

export const sendError = (
  res: any,
  error: ApiError & { statusCode: number }
) => {
  return res.status(error.statusCode).json(error)
}

/**
 * Next.js API Route Helpers
 */
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  const response = ApiResponseBuilder.success(data, message)
  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export const createErrorResponse = (
  error: ApiError & { statusCode: number }
) => {
  return new Response(JSON.stringify(error), {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Response Validation
 */
export const validateApiResponse = <T>(data: unknown, schema: z.ZodType<T>) => {
  const result = apiResponseSchemas.success(schema).safeParse(data)

  if (!result.success) {
    console.error('Invalid API response format:', result.error)
    return null
  }

  return result.data
}

export const validateApiError = (data: unknown): ApiError | null => {
  const result = apiResponseSchemas.error.safeParse(data)

  if (!result.success) {
    console.error('Invalid API error format:', result.error)
    return null
  }

  return result.data
}

/**
 * Error Code Constants
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * HTTP Status Code Constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Error Message Templates
 */
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred while processing your request',
  VALIDATION: 'Please check your input and try again',
  UNAUTHORIZED: 'You need to be logged in to access this resource',
  FORBIDDEN: 'You don\'t have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'The resource already exists or is in conflict',
  RATE_LIMIT: 'Too many requests. Please try again later',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later',
} as const