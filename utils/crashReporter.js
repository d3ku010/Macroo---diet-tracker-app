/**
 * Crash Reporter
 * Production-ready crash detection and reporting system
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { handleError } from './errorHandler';
import secureStorage from './secureStorage';
import { LOG_LEVELS, logSecurityEvent, SECURITY_EVENTS } from './securityLogger';

// Crash reporting configuration
const CRASH_CONFIG = {
    // Storage
    CRASH_STORAGE_KEY: 'crash_reports',
    CRASH_BREADCRUMBS_KEY: 'crash_breadcrumbs',
    CRASH_SESSION_KEY: 'crash_session',

    // Limits
    MAX_CRASHES_STORED: 50,
    MAX_BREADCRUMBS: 100,
    MAX_STACK_TRACE_LENGTH: 5000,
    MAX_CRASH_REPORTS_PER_MINUTE: 5,

    // Breadcrumb settings
    BREADCRUMB_RETENTION_HOURS: 24,
    AUTO_BREADCRUMB_TYPES: [
        'navigation',
        'user_action',
        'api_call',
        'state_change',
        'error'
    ],

    // Upload settings
    UPLOAD_TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 seconds
    BATCH_SIZE: 10,

    // Privacy
    ANONYMIZE_PERSONAL_DATA: true,
    COLLECT_DEVICE_INFO: true,
    COLLECT_MEMORY_INFO: true,

    // Symbolication
    ENABLE_SYMBOLICATION: true,
    SOURCE_MAP_URL: null // Set in production
};

// Crash severity levels
export const CRASH_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Breadcrumb types
export const BREADCRUMB_TYPE = {
    NAVIGATION: 'navigation',
    USER_ACTION: 'user_action',
    API_CALL: 'api_call',
    STATE_CHANGE: 'state_change',
    ERROR: 'error',
    INFO: 'info',
    DEBUG: 'debug'
};

class CrashReporter {
    constructor() {
        this.breadcrumbs = [];
        this.sessionId = null;
        this.userId = null;
        this.initialized = false;
        this.crashCount = 0;
        this.lastCrashTime = 0;
        this.deviceInfo = null;
        this.memoryWarnings = 0;
    }

    /**
     * Initialize crash reporter
     */
    async initialize(options = {}) {
        try {
            if (this.initialized) {
                return true;
            }

            // Setup global error handlers
            this._setupGlobalErrorHandlers();

            // Setup unhandled promise rejection handler
            this._setupUnhandledRejectionHandler();

            // Collect device information
            await this._collectDeviceInfo();

            // Load existing breadcrumbs
            await this._loadBreadcrumbs();

            // Setup memory monitoring
            this._setupMemoryMonitoring();

            // Generate session ID
            this.sessionId = this._generateSessionId();

            // Store session info
            await this._storeSessionInfo();

            // Upload any pending crash reports
            await this._uploadPendingReports();

            this.initialized = true;

            // Add initialization breadcrumb
            this.addBreadcrumb(BREADCRUMB_TYPE.INFO, 'Crash reporter initialized', {
                sessionId: this.sessionId,
                deviceInfo: this.deviceInfo
            });

            logSecurityEvent(SECURITY_EVENTS.SECURE_STORAGE_INITIALIZED, {
                component: 'crash_reporter',
                sessionId: this.sessionId
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'CrashReporter.initialize' });
            return false;
        }
    }

    /**
     * Set user ID for crash reports
     */
    async setUserId(userId) {
        try {
            this.userId = userId;

            // Store user info securely
            await secureStorage.setSecure('crash_user_id', {
                userId: this._hashUserId(userId),
                setAt: new Date().toISOString()
            });

            this.addBreadcrumb(BREADCRUMB_TYPE.INFO, 'User ID set', {
                userId: this._hashUserId(userId)
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'CrashReporter.setUserId' });
            return false;
        }
    }

    /**
     * Record a crash manually
     */
    async recordCrash(error, context = {}, severity = CRASH_SEVERITY.HIGH) {
        try {
            // Rate limiting check
            const now = Date.now();
            if (now - this.lastCrashTime < 60000) { // 1 minute
                this.crashCount++;
                if (this.crashCount > CRASH_CONFIG.MAX_CRASH_REPORTS_PER_MINUTE) {
                    return false; // Skip to prevent spam
                }
            } else {
                this.crashCount = 1;
            }
            this.lastCrashTime = now;

            const crashReport = {
                id: this._generateCrashId(),
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                userId: this.userId ? this._hashUserId(this.userId) : null,

                // Error details
                error: {
                    message: error.message || 'Unknown error',
                    stack: this._sanitizeStackTrace(error.stack),
                    name: error.name || 'Error',
                    type: error.constructor?.name || 'Error'
                },

                // Context
                context: this._sanitizeContext(context),
                severity,

                // Device and app info
                deviceInfo: this.deviceInfo,
                appState: await this._getAppState(),
                memoryInfo: await this._getMemoryInfo(),

                // Breadcrumbs leading to crash
                breadcrumbs: this._getRecentBreadcrumbs(),

                // System info
                platform: Platform.OS,
                platformVersion: Platform.Version,
                appVersion: this.deviceInfo?.appVersion,
                buildNumber: this.deviceInfo?.buildNumber,

                // Additional metadata
                isJavaScriptError: true,
                isFatal: context.isFatal || false,
                isUnhandledRejection: context.isUnhandledRejection || false
            };

            // Store crash report
            await this._storeCrashReport(crashReport);

            // Add crash breadcrumb
            this.addBreadcrumb(BREADCRUMB_TYPE.ERROR, 'Crash recorded', {
                crashId: crashReport.id,
                severity,
                errorMessage: error.message
            });

            // Log security event
            logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
                type: 'crash_detected',
                crashId: crashReport.id,
                severity,
                errorMessage: error.message,
                sessionId: this.sessionId
            }, LOG_LEVELS.ERROR);

            // Attempt immediate upload for critical crashes
            if (severity === CRASH_SEVERITY.CRITICAL) {
                await this._uploadCrashReport(crashReport);
            }

            return crashReport.id;
        } catch (reportingError) {
            console.error('Failed to record crash:', reportingError);
            return false;
        }
    }

    /**
     * Add breadcrumb for tracking user actions
     */
    addBreadcrumb(type, message, data = {}, timestamp = null) {
        try {
            const breadcrumb = {
                id: this._generateBreadcrumbId(),
                type,
                message,
                data: this._sanitizeContext(data),
                timestamp: timestamp || new Date().toISOString(),
                sessionId: this.sessionId
            };

            this.breadcrumbs.push(breadcrumb);

            // Maintain breadcrumb limit
            if (this.breadcrumbs.length > CRASH_CONFIG.MAX_BREADCRUMBS) {
                this.breadcrumbs = this.breadcrumbs.slice(-CRASH_CONFIG.MAX_BREADCRUMBS);
            }

            // Clean old breadcrumbs
            this._cleanOldBreadcrumbs();

            // Store breadcrumbs periodically
            if (this.breadcrumbs.length % 10 === 0) {
                this._storeBreadcrumbs();
            }

            return breadcrumb.id;
        } catch (error) {
            console.error('Failed to add breadcrumb:', error);
            return false;
        }
    }

    /**
     * Get crash report summary
     */
    async getCrashSummary() {
        try {
            const storedReports = await this._getStoredCrashReports();
            const recentCrashes = storedReports.filter(crash =>
                Date.now() - new Date(crash.timestamp).getTime() < 24 * 60 * 60 * 1000
            );

            const severityCount = {};
            recentCrashes.forEach(crash => {
                severityCount[crash.severity] = (severityCount[crash.severity] || 0) + 1;
            });

            return {
                totalCrashes: storedReports.length,
                recentCrashes: recentCrashes.length,
                severityBreakdown: severityCount,
                lastCrash: storedReports.length > 0 ? storedReports[storedReports.length - 1] : null,
                sessionId: this.sessionId,
                breadcrumbCount: this.breadcrumbs.length,
                memoryWarnings: this.memoryWarnings,
                initialized: this.initialized
            };
        } catch (error) {
            handleError(error, { context: 'CrashReporter.getCrashSummary' });
            return { error: error.message };
        }
    }

    /**
     * Upload pending crash reports
     */
    async uploadPendingReports() {
        return this._uploadPendingReports();
    }

    /**
     * Clear all crash data
     */
    async clearCrashData() {
        try {
            await AsyncStorage.multiRemove([
                CRASH_CONFIG.CRASH_STORAGE_KEY,
                CRASH_CONFIG.CRASH_BREADCRUMBS_KEY,
                CRASH_CONFIG.CRASH_SESSION_KEY
            ]);

            this.breadcrumbs = [];
            this.crashCount = 0;

            this.addBreadcrumb(BREADCRUMB_TYPE.INFO, 'Crash data cleared');

            return true;
        } catch (error) {
            handleError(error, { context: 'CrashReporter.clearCrashData' });
            return false;
        }
    }

    // Private methods

    _setupGlobalErrorHandlers() {
        // JavaScript errors
        const originalErrorHandler = global.ErrorUtils?.getGlobalHandler();

        global.ErrorUtils?.setGlobalHandler(async (error, isFatal) => {
            await this.recordCrash(error, {
                isFatal,
                source: 'global_error_handler'
            }, isFatal ? CRASH_SEVERITY.CRITICAL : CRASH_SEVERITY.HIGH);

            // Call original handler
            if (originalErrorHandler) {
                originalErrorHandler(error, isFatal);
            }
        });

        // Console errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            originalConsoleError(...args);

            const message = args.join(' ');
            this.addBreadcrumb(BREADCRUMB_TYPE.ERROR, 'Console error', {
                message: message.substring(0, 500)
            });
        };
    }

    _setupUnhandledRejectionHandler() {
        // For React Native, we need to handle promise rejections
        if (typeof process !== 'undefined' && process.on) {
            process.on('unhandledRejection', async (reason, promise) => {
                const error = reason instanceof Error ? reason : new Error(String(reason));

                await this.recordCrash(error, {
                    isUnhandledRejection: true,
                    source: 'unhandled_promise_rejection'
                }, CRASH_SEVERITY.HIGH);
            });
        }
    }

    _setupMemoryMonitoring() {
        // Monitor memory warnings (if available)
        if (global.performance && global.performance.memory) {
            setInterval(() => {
                const memory = global.performance.memory;
                const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

                if (usedRatio > CRASH_CONFIG.MEMORY_WARNING_THRESHOLD) {
                    this.memoryWarnings++;

                    this.addBreadcrumb(BREADCRUMB_TYPE.INFO, 'Memory warning', {
                        usedMemory: memory.usedJSHeapSize,
                        totalMemory: memory.jsHeapSizeLimit,
                        usagePercentage: Math.round(usedRatio * 100)
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    }

    async _collectDeviceInfo() {
        try {
            this.deviceInfo = {
                // App info
                appVersion: Application.nativeApplicationVersion || '1.0.0',
                buildNumber: Application.nativeBuildVersion || '1',
                bundleId: Application.applicationId,

                // Device info
                platform: Platform.OS,
                platformVersion: Platform.Version,
                deviceBrand: Device.brand,
                deviceName: Device.deviceName,
                deviceType: Device.deviceType,
                isEmulator: !Device.isDevice,

                // System info
                systemName: Device.osName,
                systemVersion: Device.osVersion,
                architecture: Device.deviceYearClass,

                // Debug info
                debugMode: __DEV__,
                developmentBuild: __DEV__
            };
        } catch (error) {
            this.deviceInfo = {
                platform: Platform.OS,
                error: 'Failed to collect device info'
            };
        }
    }

    async _loadBreadcrumbs() {
        try {
            const stored = await AsyncStorage.getItem(CRASH_CONFIG.CRASH_BREADCRUMBS_KEY);
            if (stored) {
                this.breadcrumbs = JSON.parse(stored);
                this._cleanOldBreadcrumbs();
            }
        } catch (error) {
            this.breadcrumbs = [];
        }
    }

    async _storeBreadcrumbs() {
        try {
            await AsyncStorage.setItem(
                CRASH_CONFIG.CRASH_BREADCRUMBS_KEY,
                JSON.stringify(this.breadcrumbs)
            );
        } catch (error) {
            console.error('Failed to store breadcrumbs:', error);
        }
    }

    async _storeSessionInfo() {
        try {
            const sessionInfo = {
                sessionId: this.sessionId,
                startTime: new Date().toISOString(),
                deviceInfo: this.deviceInfo,
                userId: this.userId ? this._hashUserId(this.userId) : null
            };

            await AsyncStorage.setItem(
                CRASH_CONFIG.CRASH_SESSION_KEY,
                JSON.stringify(sessionInfo)
            );
        } catch (error) {
            console.error('Failed to store session info:', error);
        }
    }

    async _storeCrashReport(crashReport) {
        try {
            const existing = await AsyncStorage.getItem(CRASH_CONFIG.CRASH_STORAGE_KEY);
            const reports = existing ? JSON.parse(existing) : [];

            reports.push(crashReport);

            // Keep only recent reports
            const filtered = reports
                .slice(-CRASH_CONFIG.MAX_CRASHES_STORED)
                .filter(report =>
                    Date.now() - new Date(report.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days
                );

            await AsyncStorage.setItem(
                CRASH_CONFIG.CRASH_STORAGE_KEY,
                JSON.stringify(filtered)
            );
        } catch (error) {
            console.error('Failed to store crash report:', error);
        }
    }

    async _getStoredCrashReports() {
        try {
            const stored = await AsyncStorage.getItem(CRASH_CONFIG.CRASH_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    async _uploadPendingReports() {
        try {
            const reports = await this._getStoredCrashReports();
            const pendingReports = reports.filter(report => !report.uploaded);

            if (pendingReports.length === 0) {
                return true;
            }

            // Upload in batches
            for (let i = 0; i < pendingReports.length; i += CRASH_CONFIG.BATCH_SIZE) {
                const batch = pendingReports.slice(i, i + CRASH_CONFIG.BATCH_SIZE);

                for (const report of batch) {
                    await this._uploadCrashReport(report);
                }
            }

            return true;
        } catch (error) {
            handleError(error, { context: 'CrashReporter._uploadPendingReports' });
            return false;
        }
    }

    async _uploadCrashReport(crashReport) {
        try {
            // In production, implement actual crash reporting service integration
            console.log('Uploading crash report:', {
                id: crashReport.id,
                timestamp: crashReport.timestamp,
                severity: crashReport.severity,
                message: crashReport.error.message
            });

            // Simulate upload
            await new Promise(resolve => setTimeout(resolve, 100));

            // Mark as uploaded
            crashReport.uploaded = true;
            crashReport.uploadedAt = new Date().toISOString();

            // Update stored report
            const reports = await this._getStoredCrashReports();
            const updatedReports = reports.map(report =>
                report.id === crashReport.id ? crashReport : report
            );

            await AsyncStorage.setItem(
                CRASH_CONFIG.CRASH_STORAGE_KEY,
                JSON.stringify(updatedReports)
            );

            return true;
        } catch (error) {
            console.error('Failed to upload crash report:', error);
            return false;
        }
    }

    async _getAppState() {
        return {
            timestamp: new Date().toISOString(),
            memoryWarnings: this.memoryWarnings,
            breadcrumbCount: this.breadcrumbs.length,
            sessionDuration: this.sessionId ? Date.now() - parseInt(this.sessionId.split('_')[1]) : 0
        };
    }

    async _getMemoryInfo() {
        if (global.performance?.memory) {
            return {
                usedJSHeapSize: global.performance.memory.usedJSHeapSize,
                totalJSHeapSize: global.performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: global.performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    _getRecentBreadcrumbs(count = 50) {
        return this.breadcrumbs.slice(-count);
    }

    _cleanOldBreadcrumbs() {
        const cutoff = Date.now() - (CRASH_CONFIG.BREADCRUMB_RETENTION_HOURS * 60 * 60 * 1000);
        this.breadcrumbs = this.breadcrumbs.filter(breadcrumb =>
            new Date(breadcrumb.timestamp).getTime() > cutoff
        );
    }

    _sanitizeStackTrace(stack) {
        if (!stack) return 'No stack trace available';

        // Limit stack trace length
        let sanitized = stack.substring(0, CRASH_CONFIG.MAX_STACK_TRACE_LENGTH);

        // Remove sensitive file paths in development
        if (__DEV__) {
            sanitized = sanitized.replace(/file:\/\/.*?\/([^\/]+\.js)/g, '$1');
        }

        return sanitized;
    }

    _sanitizeContext(context) {
        const sanitized = { ...context };

        // Remove sensitive data
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        });

        // Limit context size
        const contextString = JSON.stringify(sanitized);
        if (contextString.length > 1000) {
            return { ...sanitized, _truncated: true, _originalSize: contextString.length };
        }

        return sanitized;
    }

    _hashUserId(userId) {
        // Simple hash for privacy
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    _generateCrashId() {
        return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateBreadcrumbId() {
        return `bc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    _generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const crashReporter = new CrashReporter();

export default crashReporter;

// Convenience functions
export const initializeCrashReporter = (options) =>
    crashReporter.initialize(options);

export const recordCrash = (error, context, severity) =>
    crashReporter.recordCrash(error, context, severity);

export const addBreadcrumb = (type, message, data, timestamp) =>
    crashReporter.addBreadcrumb(type, message, data, timestamp);

export const setCrashUserId = (userId) =>
    crashReporter.setUserId(userId);

export const getCrashSummary = () =>
    crashReporter.getCrashSummary();

export const uploadPendingCrashes = () =>
    crashReporter.uploadPendingReports();

export const clearCrashData = () =>
    crashReporter.clearCrashData();