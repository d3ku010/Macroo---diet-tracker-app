/**
 * Centralized Error Handling System
 * Production-ready error management with user-friendly messaging
 */

import { CONFIG } from '../config/environment';

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Error categories
export const ERROR_CATEGORIES = {
    NETWORK: 'NETWORK',
    AUTH: 'AUTH',
    VALIDATION: 'VALIDATION',
    PERMISSION: 'PERMISSION',
    SERVER: 'SERVER',
    CLIENT: 'CLIENT',
    UNKNOWN: 'UNKNOWN'
};

// User-friendly error messages
const ERROR_MESSAGES = {
    [ERROR_CATEGORIES.NETWORK]: {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
        action: 'Retry'
    },
    [ERROR_CATEGORIES.AUTH]: {
        title: 'Authentication Required',
        message: 'Please sign in to continue.',
        action: 'Sign In'
    },
    [ERROR_CATEGORIES.VALIDATION]: {
        title: 'Invalid Input',
        message: 'Please check your information and try again.',
        action: 'Fix'
    },
    [ERROR_CATEGORIES.PERMISSION]: {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'Contact Support'
    },
    [ERROR_CATEGORIES.SERVER]: {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'Retry Later'
    },
    [ERROR_CATEGORIES.CLIENT]: {
        title: 'Application Error',
        message: 'Something went wrong. Please restart the app.',
        action: 'Restart'
    },
    [ERROR_CATEGORIES.UNKNOWN]: {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Retry'
    }
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
    constructor(message, category = ERROR_CATEGORIES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, originalError = null) {
        super(message);
        this.name = 'AppError';
        this.category = category;
        this.severity = severity;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
        this.userAgent = navigator?.userAgent || 'unknown';
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            category: this.category,
            severity: this.severity,
            timestamp: this.timestamp,
            stack: this.stack,
            originalError: this.originalError?.message,
            userAgent: this.userAgent
        };
    }
}

/**
 * Classify error based on error object or message
 */
export const classifyError = (error) => {
    if (!error) return ERROR_CATEGORIES.UNKNOWN;

    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.statusCode;

    // Network errors
    if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        status === 0
    ) {
        return ERROR_CATEGORIES.NETWORK;
    }

    // Authentication errors
    if (
        message.includes('auth') ||
        message.includes('unauthorized') ||
        message.includes('token') ||
        status === 401
    ) {
        return ERROR_CATEGORIES.AUTH;
    }

    // Validation errors
    if (
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        status === 400
    ) {
        return ERROR_CATEGORIES.VALIDATION;
    }

    // Permission errors
    if (
        message.includes('permission') ||
        message.includes('forbidden') ||
        message.includes('access denied') ||
        status === 403
    ) {
        return ERROR_CATEGORIES.PERMISSION;
    }

    // Server errors
    if (status >= 500 || message.includes('server')) {
        return ERROR_CATEGORIES.SERVER;
    }

    // Client errors
    if (status >= 400 && status < 500) {
        return ERROR_CATEGORIES.CLIENT;
    }

    return ERROR_CATEGORIES.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error) => {
    const category = error instanceof AppError ? error.category : classifyError(error);
    return ERROR_MESSAGES[category] || ERROR_MESSAGES[ERROR_CATEGORIES.UNKNOWN];
};

/**
 * Enhanced error logger with different log levels
 */
export const logError = (error, context = '', additionalData = {}) => {
    const errorData = {
        timestamp: new Date().toISOString(),
        context,
        error: error instanceof AppError ? error.toJSON() : {
            name: error?.name || 'Error',
            message: error?.message || 'Unknown error',
            stack: error?.stack
        },
        additionalData,
        environment: CONFIG.IS_DEV ? 'development' : 'production'
    };

    // Log based on environment and severity
    if (CONFIG.IS_DEV) {
        console.group('🚨 Error Details');
        console.error('Context:', context);
        console.error('Error:', error);
        console.error('Additional Data:', additionalData);
        console.groupEnd();
    }

    // In production, send to monitoring service (Sentry, etc.)
    if (CONFIG.IS_PROD && CONFIG.SENTRY_DSN) {
        // This would integrate with Sentry or other monitoring service
        // Sentry.captureException(error, { tags: { context }, extra: additionalData });
    }

    return errorData;
};

/**
 * Async wrapper with error handling
 */
export const withErrorHandling = (asyncFn, context = '', showUserError = true) => {
    return async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            const appError = error instanceof AppError ? error : new AppError(
                error.message,
                classifyError(error),
                ERROR_SEVERITY.MEDIUM,
                error
            );

            logError(appError, context);

            if (showUserError) {
                const userError = getUserFriendlyError(appError);
                // This would show toast/alert to user
                // toast.error(userError.message, { title: userError.title });
            }

            throw appError;
        }
    };
};

/**
 * Create specific error types
 */
export const createNetworkError = (message, originalError) =>
    new AppError(message, ERROR_CATEGORIES.NETWORK, ERROR_SEVERITY.HIGH, originalError);

export const createAuthError = (message, originalError) =>
    new AppError(message, ERROR_CATEGORIES.AUTH, ERROR_SEVERITY.HIGH, originalError);

export const createValidationError = (message, originalError) =>
    new AppError(message, ERROR_CATEGORIES.VALIDATION, ERROR_SEVERITY.MEDIUM, originalError);

export const createServerError = (message, originalError) =>
    new AppError(message, ERROR_CATEGORIES.SERVER, ERROR_SEVERITY.HIGH, originalError);

/**
 * React Error Boundary helper
 */
export const createErrorBoundaryFallback = (error, errorInfo) => ({
    hasError: true,
    error,
    errorInfo,
    timestamp: new Date().toISOString()
});

export default {
    AppError,
    ERROR_SEVERITY,
    ERROR_CATEGORIES,
    classifyError,
    getUserFriendlyError,
    logError,
    withErrorHandling,
    createNetworkError,
    createAuthError,
    createValidationError,
    createServerError
};