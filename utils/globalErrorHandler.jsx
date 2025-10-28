// Global error handler for uncaught errors and unhandled promise rejections
import { logError } from './errorHandling';
import { toast } from './toast';

// Global error event handler
function handleGlobalError(error, source = 'Global') {
    try {
        console.error(`[${source}] Uncaught error:`, error);

        // Log the error with context
        logError(error, source, {
            isGlobal: true,
            timestamp: new Date().toISOString()
        });

        // Show user-friendly message - but only if toast is available
        if (typeof toast === 'function') {
            toast('An unexpected error occurred. Please restart the app if problems persist.', 'error');
        } else {
            console.warn('Toast not available for error notification');
        }
    } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
    }
}// Setup global error handlers
export function setupGlobalErrorHandlers() {
    try {
        // Web environment error handlers
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('error', (event) => {
                handleGlobalError(event.error || event, 'Window Error');
            });

            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                handleGlobalError(event.reason, 'Unhandled Promise Rejection');
                // Prevent the default behavior (logging to console)
                event.preventDefault();
            });
            console.log('Web error handlers initialized');
        }

        // React Native global error handler
        if (typeof global !== 'undefined' && global.ErrorUtils) {
            const originalHandler = global.ErrorUtils.getGlobalHandler();

            global.ErrorUtils.setGlobalHandler((error, isFatal) => {
                handleGlobalError(error, isFatal ? 'Fatal Error' : 'Non-Fatal Error');

                // Call the original handler to maintain default behavior
                if (originalHandler) {
                    originalHandler(error, isFatal);
                }
            });
            console.log('React Native error handlers initialized');
        }

        // Alternative promise rejection handling for React Native
        if (typeof global !== 'undefined') {
            // Set up a simple promise rejection handler
            const originalHandler = global.__onUnhandledRejection || (() => { });
            global.__onUnhandledRejection = (reason) => {
                handleGlobalError(reason, 'Unhandled Promise Rejection');
                if (originalHandler) originalHandler(reason);
            };
            console.log('Global promise rejection handler initialized');
        }

        console.log('Global error handlers initialization completed');

    } catch (setupError) {
        console.error('Failed to setup global error handlers:', setupError);
        // Don't throw - continue app initialization even if error handling setup fails
    }
}// Clean up error handlers (useful for testing)
export function removeGlobalErrorHandlers() {
    try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleGlobalError);
            console.log('Web error handlers removed');
        }

        // Clean up React Native global handlers
        if (typeof global !== 'undefined' && global.__onUnhandledRejection) {
            global.__onUnhandledRejection = null;
            console.log('Global error handlers cleaned up');
        }
    } catch (cleanupError) {
        console.warn('Error during error handler cleanup:', cleanupError);
    }
}

// Manual error reporting for critical errors
export function reportCriticalError(error, context, additionalData = {}) {
    logError(error, `CRITICAL: ${context}`, {
        ...additionalData,
        severity: 'critical',
        requiresAttention: true
    });

    // In production, you might want to send critical errors immediately
    // to your error reporting service or trigger alerts
    console.error('CRITICAL ERROR REPORTED:', error);
}

export default { setupGlobalErrorHandlers, removeGlobalErrorHandlers, reportCriticalError };