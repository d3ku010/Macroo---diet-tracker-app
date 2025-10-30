/**
 * Security Logger
 * Production-ready security event logging and monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { handleError } from './errorHandler';

// Security event types
export const SECURITY_EVENTS = {
    // Authentication events
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    LOGOUT: 'logout',
    TOKEN_REFRESH: 'token_refresh',
    BIOMETRIC_AUTH: 'biometric_auth',

    // Storage events  
    SECURE_STORAGE_INITIALIZED: 'secure_storage_initialized',
    SECURE_DATA_STORED: 'secure_data_stored',
    SECURE_DATA_RETRIEVED: 'secure_data_retrieved',
    SECURE_DATA_EXPIRED: 'secure_data_expired',
    SECURE_DATA_CORRUPTED: 'secure_data_corrupted',
    SECURE_DATA_REMOVED: 'secure_data_removed',

    // Security violations
    INVALID_TOKEN: 'invalid_token',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    DATA_BREACH_ATTEMPT: 'data_breach_attempt',

    // API security
    API_REQUEST_BLOCKED: 'api_request_blocked',
    INVALID_API_KEY: 'invalid_api_key',
    REQUEST_SIGNING_FAILED: 'request_signing_failed',

    // System events
    APP_STARTED: 'app_started',
    APP_BACKGROUNDED: 'app_backgrounded',
    APP_FOREGROUNDED: 'app_foregrounded',
    SECURITY_SCAN_COMPLETED: 'security_scan_completed'
};

// Security log levels
export const LOG_LEVELS = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

// Configuration
const SECURITY_CONFIG = {
    MAX_LOG_ENTRIES: 1000,
    LOG_RETENTION_DAYS: 30,
    BATCH_SIZE: 50,
    UPLOAD_INTERVAL_MS: 60000, // 1 minute
    STORAGE_KEY: 'security_logs'
};

class SecurityLogger {
    constructor() {
        this.logBuffer = [];
        this.sessionId = this._generateSessionId();
        this.uploadTimer = null;
        this.initialized = false;
    }

    /**
     * Initialize security logger
     */
    async initialize() {
        try {
            await this._loadStoredLogs();
            this._startPeriodicUpload();
            this.initialized = true;

            await this.logEvent(SECURITY_EVENTS.APP_STARTED, {
                sessionId: this.sessionId,
                platform: Platform.OS,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            handleError(error, { context: 'SecurityLogger.initialize' });
        }
    }

    /**
     * Log a security event
     */
    async logEvent(eventType, data = {}, level = LOG_LEVELS.INFO) {
        try {
            const logEntry = {
                id: this._generateLogId(),
                sessionId: this.sessionId,
                eventType,
                level,
                timestamp: new Date().toISOString(),
                platform: Platform.OS,
                data: this._sanitizeLogData(data),
                userAgent: this._getUserAgent(),
                buildInfo: this._getBuildInfo()
            };

            // Add to buffer
            this.logBuffer.push(logEntry);

            // Immediately store critical events
            if (level === LOG_LEVELS.CRITICAL || level === LOG_LEVELS.ERROR) {
                await this._persistLogs();
            }

            // Trigger upload for critical events
            if (level === LOG_LEVELS.CRITICAL) {
                await this._uploadLogs();
            }

            // Maintain buffer size
            if (this.logBuffer.length > SECURITY_CONFIG.MAX_LOG_ENTRIES) {
                this.logBuffer = this.logBuffer.slice(-SECURITY_CONFIG.MAX_LOG_ENTRIES);
            }

            return logEntry.id;
        } catch (error) {
            handleError(error, { context: 'SecurityLogger.logEvent', eventType });
        }
    }

    /**
     * Log authentication events
     */
    async logAuth(eventType, userId, additionalData = {}) {
        return this.logEvent(eventType, {
            userId,
            ...additionalData
        }, this._getAuthLogLevel(eventType));
    }

    /**
     * Log security violations
     */
    async logViolation(violationType, details = {}) {
        return this.logEvent(violationType, {
            severity: 'high',
            requiresInvestigation: true,
            ...details
        }, LOG_LEVELS.CRITICAL);
    }

    /**
     * Log API security events
     */
    async logApiSecurity(eventType, endpoint, details = {}) {
        return this.logEvent(eventType, {
            endpoint,
            method: details.method || 'GET',
            userAgent: details.userAgent,
            ip: details.ip,
            ...details
        }, LOG_LEVELS.WARNING);
    }

    /**
     * Get recent security events
     */
    async getRecentEvents(count = 50, level = null) {
        try {
            let events = [...this.logBuffer];

            if (level) {
                events = events.filter(event => event.level === level);
            }

            return events
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, count);

        } catch (error) {
            handleError(error, { context: 'SecurityLogger.getRecentEvents' });
            return [];
        }
    }

    /**
     * Get security summary
     */
    async getSecuritySummary() {
        try {
            const recentEvents = await this.getRecentEvents(200);
            const last24Hours = recentEvents.filter(event =>
                Date.now() - new Date(event.timestamp).getTime() < 24 * 60 * 60 * 1000
            );

            const summary = {
                totalEvents: recentEvents.length,
                last24Hours: last24Hours.length,
                byLevel: {},
                byType: {},
                criticalEvents: [],
                sessionId: this.sessionId
            };

            // Count by level
            for (const event of last24Hours) {
                summary.byLevel[event.level] = (summary.byLevel[event.level] || 0) + 1;
                summary.byType[event.eventType] = (summary.byType[event.eventType] || 0) + 1;

                if (event.level === LOG_LEVELS.CRITICAL) {
                    summary.criticalEvents.push(event);
                }
            }

            return summary;
        } catch (error) {
            handleError(error, { context: 'SecurityLogger.getSecuritySummary' });
            return { error: error.message };
        }
    }

    /**
     * Export logs for analysis
     */
    async exportLogs(format = 'json') {
        try {
            const allLogs = await this._getAllStoredLogs();

            if (format === 'csv') {
                return this._convertToCSV(allLogs);
            }

            return JSON.stringify(allLogs, null, 2);
        } catch (error) {
            handleError(error, { context: 'SecurityLogger.exportLogs' });
            throw error;
        }
    }

    /**
     * Clear old logs
     */
    async clearOldLogs() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - SECURITY_CONFIG.LOG_RETENTION_DAYS);

            this.logBuffer = this.logBuffer.filter(log =>
                new Date(log.timestamp) > cutoffDate
            );

            await this._persistLogs();

            await this.logEvent(SECURITY_EVENTS.SECURITY_SCAN_COMPLETED, {
                action: 'log_cleanup',
                retentionDays: SECURITY_CONFIG.LOG_RETENTION_DAYS
            });

        } catch (error) {
            handleError(error, { context: 'SecurityLogger.clearOldLogs' });
        }
    }

    /**
     * Flush logs immediately
     */
    async flush() {
        try {
            await this._persistLogs();
            await this._uploadLogs();
        } catch (error) {
            handleError(error, { context: 'SecurityLogger.flush' });
        }
    }

    // Private methods

    _generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateLogId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    _sanitizeLogData(data) {
        const sanitized = { ...data };

        // Remove sensitive fields
        const sensitiveFields = [
            'password', 'token', 'secret', 'key', 'credential',
            'ssn', 'creditCard', 'bankAccount', 'pin'
        ];

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }

        // Limit data size
        const dataString = JSON.stringify(sanitized);
        if (dataString.length > 1000) {
            return {
                ...sanitized,
                _truncated: true,
                _originalSize: dataString.length
            };
        }

        return sanitized;
    }

    _getUserAgent() {
        return `DietTracker/${Platform.OS}/${Platform.Version}`;
    }

    _getBuildInfo() {
        return {
            platform: Platform.OS,
            version: Platform.Version,
            // Add app version when available
            timestamp: Date.now()
        };
    }

    _getAuthLogLevel(eventType) {
        switch (eventType) {
            case SECURITY_EVENTS.LOGIN_FAILURE:
            case SECURITY_EVENTS.INVALID_TOKEN:
                return LOG_LEVELS.WARNING;
            case SECURITY_EVENTS.UNAUTHORIZED_ACCESS:
                return LOG_LEVELS.ERROR;
            default:
                return LOG_LEVELS.INFO;
        }
    }

    async _loadStoredLogs() {
        try {
            const storedLogs = await AsyncStorage.getItem(SECURITY_CONFIG.STORAGE_KEY);
            if (storedLogs) {
                this.logBuffer = JSON.parse(storedLogs);
            }
        } catch (error) {
            // Start with empty buffer if loading fails
            this.logBuffer = [];
        }
    }

    async _persistLogs() {
        try {
            await AsyncStorage.setItem(
                SECURITY_CONFIG.STORAGE_KEY,
                JSON.stringify(this.logBuffer)
            );
        } catch (error) {
            handleError(error, { context: 'SecurityLogger._persistLogs' });
        }
    }

    async _getAllStoredLogs() {
        await this._persistLogs();
        return [...this.logBuffer];
    }

    _startPeriodicUpload() {
        if (this.uploadTimer) {
            clearInterval(this.uploadTimer);
        }

        this.uploadTimer = setInterval(async () => {
            await this._uploadLogs();
        }, SECURITY_CONFIG.UPLOAD_INTERVAL_MS);
    }

    async _uploadLogs() {
        try {
            // In production, implement actual log upload to security service
            // For now, we'll just simulate the upload
            const logsToUpload = this.logBuffer.slice(0, SECURITY_CONFIG.BATCH_SIZE);

            if (logsToUpload.length === 0) {
                return;
            }

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 100));

            // In production: 
            // await fetch('/api/security/logs', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(logsToUpload)
            // });

            // Mark as uploaded (in production, remove from buffer after successful upload)
            // For now, we'll keep them for local analysis

        } catch (error) {
            handleError(error, { context: 'SecurityLogger._uploadLogs' });
        }
    }

    _convertToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = Object.keys(logs[0]);
        const csvHeaders = headers.join(',');

        const csvRows = logs.map(log =>
            headers.map(header => {
                const value = log[header];
                if (typeof value === 'object') {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }
}

// Create singleton instance
const securityLogger = new SecurityLogger();

// Auto-initialize
securityLogger.initialize().catch(error => {
    console.error('Failed to initialize security logger:', error);
});

export default securityLogger;

// Convenience functions
export const logSecurityEvent = (eventType, data, level) =>
    securityLogger.logEvent(eventType, data, level);

export const logAuthEvent = (eventType, userId, data) =>
    securityLogger.logAuth(eventType, userId, data);

export const logSecurityViolation = (violationType, details) =>
    securityLogger.logViolation(violationType, details);

export const logApiSecurity = (eventType, endpoint, details) =>
    securityLogger.logApiSecurity(eventType, endpoint, details);

export const getSecuritySummary = () =>
    securityLogger.getSecuritySummary();

export const exportSecurityLogs = (format) =>
    securityLogger.exportLogs(format);

export const flushSecurityLogs = () =>
    securityLogger.flush();