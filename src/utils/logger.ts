/**
 * Debug Logger Utility
 * Provides conditional logging based on environment variable
 * 
 * Set VITE_DEBUG=true in .env to enable debug logging
 */

/**
 * Check if debug mode is enabled
 */
const isDebugEnabled = (): boolean => {
  return import.meta.env.VITE_DEBUG === 'true';
};

/**
 * Log levels for categorizing messages
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Style configurations for different log levels
 */
const LOG_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6b7280; font-weight: normal;',
  info: 'color: #3b82f6; font-weight: bold;',
  warn: 'color: #f59e0b; font-weight: bold;',
  error: 'color: #ef4444; font-weight: bold;',
};

/**
 * Prefix for all log messages
 */
const LOG_PREFIX = '[FoodApp]';

/**
 * Debug logger object
 * All methods are no-ops when VITE_DEBUG is not 'true'
 */
export const logger = {
  /**
   * Log debug message (only in debug mode)
   */
  debug: (message: string, ...data: unknown[]): void => {
    if (isDebugEnabled()) {
      console.log(`%c${LOG_PREFIX} [DEBUG] ${message}`, LOG_STYLES.debug, ...data);
    }
  },

  /**
   * Log info message (only in debug mode)
   */
  info: (message: string, ...data: unknown[]): void => {
    if (isDebugEnabled()) {
      console.log(`%c${LOG_PREFIX} [INFO] ${message}`, LOG_STYLES.info, ...data);
    }
  },

  /**
   * Log warning message (only in debug mode)
   */
  warn: (message: string, ...data: unknown[]): void => {
    if (isDebugEnabled()) {
      console.warn(`%c${LOG_PREFIX} [WARN] ${message}`, LOG_STYLES.warn, ...data);
    }
  },

  /**
   * Log error message (always logged, but styled only in debug mode)
   */
  error: (message: string, ...data: unknown[]): void => {
    if (isDebugEnabled()) {
      console.error(`%c${LOG_PREFIX} [ERROR] ${message}`, LOG_STYLES.error, ...data);
    } else {
      // Always log errors, but without styling
      console.error(`${LOG_PREFIX} [ERROR] ${message}`, ...data);
    }
  },

  /**
   * Log API request (only in debug mode)
   */
  api: (method: string, url: string, data?: unknown): void => {
    if (isDebugEnabled()) {
      console.groupCollapsed(`%c${LOG_PREFIX} [API] ${method} ${url}`, 'color: #8b5cf6; font-weight: bold;');
      if (data !== undefined) {
        console.log('Request data:', data);
      }
      console.groupEnd();
    }
  },

  /**
   * Log API response (only in debug mode)
   */
  apiResponse: (method: string, url: string, status: number, data?: unknown): void => {
    if (isDebugEnabled()) {
      const color = status >= 400 ? '#ef4444' : '#10b981';
      console.groupCollapsed(`%c${LOG_PREFIX} [API Response] ${method} ${url} - ${status}`, `color: ${color}; font-weight: bold;`);
      if (data !== undefined) {
        console.log('Response data:', data);
      }
      console.groupEnd();
    }
  },

  /**
   * Log state changes (only in debug mode)
   */
  state: (storeName: string, action: string, data?: unknown): void => {
    if (isDebugEnabled()) {
      console.groupCollapsed(`%c${LOG_PREFIX} [State] ${storeName}.${action}`, 'color: #ec4899; font-weight: bold;');
      if (data !== undefined) {
        console.log('Data:', data);
      }
      console.groupEnd();
    }
  },

  /**
   * Log component lifecycle (only in debug mode)
   */
  component: (componentName: string, event: string, data?: unknown): void => {
    if (isDebugEnabled()) {
      console.log(`%c${LOG_PREFIX} [Component] ${componentName} - ${event}`, 'color: #14b8a6;', data ?? '');
    }
  },

  /**
   * Create a performance timer (only in debug mode)
   */
  time: (label: string): void => {
    if (isDebugEnabled()) {
      console.time(`${LOG_PREFIX} ${label}`);
    }
  },

  /**
   * End a performance timer (only in debug mode)
   */
  timeEnd: (label: string): void => {
    if (isDebugEnabled()) {
      console.timeEnd(`${LOG_PREFIX} ${label}`);
    }
  },

  /**
   * Log a table of data (only in debug mode)
   */
  table: (data: unknown[], columns?: string[]): void => {
    if (isDebugEnabled()) {
      if (columns) {
        console.table(data, columns);
      } else {
        console.table(data);
      }
    }
  },
};

export default logger;
