type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  error?: Error;
}

class SecureLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private sanitizeData(data: any): any {
    if (!data || this.isDevelopment) {
      return data;
    }

    // Remove sensitive information from logs in production
    const sensitiveFields = [
      'password',
      'password_hash',
      'token',
      'secret',
      'key',
      'auth',
      'authorization',
      'cookie',
      'session',
      'jwt'
    ];

    const sanitized = { ...data };

    // Recursively sanitize nested objects
    const sanitize = (obj: any, path: string = ''): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => sanitize(item, `${path}[${index}]`));
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        const keyLower = key.toLowerCase();

        // Check if this is a sensitive field
        const isSensitive = sensitiveFields.some(field =>
          keyLower.includes(field.toLowerCase()) ||
          fullPath.toLowerCase().includes(field.toLowerCase())
        );

        if (isSensitive && value) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitize(value, fullPath);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitize(sanitized);
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
      error: this.isDevelopment ? error : undefined
    };

    // In production, only log errors and warnings
    if (!this.isDevelopment && !['error', 'warn'].includes(level)) {
      return;
    }

    // Format log message
    const logMessage = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage);
        if (this.isDevelopment && error) {
          console.error('Error details:', error);
        }
        if (entry.data) {
          console.error('Data:', entry.data);
        }
        break;
      case 'warn':
        console.warn(logMessage);
        if (entry.data) {
          console.warn('Data:', entry.data);
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(logMessage);
          if (entry.data) {
            console.info('Data:', entry.data);
          }
        }
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage);
          if (entry.data) {
            console.debug('Data:', entry.data);
          }
        }
        break;
    }
  }

  error(message: string, data?: any, error?: Error): void {
    this.log('error', message, data, error);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  // Security-specific logging methods
  security(message: string, data: { ip: string; endpoint: string; userAgent?: string }): void {
    this.warn(`[SECURITY] ${message}`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  auth(message: string, userId?: string, data?: any): void {
    this.info(`[AUTH] ${message}`, {
      userId: userId ? userId.substring(0, 8) + '...' : 'anonymous',
      ...this.sanitizeData(data)
    });
  }

  api(message: string, method: string, endpoint: string, statusCode?: number, data?: any): void {
    if (this.isDevelopment || (statusCode && statusCode >= 400)) {
      this.info(`[API] ${message}`, {
        method,
        endpoint,
        statusCode,
        ...this.sanitizeData(data)
      });
    }
  }
}

// Export singleton instance
export const logger = new SecureLogger();