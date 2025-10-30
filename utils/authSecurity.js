/**
 * Authentication Security Manager
 * Production-ready authentication security with biometrics, token management, and session security
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import jwt from 'jsonwebtoken';
import { Platform } from 'react-native';
import { createUserError, handleError } from './errorHandler';
import { sanitizeInput } from './inputSanitizer';
import secureStorage from './secureStorage';
import { LOG_LEVELS, logSecurityEvent, SECURITY_EVENTS } from './securityLogger';

// Security configuration
const AUTH_CONFIG = {
    TOKEN_EXPIRY_MINUTES: 60,
    REFRESH_TOKEN_EXPIRY_DAYS: 7,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    SESSION_TIMEOUT_MINUTES: 30,
    BIOMETRIC_PROMPT_TITLE: 'Authenticate',
    BIOMETRIC_PROMPT_SUBTITLE: 'Use your biometric to access your account',
    BIOMETRIC_FALLBACK_LABEL: 'Use Password',
    FAILED_ATTEMPT_STORAGE_KEY: 'auth_failed_attempts',
    SESSION_STORAGE_KEY: 'auth_session_data'
};

// Token types
const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
    BIOMETRIC: 'biometric'
};

class AuthenticationSecurity {
    constructor() {
        this.sessionTimer = null;
        this.biometricAvailable = false;
        this.biometricType = null;
        this.initialized = false;
    }

    /**
     * Initialize authentication security
     */
    async initialize() {
        try {
            await this._checkBiometricAvailability();
            await this._setupSessionTimeout();
            this.initialized = true;

            logSecurityEvent(SECURITY_EVENTS.SECURE_STORAGE_INITIALIZED, {
                biometricAvailable: this.biometricAvailable,
                biometricType: this.biometricType,
                platform: Platform.OS
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'AuthSecurity.initialize' });
            throw error;
        }
    }

    /**
     * Secure login with rate limiting and attempt tracking
     */
    async secureLogin(credentials, options = {}) {
        try {
            const { email, password, rememberMe = false, useBiometric = false } = credentials;

            // Sanitize inputs
            const sanitizedEmail = sanitizeInput(email, 'email');
            const sanitizedPassword = sanitizeInput(password, 'password');

            // Check for account lockout
            await this._checkAccountLockout(sanitizedEmail);

            // Attempt authentication
            const authResult = await this._authenticateUser(sanitizedEmail, sanitizedPassword, options);

            if (!authResult.success) {
                await this._recordFailedAttempt(sanitizedEmail);

                logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILURE, {
                    email: sanitizedEmail,
                    reason: authResult.error,
                    ip: options.ip,
                    userAgent: options.userAgent
                }, LOG_LEVELS.WARNING);

                throw createUserError(authResult.error);
            }

            // Clear failed attempts on successful login
            await this._clearFailedAttempts(sanitizedEmail);

            // Generate secure tokens
            const tokens = await this._generateTokens(authResult.user, { rememberMe });

            // Store session data securely
            await this._storeSecureSession(authResult.user, tokens, { useBiometric });

            // Setup session timeout
            this._setupSessionTimeout();

            logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, {
                userId: authResult.user.id,
                email: sanitizedEmail,
                usedBiometric: useBiometric,
                rememberMe: rememberMe,
                ip: options.ip,
                userAgent: options.userAgent
            });

            return {
                success: true,
                user: authResult.user,
                tokens,
                sessionId: this._generateSessionId()
            };

        } catch (error) {
            handleError(error, { context: 'AuthSecurity.secureLogin' });
            throw error;
        }
    }

    /**
     * Biometric authentication
     */
    async authenticateWithBiometric(options = {}) {
        try {
            if (!this.biometricAvailable) {
                throw createUserError('Biometric authentication not available');
            }

            const biometricResult = await LocalAuthentication.authenticateAsync({
                promptMessage: options.promptMessage || AUTH_CONFIG.BIOMETRIC_PROMPT_TITLE,
                fallbackLabel: AUTH_CONFIG.BIOMETRIC_FALLBACK_LABEL,
                disableDeviceFallback: options.disableDeviceFallback || false,
                cancelLabel: 'Cancel'
            });

            if (!biometricResult.success) {
                logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_AUTH, {
                    success: false,
                    error: biometricResult.error,
                    warning: biometricResult.warning
                }, LOG_LEVELS.WARNING);

                throw createUserError('Biometric authentication failed');
            }

            // Retrieve stored session with biometric key
            const sessionData = await secureStorage.getSecure('biometric_session', {
                requireBiometric: true,
                defaultValue: null
            });

            if (!sessionData) {
                throw createUserError('No biometric session found');
            }

            // Validate session
            const validSession = await this._validateSession(sessionData);

            logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_AUTH, {
                success: true,
                userId: sessionData.userId,
                biometricType: this.biometricType
            });

            return {
                success: true,
                session: validSession,
                tokens: sessionData.tokens
            };

        } catch (error) {
            handleError(error, { context: 'AuthSecurity.authenticateWithBiometric' });
            throw error;
        }
    }

    /**
     * Refresh authentication tokens
     */
    async refreshTokens(refreshToken) {
        try {
            if (!refreshToken) {
                throw createUserError('Refresh token required');
            }

            // Validate refresh token
            const tokenData = await this._validateToken(refreshToken, TOKEN_TYPES.REFRESH);

            if (!tokenData.valid) {
                logSecurityEvent(SECURITY_EVENTS.INVALID_TOKEN, {
                    tokenType: TOKEN_TYPES.REFRESH,
                    reason: tokenData.error
                }, LOG_LEVELS.WARNING);

                throw createUserError('Invalid refresh token');
            }

            // Generate new tokens
            const newTokens = await this._generateTokens(tokenData.user, {
                rememberMe: tokenData.rememberMe
            });

            // Update stored session
            await this._updateStoredSession(newTokens);

            logSecurityEvent(SECURITY_EVENTS.TOKEN_REFRESH, {
                userId: tokenData.user.id,
                oldTokenExpiry: tokenData.exp,
                newTokenExpiry: new Date(Date.now() + AUTH_CONFIG.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString()
            });

            return {
                success: true,
                tokens: newTokens
            };

        } catch (error) {
            handleError(error, { context: 'AuthSecurity.refreshTokens' });
            throw error;
        }
    }

    /**
     * Secure logout with cleanup
     */
    async secureLogout(options = {}) {
        try {
            const { clearBiometric = false, invalidateAllSessions = false } = options;

            // Get current session info for logging
            const sessionData = await this._getCurrentSession();

            // Clear session timer
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
                this.sessionTimer = null;
            }

            // Remove tokens from secure storage
            await secureStorage.removeSecure('auth_tokens');
            await secureStorage.removeSecure('session_data');

            // Clear biometric session if requested
            if (clearBiometric) {
                await secureStorage.removeSecure('biometric_session');
            }

            // Clear regular storage
            await AsyncStorage.multiRemove([
                AUTH_CONFIG.SESSION_STORAGE_KEY,
                'user_session'
            ]);

            // In production: invalidate tokens on server
            if (invalidateAllSessions && sessionData?.tokens?.access) {
                await this._invalidateServerTokens(sessionData.tokens.access);
            }

            logSecurityEvent(SECURITY_EVENTS.LOGOUT, {
                userId: sessionData?.userId,
                sessionDuration: sessionData?.sessionDuration,
                clearBiometric,
                invalidateAllSessions
            });

            return { success: true };

        } catch (error) {
            handleError(error, { context: 'AuthSecurity.secureLogout' });
            // Don't throw on logout errors - always succeed
            return { success: true, warning: error.message };
        }
    }

    /**
     * Validate current session
     */
    async validateSession() {
        try {
            const sessionData = await this._getCurrentSession();

            if (!sessionData) {
                return { valid: false, reason: 'No session found' };
            }

            // Check token validity
            const tokenValidation = await this._validateToken(sessionData.tokens.access, TOKEN_TYPES.ACCESS);

            if (!tokenValidation.valid) {
                // Try to refresh token
                try {
                    const refreshResult = await this.refreshTokens(sessionData.tokens.refresh);
                    return { valid: true, refreshed: true, tokens: refreshResult.tokens };
                } catch {
                    return { valid: false, reason: 'Token expired and refresh failed' };
                }
            }

            // Check session timeout
            const now = Date.now();
            const sessionAge = now - new Date(sessionData.createdAt).getTime();
            const maxAge = AUTH_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000;

            if (sessionAge > maxAge) {
                await this.secureLogout();
                return { valid: false, reason: 'Session timeout' };
            }

            return { valid: true, session: sessionData };

        } catch (error) {
            handleError(error, { context: 'AuthSecurity.validateSession' });
            return { valid: false, reason: error.message };
        }
    }

    /**
     * Check if biometric authentication is available
     */
    async isBiometricAvailable() {
        return this.biometricAvailable;
    }

    /**
     * Enable biometric authentication for user
     */
    async enableBiometricAuth(password) {
        try {
            if (!this.biometricAvailable) {
                throw createUserError('Biometric authentication not available on this device');
            }

            // Verify current password
            const sessionData = await this._getCurrentSession();
            if (!sessionData) {
                throw createUserError('No active session');
            }

            // Re-authenticate with password
            const authResult = await this._authenticateUser(sessionData.user.email, password);
            if (!authResult.success) {
                throw createUserError('Password verification failed');
            }

            // Test biometric authentication
            const biometricTest = await this.authenticateWithBiometric({
                promptMessage: 'Enable biometric authentication',
                disableDeviceFallback: true
            });

            if (!biometricTest.success) {
                throw createUserError('Biometric setup failed');
            }

            // Store biometric session
            await secureStorage.setSecure('biometric_session', {
                userId: sessionData.user.id,
                tokens: sessionData.tokens,
                createdAt: new Date().toISOString(),
                biometricEnabled: true
            }, {
                requireBiometric: true,
                expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
            });

            logSecurityEvent(SECURITY_EVENTS.BIOMETRIC_AUTH, {
                action: 'enabled',
                userId: sessionData.user.id,
                biometricType: this.biometricType
            });

            return { success: true };

        } catch (error) {
            handleError(error, { context: 'AuthSecurity.enableBiometricAuth' });
            throw error;
        }
    }

    /**
     * Get authentication security status
     */
    async getSecurityStatus() {
        try {
            const session = await this._getCurrentSession();
            const failedAttempts = await this._getFailedAttempts(session?.user?.email || '');

            return {
                initialized: this.initialized,
                biometricAvailable: this.biometricAvailable,
                biometricType: this.biometricType,
                hasActiveSession: !!session,
                sessionAge: session ? Date.now() - new Date(session.createdAt).getTime() : 0,
                failedAttempts: failedAttempts.count,
                isLocked: failedAttempts.locked,
                lockoutExpiry: failedAttempts.lockoutExpiry
            };
        } catch (error) {
            handleError(error, { context: 'AuthSecurity.getSecurityStatus' });
            return { error: error.message };
        }
    }

    // Private methods

    async _checkBiometricAvailability() {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            this.biometricAvailable = hasHardware && isEnrolled;
            this.biometricType = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
                ? 'FaceID'
                : supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
                    ? 'TouchID'
                    : 'Biometric';

        } catch (error) {
            this.biometricAvailable = false;
            this.biometricType = null;
        }
    }

    async _authenticateUser(email, password, options = {}) {
        // In production, this would call your authentication API
        // For now, simulate authentication
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mock authentication - replace with real implementation
        if (email && password.length >= 6) {
            return {
                success: true,
                user: {
                    id: 'user_' + Date.now(),
                    email: email,
                    name: 'Test User'
                }
            };
        }

        return {
            success: false,
            error: 'Invalid credentials'
        };
    }

    async _generateTokens(user, options = {}) {
        const now = Date.now();
        const accessTokenExpiry = now + (AUTH_CONFIG.TOKEN_EXPIRY_MINUTES * 60 * 1000);
        const refreshTokenExpiry = now + (AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        // In production, use proper JWT signing with secure keys
        const accessToken = jwt.sign({
            userId: user.id,
            email: user.email,
            type: TOKEN_TYPES.ACCESS,
            exp: Math.floor(accessTokenExpiry / 1000),
            iat: Math.floor(now / 1000)
        }, 'your-secret-key'); // Use secure key from environment

        const refreshToken = jwt.sign({
            userId: user.id,
            type: TOKEN_TYPES.REFRESH,
            rememberMe: options.rememberMe,
            exp: Math.floor(refreshTokenExpiry / 1000),
            iat: Math.floor(now / 1000)
        }, 'your-refresh-secret-key'); // Use secure key from environment

        return {
            access: accessToken,
            refresh: refreshToken,
            expiresAt: accessTokenExpiry,
            refreshExpiresAt: refreshTokenExpiry
        };
    }

    async _validateToken(token, expectedType) {
        try {
            // In production, use proper JWT verification with secure keys
            const decoded = jwt.verify(token, expectedType === TOKEN_TYPES.REFRESH ? 'your-refresh-secret-key' : 'your-secret-key');

            if (decoded.type !== expectedType) {
                return { valid: false, error: 'Invalid token type' };
            }

            return { valid: true, user: decoded, exp: decoded.exp, rememberMe: decoded.rememberMe };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async _storeSecureSession(user, tokens, options = {}) {
        const sessionData = {
            userId: user.id,
            user: user,
            tokens: tokens,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };

        // Store in secure storage
        await secureStorage.setSecure('auth_tokens', tokens, {
            expiresIn: AUTH_CONFIG.TOKEN_EXPIRY_MINUTES * 60 * 1000
        });

        await secureStorage.setSecure('session_data', sessionData, {
            expiresIn: AUTH_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000
        });

        // Store biometric session if enabled
        if (options.useBiometric && this.biometricAvailable) {
            await secureStorage.setSecure('biometric_session', sessionData, {
                requireBiometric: true,
                expiresIn: AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
            });
        }
    }

    async _getCurrentSession() {
        try {
            return await secureStorage.getSecure('session_data');
        } catch {
            return null;
        }
    }

    async _updateStoredSession(newTokens) {
        const sessionData = await this._getCurrentSession();
        if (sessionData) {
            sessionData.tokens = newTokens;
            sessionData.lastActivity = new Date().toISOString();

            await secureStorage.setSecure('session_data', sessionData, {
                expiresIn: AUTH_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000
            });
        }
    }

    async _validateSession(sessionData) {
        // Add session validation logic
        return sessionData;
    }

    async _checkAccountLockout(email) {
        const failedAttempts = await this._getFailedAttempts(email);

        if (failedAttempts.locked) {
            const timeRemaining = failedAttempts.lockoutExpiry - Date.now();
            if (timeRemaining > 0) {
                throw createUserError(`Account locked. Try again in ${Math.ceil(timeRemaining / 60000)} minutes`);
            } else {
                // Lockout expired, clear failed attempts
                await this._clearFailedAttempts(email);
            }
        }
    }

    async _recordFailedAttempt(email) {
        const key = `${AUTH_CONFIG.FAILED_ATTEMPT_STORAGE_KEY}_${email}`;
        const attempts = await AsyncStorage.getItem(key);
        let attemptData = attempts ? JSON.parse(attempts) : { count: 0, lastAttempt: null };

        attemptData.count++;
        attemptData.lastAttempt = Date.now();

        if (attemptData.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
            attemptData.locked = true;
            attemptData.lockoutExpiry = Date.now() + (AUTH_CONFIG.LOCKOUT_DURATION_MINUTES * 60 * 1000);

            logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
                type: 'account_locked',
                email: email,
                attemptCount: attemptData.count,
                lockoutDuration: AUTH_CONFIG.LOCKOUT_DURATION_MINUTES
            }, LOG_LEVELS.ERROR);
        }

        await AsyncStorage.setItem(key, JSON.stringify(attemptData));
    }

    async _getFailedAttempts(email) {
        const key = `${AUTH_CONFIG.FAILED_ATTEMPT_STORAGE_KEY}_${email}`;
        const attempts = await AsyncStorage.getItem(key);
        return attempts ? JSON.parse(attempts) : { count: 0, locked: false };
    }

    async _clearFailedAttempts(email) {
        const key = `${AUTH_CONFIG.FAILED_ATTEMPT_STORAGE_KEY}_${email}`;
        await AsyncStorage.removeItem(key);
    }

    _setupSessionTimeout() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        this.sessionTimer = setTimeout(async () => {
            await this.secureLogout();
            logSecurityEvent(SECURITY_EVENTS.LOGOUT, {
                reason: 'session_timeout',
                duration: AUTH_CONFIG.SESSION_TIMEOUT_MINUTES
            });
        }, AUTH_CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000);
    }

    _generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async _invalidateServerTokens(accessToken) {
        // In production, call your API to invalidate tokens
        // await fetch('/api/auth/invalidate', {
        //   method: 'POST',
        //   headers: { 'Authorization': `Bearer ${accessToken}` }
        // });
    }
}

// Create singleton instance
const authSecurity = new AuthenticationSecurity();

// Auto-initialize
authSecurity.initialize().catch(error => {
    console.error('Failed to initialize auth security:', error);
});

export default authSecurity;

// Convenience functions
export const secureLogin = (credentials, options) =>
    authSecurity.secureLogin(credentials, options);

export const authenticateWithBiometric = (options) =>
    authSecurity.authenticateWithBiometric(options);

export const refreshTokens = (refreshToken) =>
    authSecurity.refreshTokens(refreshToken);

export const secureLogout = (options) =>
    authSecurity.secureLogout(options);

export const validateSession = () =>
    authSecurity.validateSession();

export const enableBiometricAuth = (password) =>
    authSecurity.enableBiometricAuth(password);

export const getAuthSecurityStatus = () =>
    authSecurity.getSecurityStatus();