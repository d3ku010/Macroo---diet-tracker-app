// Enhanced error handling wrapper for Supabase operations
import { toast } from './toast';

// Error types and their handling
const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    AUTH: 'AUTH_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    SERVER: 'SERVER_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
};

// User-friendly error messages
const ERROR_MESSAGES = {
    [ERROR_TYPES.NETWORK]: 'Network connection failed. Please check your internet connection.',
    [ERROR_TYPES.AUTH]: 'Authentication failed. Please log in again.',
    [ERROR_TYPES.PERMISSION]: 'You don\'t have permission to perform this action.',
    [ERROR_TYPES.VALIDATION]: 'Invalid data provided. Please check your input.',
    [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
    [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Classify error based on error object or message
function classifyError(error) {
    if (!error) return ERROR_TYPES.UNKNOWN;

    const message = error.message || error.toString();
    const code = error.code || error.status;

    // Network-related errors
    if (message.includes('fetch') ||
        message.includes('network') ||
        message.includes('NetworkError') ||
        message.includes('Failed to fetch') ||
        code === 'ERR_NETWORK') {
        return ERROR_TYPES.NETWORK;
    }

    // Timeout errors
    if (message.includes('timeout') ||
        message.includes('TIMEOUT') ||
        code === 'TIMEOUT') {
        return ERROR_TYPES.TIMEOUT;
    }

    // Authentication errors
    if (message.includes('auth') ||
        message.includes('unauthorized') ||
        code === 401 ||
        code === 'UNAUTHORIZED') {
        return ERROR_TYPES.AUTH;
    }

    // Permission errors
    if (message.includes('permission') ||
        message.includes('forbidden') ||
        code === 403 ||
        code === 'FORBIDDEN') {
        return ERROR_TYPES.PERMISSION;
    }

    // Validation errors
    if (message.includes('validation') ||
        message.includes('invalid') ||
        code === 400 ||
        code === 'BAD_REQUEST') {
        return ERROR_TYPES.VALIDATION;
    }

    // Server errors
    if (code >= 500 ||
        message.includes('server') ||
        message.includes('internal')) {
        return ERROR_TYPES.SERVER;
    }

    return ERROR_TYPES.UNKNOWN;
}

// Get user-friendly error message
function getUserFriendlyMessage(error, customMessage = null) {
    if (customMessage) return customMessage;

    const errorType = classifyError(error);
    return ERROR_MESSAGES[errorType];
}

// Enhanced error logger
function logError(error, context, additionalData = {}) {
    const errorData = {
        timestamp: new Date().toISOString(),
        context,
        error: {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            code: error?.code || error?.status,
            name: error?.name
        },
        additionalData,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location?.href : 'React Native App'
    };

    console.error(`[${context}] Error:`, errorData);

    // In production, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { extra: errorData });

    return errorData;
}

// Wrapper for Supabase operations with comprehensive error handling
export async function withErrorHandling(
    operation,
    context = 'Database Operation',
    options = {}
) {
    const {
        timeout = 10000,
        retries = 1,
        showToast = true,
        customErrorMessage = null,
        fallbackValue = null,
        validateResult = null
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Operation timed out')), timeout);
            });

            // Execute operation with timeout
            const result = await Promise.race([
                operation(),
                timeoutPromise
            ]);

            // Validate result if validator provided
            if (validateResult && !validateResult(result)) {
                throw new Error('Invalid result received from operation');
            }

            return result;

        } catch (error) {
            lastError = error;

            // Log the error
            const errorData = logError(error, context, {
                attempt: attempt + 1,
                maxAttempts: retries + 1
            });

            // If this is not the last attempt, wait before retrying
            if (attempt < retries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
                console.log(`Retrying ${context} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // This was the last attempt, handle the error
            const errorType = classifyError(error);
            const userMessage = getUserFriendlyMessage(error, customErrorMessage);

            if (showToast) {
                // Don't show toast for certain error types that should be handled silently
                if (errorType !== ERROR_TYPES.AUTH) {
                    toast(userMessage, 'error');
                }
            }

            // For critical errors, you might want to redirect or take special action
            if (errorType === ERROR_TYPES.AUTH) {
                // Handle authentication errors (e.g., redirect to login)
                console.warn('Authentication error detected, user may need to re-login');
            }

            // Return fallback value if provided, otherwise rethrow
            if (fallbackValue !== null) {
                console.log(`Returning fallback value for ${context}:`, fallbackValue);
                return fallbackValue;
            }

            throw error;
        }
    }
}

// Specific wrapper for data fetching operations
export async function withDataFetching(operation, context, fallbackValue = []) {
    return withErrorHandling(operation, context, {
        timeout: 8000,
        retries: 2,
        fallbackValue,
        validateResult: (result) => result !== undefined && result !== null
    });
}

// Specific wrapper for data mutation operations
export async function withDataMutation(operation, context, successMessage = null) {
    const result = await withErrorHandling(operation, context, {
        timeout: 12000,
        retries: 1,
        showToast: false // We'll handle success/error messages manually
    });

    if (successMessage) {
        toast(successMessage, 'success');
    }

    return result;
}

// Export error types for use in other files
export { classifyError, ERROR_MESSAGES, ERROR_TYPES, getUserFriendlyMessage, logError };

