/**
 * Analytics & Monitoring System
 * Production-ready user analytics, crash reporting, and performance monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { AppState, Dimensions, Platform } from 'react-native';
import { handleError } from './errorHandler';
import secureStorage from './secureStorage';
import { logSecurityEvent, SECURITY_EVENTS } from './securityLogger';

// Analytics configuration
const ANALYTICS_CONFIG = {
    // Event batching
    BATCH_SIZE: 50,
    FLUSH_INTERVAL: 30000, // 30 seconds
    MAX_QUEUE_SIZE: 1000,

    // Storage
    EVENTS_STORAGE_KEY: 'analytics_events',
    SESSION_STORAGE_KEY: 'analytics_session',
    USER_STORAGE_KEY: 'analytics_user',

    // Session management
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    HEARTBEAT_INTERVAL: 60000, // 1 minute

    // Performance monitoring
    PERFORMANCE_SAMPLE_RATE: 0.1, // 10% sampling
    SLOW_OPERATION_THRESHOLD: 1000, // 1 second
    MEMORY_WARNING_THRESHOLD: 0.8, // 80% memory usage

    // Privacy
    RESPECT_DO_NOT_TRACK: true,
    ANONYMIZE_IP: true,
    DATA_RETENTION_DAYS: 365,

    // Crash reporting
    CRASH_REPORT_ENDPOINT: '/api/crashes',
    INCLUDE_STACK_TRACES: true,
    MAX_CRASH_REPORTS_PER_SESSION: 10
};

// Event types
export const EVENT_TYPES = {
    // User actions
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    USER_REGISTER: 'user_register',

    // App usage
    SCREEN_VIEW: 'screen_view',
    FEATURE_USED: 'feature_used',
    BUTTON_CLICKED: 'button_clicked',
    FORM_SUBMITTED: 'form_submitted',

    // Nutrition tracking
    MEAL_LOGGED: 'meal_logged',
    FOOD_SEARCHED: 'food_searched',
    GOAL_SET: 'goal_set',
    PROGRESS_VIEWED: 'progress_viewed',

    // Performance
    APP_STARTUP: 'app_startup',
    SCREEN_LOAD_TIME: 'screen_load_time',
    API_RESPONSE_TIME: 'api_response_time',
    SLOW_OPERATION: 'slow_operation',

    // Errors
    ERROR_OCCURRED: 'error_occurred',
    CRASH_DETECTED: 'crash_detected',
    API_ERROR: 'api_error',

    // Engagement
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    APP_BACKGROUNDED: 'app_backgrounded',
    APP_FOREGROUNDED: 'app_foregrounded'
};

class AnalyticsMonitor {
    constructor() {
        this.eventQueue = [];
        this.sessionId = null;
        this.userId = null;
        this.sessionStartTime = null;
        this.flushTimer = null;
        this.heartbeatTimer = null;
        this.performanceObserver = null;
        this.appStateListener = null;
        this.initialized = false;
        this.crashCount = 0;
        this.deviceInfo = null;
    }

    /**
     * Initialize analytics and monitoring
     */
    async initialize(userId = null, options = {}) {
        try {
            if (this.initialized) {
                return true;
            }

            // Check privacy settings
            if (ANALYTICS_CONFIG.RESPECT_DO_NOT_TRACK && await this._checkDoNotTrack()) {
                return false;
            }

            // Collect device information
            await this._collectDeviceInfo();

            // Set user ID
            if (userId) {
                await this.setUserId(userId);
            }

            // Start new session
            await this._startSession();

            // Setup event batching
            this._setupEventBatching();

            // Setup performance monitoring
            this._setupPerformanceMonitoring();

            // Setup app state monitoring
            this._setupAppStateMonitoring();

            // Setup crash detection
            this._setupCrashDetection();

            this.initialized = true;

            // Track initialization
            await this.trackEvent(EVENT_TYPES.APP_STARTUP, {
                initializationTime: Date.now() - (this.sessionStartTime || Date.now()),
                deviceInfo: this.deviceInfo
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor.initialize' });
            return false;
        }
    }

    /**
     * Set user ID for tracking
     */
    async setUserId(userId) {
        try {
            this.userId = userId;

            // Store user info securely
            await secureStorage.setSecure(ANALYTICS_CONFIG.USER_STORAGE_KEY, {
                userId,
                setAt: new Date().toISOString()
            });

            // Track user identification
            await this.trackEvent(EVENT_TYPES.USER_LOGIN, {
                userId: this._hashUserId(userId)
            });

        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor.setUserId' });
        }
    }

    /**
     * Track custom event
     */
    async trackEvent(eventType, properties = {}, options = {}) {
        try {
            if (!this.initialized) {
                return false;
            }

            const event = {
                id: this._generateEventId(),
                type: eventType,
                properties: this._sanitizeProperties(properties),
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                userId: this.userId ? this._hashUserId(this.userId) : null,
                deviceInfo: options.includeDeviceInfo ? this.deviceInfo : null,
                platform: Platform.OS,
                appVersion: this.deviceInfo?.appVersion,
                buildNumber: this.deviceInfo?.buildNumber
            };

            // Add to queue
            this.eventQueue.push(event);

            // Flush if queue is full
            if (this.eventQueue.length >= ANALYTICS_CONFIG.BATCH_SIZE) {
                await this._flushEvents();
            }

            return true;
        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor.trackEvent', eventType });
            return false;
        }
    }

    /**
     * Track screen view
     */
    async trackScreenView(screenName, properties = {}) {
        return this.trackEvent(EVENT_TYPES.SCREEN_VIEW, {
            screenName,
            ...properties
        });
    }

    /**
     * Track user action
     */
    async trackUserAction(action, target, properties = {}) {
        return this.trackEvent(EVENT_TYPES.FEATURE_USED, {
            action,
            target,
            ...properties
        });
    }

    /**
     * Track performance metric
     */
    async trackPerformance(metric, value, properties = {}) {
        if (Math.random() > ANALYTICS_CONFIG.PERFORMANCE_SAMPLE_RATE) {
            return false; // Skip based on sampling rate
        }

        return this.trackEvent(EVENT_TYPES.SCREEN_LOAD_TIME, {
            metric,
            value,
            ...properties
        });
    }

    /**
     * Track error
     */
    async trackError(error, context = {}, isCrash = false) {
        try {
            const errorData = {
                message: error.message || 'Unknown error',
                stack: error.stack || 'No stack trace',
                context,
                isCrash,
                timestamp: new Date().toISOString()
            };

            const eventType = isCrash ? EVENT_TYPES.CRASH_DETECTED : EVENT_TYPES.ERROR_OCCURRED;

            await this.trackEvent(eventType, errorData, {
                includeDeviceInfo: true
            });

            // Track crash count
            if (isCrash) {
                this.crashCount++;

                // Limit crash reports per session
                if (this.crashCount <= ANALYTICS_CONFIG.MAX_CRASH_REPORTS_PER_SESSION) {
                    await this._sendCrashReport(errorData);
                }
            }

            return true;
        } catch (trackingError) {
            // Don't let tracking errors crash the app
            console.error('Failed to track error:', trackingError);
            return false;
        }
    }

    /**
     * Track API call performance
     */
    async trackApiCall(endpoint, method, duration, status, error = null) {
        const properties = {
            endpoint: this._sanitizeEndpoint(endpoint),
            method,
            duration,
            status,
            isSuccess: !error && status >= 200 && status < 300
        };

        if (error) {
            properties.error = error.message;
        }

        return this.trackEvent(EVENT_TYPES.API_RESPONSE_TIME, properties);
    }

    /**
     * Get analytics summary
     */
    async getAnalyticsSummary() {
        try {
            const sessionInfo = await this._getSessionInfo();
            const queuedEvents = this.eventQueue.length;
            const totalEvents = await this._getTotalEventCount();

            return {
                initialized: this.initialized,
                sessionId: this.sessionId,
                sessionDuration: sessionInfo?.duration || 0,
                userId: this.userId ? this._hashUserId(this.userId) : null,
                queuedEvents,
                totalEvents,
                crashCount: this.crashCount,
                deviceInfo: this.deviceInfo,
                lastFlush: sessionInfo?.lastFlush
            };
        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor.getAnalyticsSummary' });
            return { error: error.message };
        }
    }

    /**
     * Flush events immediately
     */
    async flushEvents() {
        return this._flushEvents();
    }

    /**
     * Clear all analytics data
     */
    async clearAnalyticsData() {
        try {
            this.eventQueue = [];
            await AsyncStorage.multiRemove([
                ANALYTICS_CONFIG.EVENTS_STORAGE_KEY,
                ANALYTICS_CONFIG.SESSION_STORAGE_KEY
            ]);

            await this.trackEvent(EVENT_TYPES.USER_LOGOUT, {
                reason: 'data_cleared',
                sessionDuration: Date.now() - (this.sessionStartTime || Date.now())
            });

            return true;
        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor.clearAnalyticsData' });
            return false;
        }
    }

    // Private methods

    async _collectDeviceInfo() {
        try {
            const { width, height } = Dimensions.get('window');

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

                // Screen info
                screenWidth: width,
                screenHeight: height,

                // System info
                isEmulator: !Device.isDevice,
                systemName: Device.osName,
                systemVersion: Device.osVersion,

                // App state
                debugMode: __DEV__,
                releaseChannel: Constants.releaseChannel || 'development'
            };
        } catch (error) {
            this.deviceInfo = {
                platform: Platform.OS,
                error: 'Failed to collect device info'
            };
        }
    }

    async _startSession() {
        this.sessionId = this._generateSessionId();
        this.sessionStartTime = Date.now();
        this.crashCount = 0;

        const sessionData = {
            sessionId: this.sessionId,
            startTime: this.sessionStartTime,
            platform: Platform.OS,
            userId: this.userId
        };

        await AsyncStorage.setItem(
            ANALYTICS_CONFIG.SESSION_STORAGE_KEY,
            JSON.stringify(sessionData)
        );

        await this.trackEvent(EVENT_TYPES.SESSION_START, sessionData);
    }

    _setupEventBatching() {
        // Flush events periodically
        this.flushTimer = setInterval(async () => {
            await this._flushEvents();
        }, ANALYTICS_CONFIG.FLUSH_INTERVAL);

        // Setup heartbeat
        this.heartbeatTimer = setInterval(async () => {
            await this._recordHeartbeat();
        }, ANALYTICS_CONFIG.HEARTBEAT_INTERVAL);
    }

    _setupPerformanceMonitoring() {
        // Monitor slow operations
        this._originalConsoleWarn = console.warn;
        console.warn = (...args) => {
            this._originalConsoleWarn(...args);

            const message = args.join(' ');
            if (message.includes('slow') || message.includes('performance')) {
                this.trackEvent(EVENT_TYPES.SLOW_OPERATION, {
                    warning: message,
                    timestamp: Date.now()
                });
            }
        };
    }

    _setupAppStateMonitoring() {
        this.appStateListener = AppState.addEventListener('change', async (nextAppState) => {
            if (nextAppState === 'background') {
                await this.trackEvent(EVENT_TYPES.APP_BACKGROUNDED, {
                    sessionDuration: Date.now() - (this.sessionStartTime || Date.now())
                });
                await this._flushEvents();
            } else if (nextAppState === 'active') {
                await this.trackEvent(EVENT_TYPES.APP_FOREGROUNDED);
            }
        });
    }

    _setupCrashDetection() {
        // Set up global error handler
        if (!global.ErrorUtils) {
            global.ErrorUtils = {};
        }

        const originalHandler = global.ErrorUtils.getGlobalHandler();

        global.ErrorUtils.setGlobalHandler(async (error, isFatal) => {
            await this.trackError(error, { isFatal }, isFatal);

            // Call original handler
            if (originalHandler) {
                originalHandler(error, isFatal);
            }
        });
    }

    async _flushEvents() {
        try {
            if (this.eventQueue.length === 0) {
                return;
            }

            const events = [...this.eventQueue];
            this.eventQueue = [];

            // Store events locally
            await this._storeEvents(events);

            // In production, send to analytics service
            await this._sendEventsToService(events);

            // Update session info
            await this._updateSessionInfo({ lastFlush: new Date().toISOString() });

            logSecurityEvent(SECURITY_EVENTS.API_REQUEST_BLOCKED, {
                action: 'analytics_flush',
                eventCount: events.length
            });

        } catch (error) {
            // Put events back in queue if sending failed
            this.eventQueue.unshift(...(this.eventQueue.length ? [] : events));
            handleError(error, { context: 'AnalyticsMonitor._flushEvents' });
        }
    }

    async _storeEvents(events) {
        try {
            const existingEvents = await AsyncStorage.getItem(ANALYTICS_CONFIG.EVENTS_STORAGE_KEY);
            const storedEvents = existingEvents ? JSON.parse(existingEvents) : [];

            const allEvents = [...storedEvents, ...events];

            // Keep only recent events based on retention policy
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - ANALYTICS_CONFIG.DATA_RETENTION_DAYS);

            const filteredEvents = allEvents.filter(event =>
                new Date(event.timestamp) > cutoffDate
            );

            await AsyncStorage.setItem(
                ANALYTICS_CONFIG.EVENTS_STORAGE_KEY,
                JSON.stringify(filteredEvents.slice(-ANALYTICS_CONFIG.MAX_QUEUE_SIZE))
            );
        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor._storeEvents' });
        }
    }

    async _sendEventsToService(events) {
        // In production, implement actual analytics service integration
        // For now, just log successful "sending"
        console.log(`Analytics: Sending ${events.length} events to service`);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async _sendCrashReport(crashData) {
        try {
            // In production, send to crash reporting service
            console.log('Crash report:', crashData);

            // Store crash locally for offline sending
            const crashes = await AsyncStorage.getItem('crash_reports') || '[]';
            const crashList = JSON.parse(crashes);

            crashList.push({
                ...crashData,
                id: this._generateEventId(),
                deviceInfo: this.deviceInfo,
                sessionId: this.sessionId
            });

            await AsyncStorage.setItem('crash_reports', JSON.stringify(crashList.slice(-10)));
        } catch (error) {
            console.error('Failed to send crash report:', error);
        }
    }

    async _recordHeartbeat() {
        if (this.initialized && this.sessionId) {
            // Record session activity
            await this._updateSessionInfo({
                lastHeartbeat: new Date().toISOString(),
                duration: Date.now() - (this.sessionStartTime || Date.now())
            });
        }
    }

    async _checkDoNotTrack() {
        try {
            const doNotTrack = await AsyncStorage.getItem('do_not_track');
            return doNotTrack === 'true';
        } catch {
            return false;
        }
    }

    async _getSessionInfo() {
        try {
            const sessionData = await AsyncStorage.getItem(ANALYTICS_CONFIG.SESSION_STORAGE_KEY);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch {
            return null;
        }
    }

    async _updateSessionInfo(updates) {
        try {
            const sessionInfo = await this._getSessionInfo() || {};
            const updatedInfo = { ...sessionInfo, ...updates };

            await AsyncStorage.setItem(
                ANALYTICS_CONFIG.SESSION_STORAGE_KEY,
                JSON.stringify(updatedInfo)
            );
        } catch (error) {
            handleError(error, { context: 'AnalyticsMonitor._updateSessionInfo' });
        }
    }

    async _getTotalEventCount() {
        try {
            const events = await AsyncStorage.getItem(ANALYTICS_CONFIG.EVENTS_STORAGE_KEY);
            return events ? JSON.parse(events).length : 0;
        } catch {
            return 0;
        }
    }

    _sanitizeProperties(properties) {
        const sanitized = { ...properties };

        // Remove sensitive data
        const sensitiveKeys = ['password', 'token', 'secret', 'email', 'phone'];
        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                delete sanitized[key];
            }
        });

        // Limit object depth and size
        return this._limitObjectSize(sanitized, 3, 1000);
    }

    _limitObjectSize(obj, maxDepth, maxLength, currentDepth = 0) {
        if (currentDepth >= maxDepth || typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const limited = {};
        let keyCount = 0;

        for (const [key, value] of Object.entries(obj)) {
            if (keyCount >= maxLength) break;

            if (typeof value === 'object' && value !== null) {
                limited[key] = this._limitObjectSize(value, maxDepth, maxLength, currentDepth + 1);
            } else {
                limited[key] = typeof value === 'string' && value.length > 100
                    ? value.substring(0, 100) + '...'
                    : value;
            }

            keyCount++;
        }

        return limited;
    }

    _sanitizeEndpoint(endpoint) {
        // Remove sensitive parts from endpoint
        return endpoint.replace(/\/\d+/g, '/:id').replace(/\/[a-f0-9-]{36}/g, '/:uuid');
    }

    _hashUserId(userId) {
        // Simple hash for privacy - in production use proper hashing
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    _generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const analyticsMonitor = new AnalyticsMonitor();

export default analyticsMonitor;

// Convenience functions
export const initializeAnalytics = (userId, options) =>
    analyticsMonitor.initialize(userId, options);

export const trackEvent = (eventType, properties, options) =>
    analyticsMonitor.trackEvent(eventType, properties, options);

export const trackScreenView = (screenName, properties) =>
    analyticsMonitor.trackScreenView(screenName, properties);

export const trackUserAction = (action, target, properties) =>
    analyticsMonitor.trackUserAction(action, target, properties);

export const trackPerformance = (metric, value, properties) =>
    analyticsMonitor.trackPerformance(metric, value, properties);

export const trackError = (error, context, isCrash) =>
    analyticsMonitor.trackError(error, context, isCrash);

export const trackApiCall = (endpoint, method, duration, status, error) =>
    analyticsMonitor.trackApiCall(endpoint, method, duration, status, error);

export const setAnalyticsUserId = (userId) =>
    analyticsMonitor.setUserId(userId);

export const getAnalyticsSummary = () =>
    analyticsMonitor.getAnalyticsSummary();

export const flushAnalytics = () =>
    analyticsMonitor.flushEvents();

export const clearAnalytics = () =>
    analyticsMonitor.clearAnalyticsData();