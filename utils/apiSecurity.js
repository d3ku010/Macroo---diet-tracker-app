/**
 * API Security Layer
 * Production-ready API security with request signing, rate limiting, and encryption
 */

import CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { createUserError, handleError } from './errorHandler';
import { sanitizeApiRequest } from './inputSanitizer';
import secureStorage from './secureStorage';
import { LOG_LEVELS, logSecurityEvent, SECURITY_EVENTS } from './securityLogger';

// API Security Configuration
const API_CONFIG = {
    // Rate limiting
    DEFAULT_RATE_LIMIT: 100, // requests per minute
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    BURST_LIMIT: 10, // max burst requests

    // Request signing
    SIGNATURE_ALGORITHM: 'HMAC-SHA256',
    TIMESTAMP_TOLERANCE: 5 * 60 * 1000, // 5 minutes

    // Encryption
    ENCRYPT_SENSITIVE_REQUESTS: true,
    ENCRYPTION_ALGORITHM: 'AES',

    // Headers
    REQUIRED_HEADERS: ['User-Agent', 'Content-Type'],
    SECURITY_HEADERS: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    },

    // Timeouts
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second

    // SSL/TLS
    REQUIRE_HTTPS: true,
    SSL_PINNING: false, // Enable in production with proper certificates

    // API Keys
    API_KEY_HEADER: 'X-API-Key',
    API_SECRET_HEADER: 'X-API-Secret',

    // Monitoring
    LOG_ALL_REQUESTS: true,
    LOG_REQUEST_BODIES: false, // Set to false in production
    LOG_RESPONSE_BODIES: false
};

// Sensitive endpoints that require extra security
const SENSITIVE_ENDPOINTS = new Set([
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/user/profile',
    '/user/settings',
    '/payment',
    '/admin'
]);

class ApiSecurityLayer {
    constructor() {
        this.rateLimitMap = new Map();
        this.apiKey = null;
        this.apiSecret = null;
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.initialized = false;
    }

    /**
     * Initialize API security layer
     */
    async initialize() {
        try {
            await this._loadApiCredentials();
            this._setupInterceptors();
            this.initialized = true;

            logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
                action: 'api_security_initialized',
                platform: Platform.OS,
                httpsRequired: API_CONFIG.REQUIRE_HTTPS
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'ApiSecurity.initialize' });
            throw error;
        }
    }

    /**
     * Secure API request with comprehensive security measures
     */
    async secureRequest(url, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            // Validate and sanitize request
            const secureOptions = await this._prepareSecureRequest(url, options);

            // Check rate limits
            this._checkRateLimit(secureOptions.endpoint, secureOptions.method);

            // Add security headers
            secureOptions.headers = {
                ...API_CONFIG.SECURITY_HEADERS,
                ...secureOptions.headers
            };

            // Sign request
            if (this._requiresSignature(secureOptions.endpoint)) {
                await this._signRequest(secureOptions);
            }

            // Encrypt sensitive data
            if (this._isSensitiveEndpoint(secureOptions.endpoint) && secureOptions.body) {
                secureOptions.body = await this._encryptRequestBody(secureOptions.body);
                secureOptions.headers['Content-Encoding'] = 'encrypted';
            }

            // Log request (sanitized)
            if (API_CONFIG.LOG_ALL_REQUESTS) {
                this._logRequest(secureOptions);
            }

            // Execute request with retries
            const response = await this._executeWithRetries(secureOptions);

            // Process and validate response
            const secureResponse = await this._processSecureResponse(response, secureOptions);

            return secureResponse;

        } catch (error) {
            this._logApiError(url, options, error);
            handleError(error, { context: 'ApiSecurity.secureRequest', url });
            throw error;
        }
    }

    /**
     * Set API credentials securely
     */
    async setApiCredentials(apiKey, apiSecret) {
        try {
            // Validate credentials format
            if (!apiKey || !apiSecret) {
                throw createUserError('API credentials required');
            }

            if (typeof apiKey !== 'string' || typeof apiSecret !== 'string') {
                throw createUserError('Invalid credential format');
            }

            // Store credentials securely
            await secureStorage.setSecure('api_keys', {
                apiKey: apiKey,
                apiSecret: apiSecret,
                createdAt: new Date().toISOString()
            }, {
                requireBiometric: false // API keys don't need biometric
            });

            this.apiKey = apiKey;
            this.apiSecret = apiSecret;

            logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
                action: 'api_credentials_updated',
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'ApiSecurity.setApiCredentials' });
            throw error;
        }
    }

    /**
     * Clear API credentials
     */
    async clearApiCredentials() {
        try {
            await secureStorage.removeSecure('api_keys');
            this.apiKey = null;
            this.apiSecret = null;

            logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
                action: 'api_credentials_cleared'
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'ApiSecurity.clearApiCredentials' });
            throw error;
        }
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor) {
        if (typeof interceptor === 'function') {
            this.requestInterceptors.push(interceptor);
        }
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(interceptor) {
        if (typeof interceptor === 'function') {
            this.responseInterceptors.push(interceptor);
        }
    }

    /**
     * Get API security status
     */
    async getSecurityStatus() {
        try {
            const rateLimitStatus = this._getRateLimitStatus();
            const hasCredentials = !!(this.apiKey && this.apiSecret);

            return {
                initialized: this.initialized,
                hasApiCredentials: hasCredentials,
                httpsRequired: API_CONFIG.REQUIRE_HTTPS,
                requestSigningEnabled: hasCredentials,
                rateLimitStatus,
                activeInterceptors: {
                    request: this.requestInterceptors.length,
                    response: this.responseInterceptors.length
                },
                securityFeatures: {
                    requestSigning: true,
                    rateLimiting: true,
                    inputSanitization: true,
                    requestEncryption: API_CONFIG.ENCRYPT_SENSITIVE_REQUESTS,
                    sslPinning: API_CONFIG.SSL_PINNING
                }
            };
        } catch (error) {
            handleError(error, { context: 'ApiSecurity.getSecurityStatus' });
            return { error: error.message };
        }
    }

    // Private methods

    async _loadApiCredentials() {
        try {
            const credentials = await secureStorage.getSecure('api_keys');
            if (credentials) {
                this.apiKey = credentials.apiKey;
                this.apiSecret = credentials.apiSecret;
            }
        } catch (error) {
            // No credentials stored, continue without them
            this.apiKey = null;
            this.apiSecret = null;
        }
    }

    _setupInterceptors() {
        // Add default request interceptor for security headers
        this.addRequestInterceptor((config) => {
            // Add platform identification
            config.headers = {
                ...config.headers,
                'User-Agent': this._getUserAgent(),
                'X-Client-Platform': Platform.OS,
                'X-Client-Version': '1.0.0' // Get from app config
            };

            return config;
        });

        // Add default response interceptor for security validation
        this.addResponseInterceptor((response) => {
            // Validate response headers
            this._validateResponseHeaders(response.headers);
            return response;
        });
    }

    async _prepareSecureRequest(url, options) {
        // Extract endpoint from URL
        const urlObj = new URL(url);
        const endpoint = urlObj.pathname;

        // Validate HTTPS requirement
        if (API_CONFIG.REQUIRE_HTTPS && urlObj.protocol !== 'https:') {
            throw createUserError('HTTPS required for API requests');
        }

        // Sanitize request data
        let sanitizedBody = options.body;
        if (sanitizedBody) {
            sanitizedBody = sanitizeApiRequest(sanitizedBody, endpoint, options.method || 'GET');
        }

        // Apply request interceptors
        let config = {
            url,
            endpoint,
            method: options.method || 'GET',
            headers: { ...options.headers },
            body: sanitizedBody,
            timeout: options.timeout || API_CONFIG.DEFAULT_TIMEOUT,
            timestamp: Date.now()
        };

        for (const interceptor of this.requestInterceptors) {
            config = interceptor(config) || config;
        }

        return config;
    }

    _checkRateLimit(endpoint, method) {
        const key = `${method}:${endpoint}`;
        const now = Date.now();

        if (!this.rateLimitMap.has(key)) {
            this.rateLimitMap.set(key, {
                count: 1,
                windowStart: now,
                burstCount: 1,
                lastRequest: now
            });
            return;
        }

        const rateData = this.rateLimitMap.get(key);

        // Check burst limit (requests within 1 second)
        if (now - rateData.lastRequest < 1000) {
            rateData.burstCount++;
            if (rateData.burstCount > API_CONFIG.BURST_LIMIT) {
                this._logRateLimitViolation(endpoint, method, 'burst_limit');
                throw createUserError('Request rate too high, please slow down');
            }
        } else {
            rateData.burstCount = 1;
        }

        // Check window limit
        if (now - rateData.windowStart > API_CONFIG.RATE_LIMIT_WINDOW) {
            // Reset window
            rateData.count = 1;
            rateData.windowStart = now;
        } else {
            rateData.count++;

            if (rateData.count > API_CONFIG.DEFAULT_RATE_LIMIT) {
                this._logRateLimitViolation(endpoint, method, 'window_limit');
                throw createUserError('Rate limit exceeded, please try again later');
            }
        }

        rateData.lastRequest = now;
    }

    _requiresSignature(endpoint) {
        return this._isSensitiveEndpoint(endpoint) && !!(this.apiKey && this.apiSecret);
    }

    _isSensitiveEndpoint(endpoint) {
        return Array.from(SENSITIVE_ENDPOINTS).some(sensitive =>
            endpoint.startsWith(sensitive)
        );
    }

    async _signRequest(config) {
        try {
            if (!this.apiSecret) {
                throw createUserError('API secret required for request signing');
            }

            const timestamp = Date.now().toString();
            const nonce = this._generateNonce();

            // Create signature payload
            const signaturePayload = [
                config.method.toUpperCase(),
                config.endpoint,
                timestamp,
                nonce,
                config.body ? JSON.stringify(config.body) : ''
            ].join('\n');

            // Generate signature
            const signature = CryptoJS.HmacSHA256(signaturePayload, this.apiSecret).toString();

            // Add signature headers
            config.headers = {
                ...config.headers,
                [API_CONFIG.API_KEY_HEADER]: this.apiKey,
                'X-Timestamp': timestamp,
                'X-Nonce': nonce,
                'X-Signature': signature
            };

        } catch (error) {
            logSecurityEvent(SECURITY_EVENTS.REQUEST_SIGNING_FAILED, {
                endpoint: config.endpoint,
                error: error.message
            }, LOG_LEVELS.ERROR);
            throw error;
        }
    }

    async _encryptRequestBody(body) {
        try {
            if (!this.apiSecret) {
                return body; // Can't encrypt without secret
            }

            const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
            const encrypted = CryptoJS.AES.encrypt(bodyString, this.apiSecret).toString();

            return {
                encrypted: true,
                data: encrypted,
                algorithm: API_CONFIG.ENCRYPTION_ALGORITHM
            };
        } catch (error) {
            handleError(error, { context: 'ApiSecurity._encryptRequestBody' });
            return body; // Fallback to unencrypted
        }
    }

    async _executeWithRetries(config) {
        let lastError = null;

        for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
            try {
                // Convert config to fetch options
                const fetchOptions = {
                    method: config.method,
                    headers: config.headers,
                    body: config.body ? JSON.stringify(config.body) : undefined,
                    timeout: config.timeout
                };

                const response = await fetch(config.url, fetchOptions);

                // Check for server errors that should be retried
                if (response.status >= 500 && attempt < API_CONFIG.RETRY_ATTEMPTS) {
                    throw new Error(`Server error: ${response.status}`);
                }

                return response;

            } catch (error) {
                lastError = error;

                // Don't retry on client errors or final attempt
                if (error.status < 500 || attempt === API_CONFIG.RETRY_ATTEMPTS) {
                    break;
                }

                // Wait before retry
                await new Promise(resolve =>
                    setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt)
                );
            }
        }

        throw lastError;
    }

    async _processSecureResponse(response, requestConfig) {
        try {
            // Apply response interceptors
            let processedResponse = response;
            for (const interceptor of this.responseInterceptors) {
                processedResponse = interceptor(processedResponse) || processedResponse;
            }

            // Log response (sanitized)
            if (API_CONFIG.LOG_ALL_REQUESTS) {
                this._logResponse(processedResponse, requestConfig);
            }

            // Check response security
            this._validateResponseSecurity(processedResponse);

            return processedResponse;
        } catch (error) {
            handleError(error, { context: 'ApiSecurity._processSecureResponse' });
            throw error;
        }
    }

    _validateResponseHeaders(headers) {
        // Check for security headers
        const securityHeaders = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection'
        ];

        const missingHeaders = securityHeaders.filter(header => !headers[header]);

        if (missingHeaders.length > 0) {
            logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
                issue: 'missing_security_headers',
                missingHeaders
            }, LOG_LEVELS.WARNING);
        }
    }

    _validateResponseSecurity(response) {
        // Check response size
        const contentLength = response.headers['content-length'];
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
            logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
                type: 'large_response',
                size: contentLength
            }, LOG_LEVELS.WARNING);
        }

        // Check for suspicious response codes
        if (response.status === 418) { // I'm a teapot - often used for bot detection
            logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
                issue: 'bot_detection_response',
                status: response.status
            }, LOG_LEVELS.WARNING);
        }
    }

    _logRequest(config) {
        const logData = {
            method: config.method,
            endpoint: config.endpoint,
            timestamp: config.timestamp,
            hasBody: !!config.body,
            headerCount: Object.keys(config.headers || {}).length
        };

        if (API_CONFIG.LOG_REQUEST_BODIES && config.body) {
            logData.body = config.body;
        }

        logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
            action: 'api_request',
            ...logData
        });
    }

    _logResponse(response, requestConfig) {
        const logData = {
            status: response.status,
            statusText: response.statusText,
            endpoint: requestConfig.endpoint,
            responseTime: Date.now() - requestConfig.timestamp
        };

        logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
            action: 'api_response',
            ...logData
        });
    }

    _logApiError(url, options, error) {
        logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
            action: 'api_error',
            url,
            method: options.method || 'GET',
            error: error.message,
            status: error.status
        }, LOG_LEVELS.ERROR);
    }

    _logRateLimitViolation(endpoint, method, type) {
        logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_EXCEEDED, {
            endpoint,
            method,
            violationType: type,
            timestamp: Date.now()
        }, LOG_LEVELS.WARNING);
    }

    _getRateLimitStatus() {
        const status = {};

        for (const [key, data] of this.rateLimitMap.entries()) {
            const [method, endpoint] = key.split(':');
            status[key] = {
                method,
                endpoint,
                currentCount: data.count,
                windowStart: data.windowStart,
                lastRequest: data.lastRequest,
                remainingRequests: Math.max(0, API_CONFIG.DEFAULT_RATE_LIMIT - data.count)
            };
        }

        return status;
    }

    _getUserAgent() {
        return `DietTracker/1.0.0 (${Platform.OS} ${Platform.Version})`;
    }

    _generateNonce() {
        return CryptoJS.lib.WordArray.random(16).toString();
    }
}

// Create singleton instance
const apiSecurity = new ApiSecurityLayer();

// Auto-initialize
apiSecurity.initialize().catch(error => {
    console.error('Failed to initialize API security:', error);
});

export default apiSecurity;

// Convenience functions
export const secureApiRequest = (url, options) =>
    apiSecurity.secureRequest(url, options);

export const setApiCredentials = (apiKey, apiSecret) =>
    apiSecurity.setApiCredentials(apiKey, apiSecret);

export const clearApiCredentials = () =>
    apiSecurity.clearApiCredentials();

export const addRequestInterceptor = (interceptor) =>
    apiSecurity.addRequestInterceptor(interceptor);

export const addResponseInterceptor = (interceptor) =>
    apiSecurity.addResponseInterceptor(interceptor);

export const getApiSecurityStatus = () =>
    apiSecurity.getSecurityStatus();

// Export configuration for testing
export { API_CONFIG, SENSITIVE_ENDPOINTS };

