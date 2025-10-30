/**
 * Input Sanitization & Security
 * Production-ready input validation and sanitization to prevent security vulnerabilities
 */

import { createUserError, handleError } from './errorHandler';
import { LOG_LEVELS, logSecurityEvent, SECURITY_EVENTS } from './securityLogger';

// Security patterns for detection
const SECURITY_PATTERNS = {
    // XSS patterns
    XSS: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /vbscript:/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<link/gi,
        /<meta/gi
    ],

    // SQL injection patterns
    SQL_INJECTION: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
        /('|(\\')|('')|(%27)|(%2527))/gi,
        /(;|\||`|\\|\B0\B)/gi
    ],

    // NoSQL injection patterns
    NOSQL_INJECTION: [
        /\$where/gi,
        /\$ne/gi,
        /\$in/gi,
        /\$nin/gi,
        /\$or/gi,
        /\$and/gi,
        /\$regex/gi
    ],

    // Command injection patterns
    COMMAND_INJECTION: [
        /(\||;|&|`|\$\(|\${)/gi,
        /(rm\s|ls\s|cat\s|grep\s|awk\s|sed\s|curl\s|wget\s)/gi,
        /(\.\.\/|\.\.\\)/gi
    ],

    // Path traversal patterns
    PATH_TRAVERSAL: [
        /(\.\.[\/\\])+/gi,
        /(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)/gi,
        /(\%2e\%2e[\/\\])+/gi
    ],

    // LDAP injection patterns
    LDAP_INJECTION: [
        /(\*|\(|\)|\||\&|\!|\=|\<|\>|\~)/gi
    ]
};

// Input size limits
const INPUT_LIMITS = {
    EMAIL: 254,
    PASSWORD: 128,
    NAME: 100,
    TEXT_SHORT: 255,
    TEXT_MEDIUM: 1000,
    TEXT_LONG: 5000,
    URL: 2048,
    PHONE: 20,
    JSON_MAX_SIZE: 1024 * 100, // 100KB
    FILE_UPLOAD_MAX: 1024 * 1024 * 10 // 10MB
};

// Character restrictions
const ALLOWED_CHARS = {
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    ALPHANUMERIC_SPACE: /^[a-zA-Z0-9\s]+$/,
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^[\+]?[1-9][\d]{0,15}$/,
    USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    SAFE_HTML: /^[a-zA-Z0-9\s\.,!?\-_'"()]+$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

class InputSanitizer {
    constructor() {
        this.violationCount = 0;
        this.rateLimitMap = new Map();
    }

    /**
     * Comprehensive input sanitization
     */
    sanitizeInput(input, type = 'string', options = {}) {
        try {
            if (input === null || input === undefined) {
                return options.defaultValue || '';
            }

            // Convert to string if needed
            let sanitized = typeof input === 'string' ? input : String(input);

            // Check input size limits
            this._checkInputSize(sanitized, type);

            // Detect and prevent security attacks
            this._detectSecurityThreats(sanitized, type);

            // Apply type-specific sanitization
            switch (type.toLowerCase()) {
                case 'email':
                    return this._sanitizeEmail(sanitized, options);
                case 'password':
                    return this._sanitizePassword(sanitized, options);
                case 'name':
                    return this._sanitizeName(sanitized, options);
                case 'phone':
                    return this._sanitizePhone(sanitized, options);
                case 'url':
                    return this._sanitizeUrl(sanitized, options);
                case 'html':
                    return this._sanitizeHtml(sanitized, options);
                case 'json':
                    return this._sanitizeJson(sanitized, options);
                case 'number':
                    return this._sanitizeNumber(sanitized, options);
                case 'alphanumeric':
                    return this._sanitizeAlphanumeric(sanitized, options);
                case 'username':
                    return this._sanitizeUsername(sanitized, options);
                default:
                    return this._sanitizeGeneric(sanitized, options);
            }
        } catch (error) {
            this._logSecurityViolation('sanitization_error', {
                inputType: type,
                inputLength: input?.length || 0,
                error: error.message
            });

            if (options.throwOnError) {
                throw error;
            }

            return options.defaultValue || '';
        }
    }

    /**
     * Sanitize object with multiple fields
     */
    sanitizeObject(obj, schema, options = {}) {
        try {
            if (!obj || typeof obj !== 'object') {
                throw createUserError('Invalid input object');
            }

            const sanitized = {};
            const errors = [];

            for (const [field, config] of Object.entries(schema)) {
                try {
                    const value = obj[field];
                    const fieldOptions = {
                        ...options,
                        ...config.options
                    };

                    if (config.required && (value === undefined || value === null || value === '')) {
                        errors.push(`Field '${field}' is required`);
                        continue;
                    }

                    if (value !== undefined && value !== null) {
                        sanitized[field] = this.sanitizeInput(value, config.type, fieldOptions);
                    }
                } catch (error) {
                    errors.push(`Field '${field}': ${error.message}`);
                }
            }

            if (errors.length > 0 && options.throwOnError) {
                throw createUserError(`Validation errors: ${errors.join(', ')}`);
            }

            return { sanitized, errors };
        } catch (error) {
            handleError(error, { context: 'InputSanitizer.sanitizeObject' });
            throw error;
        }
    }

    /**
     * Sanitize API request data
     */
    sanitizeApiRequest(data, endpoint, method = 'GET') {
        try {
            // Rate limiting check
            this._checkRateLimit(endpoint, method);

            // Deep sanitization for nested objects
            return this._deepSanitize(data, {
                maxDepth: 5,
                removeNullValues: true,
                trimStrings: true
            });
        } catch (error) {
            this._logSecurityViolation('api_request_sanitization_failed', {
                endpoint,
                method,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Validate file upload security
     */
    validateFileUpload(file, allowedTypes = [], maxSize = INPUT_LIMITS.FILE_UPLOAD_MAX) {
        try {
            if (!file) {
                throw createUserError('No file provided');
            }

            // Check file size
            if (file.size > maxSize) {
                throw createUserError(`File size exceeds limit of ${maxSize} bytes`);
            }

            // Check file type
            if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
                this._logSecurityViolation('invalid_file_type_upload', {
                    providedType: file.type,
                    fileName: file.name,
                    allowedTypes
                });
                throw createUserError('File type not allowed');
            }

            // Check filename for path traversal
            if (this._containsPattern(file.name, SECURITY_PATTERNS.PATH_TRAVERSAL)) {
                this._logSecurityViolation('path_traversal_in_filename', {
                    fileName: file.name
                });
                throw createUserError('Invalid filename');
            }

            // Sanitize filename
            const sanitizedName = file.name
                .replace(/[^a-zA-Z0-9.-]/g, '_')
                .substring(0, 100);

            return {
                ...file,
                name: sanitizedName,
                isValid: true
            };
        } catch (error) {
            handleError(error, { context: 'InputSanitizer.validateFileUpload' });
            throw error;
        }
    }

    /**
     * Check for content security policy violations
     */
    validateContentSecurityPolicy(content) {
        const violations = [];

        // Check for inline scripts
        if (/<script(?![^>]*src=)[^>]*>/gi.test(content)) {
            violations.push('inline_script');
        }

        // Check for inline styles
        if (/style\s*=/gi.test(content)) {
            violations.push('inline_style');
        }

        // Check for data URLs
        if (/data:\s*[^;,]+[;,]/gi.test(content)) {
            violations.push('data_url');
        }

        // Check for eval usage
        if (/\beval\s*\(/gi.test(content)) {
            violations.push('eval_usage');
        }

        if (violations.length > 0) {
            this._logSecurityViolation('csp_violation', {
                violations,
                contentLength: content.length
            });
        }

        return {
            valid: violations.length === 0,
            violations
        };
    }

    // Private sanitization methods

    _sanitizeEmail(email, options) {
        email = email.toLowerCase().trim();

        if (!ALLOWED_CHARS.EMAIL.test(email)) {
            throw createUserError('Invalid email format');
        }

        if (email.length > INPUT_LIMITS.EMAIL) {
            throw createUserError('Email too long');
        }

        return email;
    }

    _sanitizePassword(password, options) {
        // Don't trim passwords to preserve intentional spaces

        if (password.length < (options.minLength || 8)) {
            throw createUserError(`Password must be at least ${options.minLength || 8} characters`);
        }

        if (password.length > INPUT_LIMITS.PASSWORD) {
            throw createUserError('Password too long');
        }

        if (options.requireStrong && !ALLOWED_CHARS.PASSWORD.test(password)) {
            throw createUserError('Password must contain uppercase, lowercase, number, and special character');
        }

        return password;
    }

    _sanitizeName(name, options) {
        name = name.trim();

        // Remove potentially dangerous characters
        name = name.replace(/[<>\"\']/g, '');

        if (name.length > INPUT_LIMITS.NAME) {
            name = name.substring(0, INPUT_LIMITS.NAME);
        }

        if (!ALLOWED_CHARS.ALPHANUMERIC_SPACE.test(name.replace(/['-]/g, ''))) {
            throw createUserError('Name contains invalid characters');
        }

        return name;
    }

    _sanitizePhone(phone, options) {
        phone = phone.replace(/\D/g, ''); // Remove non-digits

        if (phone.length > INPUT_LIMITS.PHONE) {
            throw createUserError('Phone number too long');
        }

        return phone;
    }

    _sanitizeUrl(url, options) {
        url = url.trim();

        if (!ALLOWED_CHARS.URL.test(url)) {
            throw createUserError('Invalid URL format');
        }

        // Ensure HTTPS if required
        if (options.requireHttps && !url.startsWith('https://')) {
            throw createUserError('HTTPS required');
        }

        return url;
    }

    _sanitizeHtml(html, options) {
        // Strip all HTML tags by default
        let sanitized = html.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        sanitized = sanitized
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/');

        return sanitized.trim();
    }

    _sanitizeJson(jsonString, options) {
        try {
            if (jsonString.length > INPUT_LIMITS.JSON_MAX_SIZE) {
                throw createUserError('JSON payload too large');
            }

            const parsed = JSON.parse(jsonString);

            // Remove potentially dangerous keys
            return this._deepSanitize(parsed, {
                removeKeys: ['__proto__', 'constructor', 'prototype']
            });
        } catch (error) {
            throw createUserError('Invalid JSON format');
        }
    }

    _sanitizeNumber(value, options) {
        const num = parseFloat(value);

        if (isNaN(num)) {
            if (options.defaultValue !== undefined) {
                return options.defaultValue;
            }
            throw createUserError('Invalid number format');
        }

        if (options.min !== undefined && num < options.min) {
            throw createUserError(`Number must be at least ${options.min}`);
        }

        if (options.max !== undefined && num > options.max) {
            throw createUserError(`Number must be at most ${options.max}`);
        }

        return num;
    }

    _sanitizeAlphanumeric(value, options) {
        value = value.trim();

        if (!ALLOWED_CHARS.ALPHANUMERIC.test(value)) {
            // Remove non-alphanumeric characters
            value = value.replace(/[^a-zA-Z0-9]/g, '');
        }

        return value;
    }

    _sanitizeUsername(username, options) {
        username = username.toLowerCase().trim();

        if (!ALLOWED_CHARS.USERNAME.test(username)) {
            throw createUserError('Username contains invalid characters');
        }

        return username;
    }

    _sanitizeGeneric(value, options) {
        value = value.trim();

        // Remove null bytes
        value = value.replace(/\0/g, '');

        // Remove control characters except newlines and tabs
        value = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

        return value;
    }

    _deepSanitize(obj, options = {}) {
        const { maxDepth = 5, currentDepth = 0, removeKeys = [], removeNullValues = false, trimStrings = true } = options;

        if (currentDepth >= maxDepth) {
            return '[Max depth reached]';
        }

        if (obj === null || obj === undefined) {
            return removeNullValues ? undefined : obj;
        }

        if (typeof obj === 'string') {
            return trimStrings ? obj.trim() : obj;
        }

        if (Array.isArray(obj)) {
            return obj
                .map(item => this._deepSanitize(item, { ...options, currentDepth: currentDepth + 1 }))
                .filter(item => !removeNullValues || item !== undefined);
        }

        if (typeof obj === 'object') {
            const sanitized = {};

            for (const [key, value] of Object.entries(obj)) {
                if (removeKeys.includes(key)) {
                    continue;
                }

                const sanitizedValue = this._deepSanitize(value, { ...options, currentDepth: currentDepth + 1 });

                if (!removeNullValues || sanitizedValue !== undefined) {
                    sanitized[key] = sanitizedValue;
                }
            }

            return sanitized;
        }

        return obj;
    }

    _checkInputSize(input, type) {
        let limit;

        switch (type.toLowerCase()) {
            case 'email':
                limit = INPUT_LIMITS.EMAIL;
                break;
            case 'password':
                limit = INPUT_LIMITS.PASSWORD;
                break;
            case 'name':
                limit = INPUT_LIMITS.NAME;
                break;
            case 'phone':
                limit = INPUT_LIMITS.PHONE;
                break;
            case 'url':
                limit = INPUT_LIMITS.URL;
                break;
            default:
                limit = INPUT_LIMITS.TEXT_MEDIUM;
        }

        if (input.length > limit) {
            this._logSecurityViolation('input_size_exceeded', {
                inputType: type,
                actualSize: input.length,
                limit
            });
            throw createUserError(`Input too long for type ${type}`);
        }
    }

    _detectSecurityThreats(input, type) {
        const threats = [];

        // Check against all security patterns
        for (const [threatType, patterns] of Object.entries(SECURITY_PATTERNS)) {
            if (this._containsPattern(input, patterns)) {
                threats.push(threatType);
            }
        }

        if (threats.length > 0) {
            this.violationCount++;

            this._logSecurityViolation('security_threat_detected', {
                inputType: type,
                threats,
                inputLength: input.length,
                violationCount: this.violationCount
            });

            throw createUserError('Input contains potentially malicious content');
        }
    }

    _containsPattern(input, patterns) {
        return patterns.some(pattern => pattern.test(input));
    }

    _checkRateLimit(endpoint, method) {
        const key = `${method}:${endpoint}`;
        const now = Date.now();
        const window = 60 * 1000; // 1 minute window
        const limit = 100; // 100 requests per minute

        if (!this.rateLimitMap.has(key)) {
            this.rateLimitMap.set(key, { count: 1, windowStart: now });
            return;
        }

        const rateData = this.rateLimitMap.get(key);

        if (now - rateData.windowStart > window) {
            // Reset window
            rateData.count = 1;
            rateData.windowStart = now;
        } else {
            rateData.count++;

            if (rateData.count > limit) {
                this._logSecurityViolation('rate_limit_exceeded', {
                    endpoint,
                    method,
                    requestCount: rateData.count,
                    limit
                });
                throw createUserError('Rate limit exceeded');
            }
        }
    }

    _logSecurityViolation(violationType, details) {
        logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
            violationType,
            ...details
        }, LOG_LEVELS.WARNING);
    }
}

// Create singleton instance
const inputSanitizer = new InputSanitizer();

export default inputSanitizer;

// Convenience functions
export const sanitizeInput = (input, type, options) =>
    inputSanitizer.sanitizeInput(input, type, options);

export const sanitizeObject = (obj, schema, options) =>
    inputSanitizer.sanitizeObject(obj, schema, options);

export const sanitizeApiRequest = (data, endpoint, method) =>
    inputSanitizer.sanitizeApiRequest(data, endpoint, method);

export const validateFileUpload = (file, allowedTypes, maxSize) =>
    inputSanitizer.validateFileUpload(file, allowedTypes, maxSize);

export const validateCSP = (content) =>
    inputSanitizer.validateContentSecurityPolicy(content);

// Export patterns and limits for testing
export { ALLOWED_CHARS, INPUT_LIMITS, SECURITY_PATTERNS };

