/**
 * Error Handler Tests
 * Test error handling, classification, and recovery
 */

import { createAuthError, createNetworkError, createUserError, createValidationError, errorHandler } from '../utils/errorHandler';

describe('ErrorHandler', () => {
    beforeEach(() => {
        errorHandler.initialize();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Error Creation', () => {
        test('should create user error with correct properties', () => {
            const error = createUserError('Test message', 'TEST_CODE');

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe('Test message');
            expect(error.code).toBe('TEST_CODE');
            expect(error.type).toBe('USER_ERROR');
            expect(error.userFriendly).toBe(true);
        });

        test('should create validation error with details', () => {
            const originalError = new Error('Validation failed');
            const error = createValidationError('Invalid data', originalError);

            expect(error.type).toBe('VALIDATION_ERROR');
            expect(error.originalError).toBe(originalError);
        });

        test('should create network error with status code', () => {
            const error = createNetworkError('Network request failed', 500);

            expect(error.type).toBe('NETWORK_ERROR');
            expect(error.statusCode).toBe(500);
        });

        test('should create auth error with auth code', () => {
            const error = createAuthError('Authentication failed', 'INVALID_TOKEN');

            expect(error.type).toBe('AUTH_ERROR');
            expect(error.authCode).toBe('INVALID_TOKEN');
        });
    });

    describe('Error Handling', () => {
        test('should handle user errors correctly', () => {
            const userError = createUserError('Something went wrong', 'USER_ACTION_FAILED');
            const handledError = errorHandler.handleError(userError);

            expect(handledError.message).toBe('Something went wrong');
            expect(handledError.userFriendly).toBe(true);
        });

        test('should convert generic errors to user-friendly messages', () => {
            const genericError = new Error('Database connection failed');
            const handledError = errorHandler.handleError(genericError);

            expect(handledError.userFriendly).toBe(true);
            expect(handledError.message).toContain('unexpected error');
        });

        test('should handle network errors with retry suggestions', () => {
            const networkError = createNetworkError('Request timeout', 408);
            const handledError = errorHandler.handleError(networkError);

            expect(handledError.message).toContain('network');
            expect(handledError.canRetry).toBe(true);
        });

        test('should handle validation errors with field details', () => {
            const validationError = createValidationError('Email is required');
            const handledError = errorHandler.handleError(validationError);

            expect(handledError.type).toBe('VALIDATION_ERROR');
            expect(handledError.message).toContain('Email is required');
        });
    });

    describe('Error Classification', () => {
        test('should classify errors by severity', () => {
            const criticalError = new Error('Database corrupted');
            const handledError = errorHandler.handleError(criticalError, { level: 'fatal' });

            expect(handledError.level).toBe('fatal');
        });

        test('should add context to errors', () => {
            const error = new Error('Test error');
            const context = { component: 'TestComponent', action: 'save' };
            const handledError = errorHandler.handleError(error, { context });

            expect(handledError.context).toEqual(context);
        });
    });

    describe('Error Recovery', () => {
        test('should provide recovery suggestions for network errors', () => {
            const networkError = createNetworkError('Connection failed', 0);
            const handledError = errorHandler.handleError(networkError);

            expect(handledError.recovery).toBeDefined();
            expect(handledError.recovery.suggestions).toContain('Check your internet connection');
        });

        test('should provide recovery suggestions for auth errors', () => {
            const authError = createAuthError('Token expired', 'TOKEN_EXPIRED');
            const handledError = errorHandler.handleError(authError);

            expect(handledError.recovery).toBeDefined();
            expect(handledError.recovery.suggestions).toContain('Please sign in again');
        });
    });

    describe('Async Error Wrapper', () => {
        test('should wrap async functions and handle errors', async () => {
            const asyncFunction = jest.fn().mockRejectedValue(new Error('Async error'));
            const wrappedFunction = errorHandler.wrapAsync(asyncFunction);

            await expect(wrappedFunction()).rejects.toThrow();
            expect(asyncFunction).toHaveBeenCalled();
        });

        test('should pass through successful async results', async () => {
            const asyncFunction = jest.fn().mockResolvedValue('success');
            const wrappedFunction = errorHandler.wrapAsync(asyncFunction);

            const result = await wrappedFunction();
            expect(result).toBe('success');
            expect(asyncFunction).toHaveBeenCalled();
        });
    });

    describe('Error Reporting', () => {
        test('should log errors with proper format', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const error = new Error('Test error');
            errorHandler.handleError(error);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error handled:'),
                expect.any(Object)
            );

            consoleSpy.mockRestore();
        });

        test('should not log user-friendly errors in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const userError = createUserError('User friendly message', 'USER_CODE');
            errorHandler.handleError(userError);

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
    });
});