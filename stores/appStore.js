/**
 * App Store - Zustand
 * Manages global app state, settings, and UI preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { errorHandler } from '../utils/errorHandler';

/**
 * Initial app state
 */
const initialAppState = {
    // App info
    version: '1.0.0',
    buildNumber: 1,
    isFirstLaunch: true,
    lastUpdateCheck: null,

    // UI State
    theme: 'system', // light, dark, system
    colorScheme: 'default', // default, high-contrast, colorblind-friendly
    fontSize: 'medium', // small, medium, large, xl
    reducedMotion: false,
    hapticFeedback: true,

    // Navigation state
    activeTab: 'index',
    navigationHistory: [],

    // Feature flags
    features: {
        barcodeScan: true,
        photoCapture: true,
        exportData: true,
        socialSharing: false,
        premiumFeatures: false,
        betaFeatures: false
    },

    // Onboarding state
    onboarding: {
        completed: false,
        currentStep: 0,
        skippedSteps: [],
        completedSteps: []
    },

    // Connection state
    connectivity: {
        isOnline: true,
        isSlowConnection: false,
        lastOnline: new Date().toISOString()
    },

    // Performance monitoring
    performance: {
        appStartTime: new Date().toISOString(),
        sessionStartTime: new Date().toISOString(),
        crashCount: 0,
        errorCount: 0
    },

    // Notifications
    notifications: {
        permission: 'not-determined', // granted, denied, not-determined
        settings: {
            mealReminders: true,
            waterReminders: true,
            goalAchievements: true,
            weeklyReports: true,
            tips: false
        },
        scheduled: []
    },

    // Cache management
    cache: {
        lastCleared: new Date().toISOString(),
        size: 0,
        maxSize: 50 * 1024 * 1024, // 50MB
        autoCleanup: true
    },

    // Loading and error states
    loading: {
        app: false,
        sync: false,
        backup: false
    },

    errors: {
        app: null,
        sync: null,
        backup: null
    }
};

/**
 * App store with Zustand
 */
export const useAppStore = create(
    persist(
        (set, get) => ({
            ...initialAppState,

            /**
             * Clear all errors
             */
            clearErrors: () => {
                set((state) => ({
                    errors: {
                        app: null,
                        sync: null,
                        backup: null
                    }
                }));
            },

            /**
             * Set loading state for specific section
             */
            setLoading: (section, isLoading) => {
                set((state) => ({
                    loading: {
                        ...state.loading,
                        [section]: isLoading
                    },
                    errors: {
                        ...state.errors,
                        [section]: isLoading ? null : state.errors[section]
                    }
                }));
            },

            /**
             * Set error for specific section
             */
            setError: (section, error) => {
                set((state) => ({
                    errors: {
                        ...state.errors,
                        [section]: error
                    },
                    loading: {
                        ...state.loading,
                        [section]: false
                    },
                    performance: {
                        ...state.performance,
                        errorCount: state.performance.errorCount + 1
                    }
                }));
            },

            /**
             * Update theme
             */
            setTheme: (theme) => {
                set((state) => ({
                    theme,
                    colorScheme: theme === 'system' ? 'default' : state.colorScheme
                }));
            },

            /**
             * Update color scheme
             */
            setColorScheme: (colorScheme) => {
                set({ colorScheme });
            },

            /**
             * Update font size
             */
            setFontSize: (fontSize) => {
                set({ fontSize });
            },

            /**
             * Toggle reduced motion
             */
            toggleReducedMotion: () => {
                set((state) => ({
                    reducedMotion: !state.reducedMotion
                }));
            },

            /**
             * Toggle haptic feedback
             */
            toggleHapticFeedback: () => {
                set((state) => ({
                    hapticFeedback: !state.hapticFeedback
                }));
            },

            /**
             * Set active tab
             */
            setActiveTab: (tabName) => {
                set((state) => ({
                    activeTab: tabName,
                    navigationHistory: [...state.navigationHistory, {
                        tab: tabName,
                        timestamp: new Date().toISOString()
                    }].slice(-50) // Keep last 50 navigation events
                }));
            },

            /**
             * Update feature flag
             */
            setFeature: (featureName, enabled) => {
                set((state) => ({
                    features: {
                        ...state.features,
                        [featureName]: enabled
                    }
                }));
            },

            /**
             * Complete onboarding step
             */
            completeOnboardingStep: (stepIndex) => {
                set((state) => ({
                    onboarding: {
                        ...state.onboarding,
                        currentStep: Math.max(state.onboarding.currentStep, stepIndex + 1),
                        completedSteps: [...new Set([...state.onboarding.completedSteps, stepIndex])]
                    }
                }));
            },

            /**
             * Skip onboarding step
             */
            skipOnboardingStep: (stepIndex) => {
                set((state) => ({
                    onboarding: {
                        ...state.onboarding,
                        currentStep: stepIndex + 1,
                        skippedSteps: [...new Set([...state.onboarding.skippedSteps, stepIndex])]
                    }
                }));
            },

            /**
             * Complete onboarding
             */
            completeOnboarding: () => {
                set((state) => ({
                    onboarding: {
                        ...state.onboarding,
                        completed: true
                    },
                    isFirstLaunch: false
                }));
            },

            /**
             * Update connectivity status
             */
            setConnectivity: (connectivity) => {
                set((state) => ({
                    connectivity: {
                        ...state.connectivity,
                        ...connectivity,
                        lastOnline: connectivity.isOnline ? new Date().toISOString() : state.connectivity.lastOnline
                    }
                }));
            },

            /**
             * Update notification permission
             */
            setNotificationPermission: (permission) => {
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        permission
                    }
                }));
            },

            /**
             * Update notification settings
             */
            updateNotificationSettings: (settings) => {
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        settings: {
                            ...state.notifications.settings,
                            ...settings
                        }
                    }
                }));
            },

            /**
             * Add scheduled notification
             */
            addScheduledNotification: (notification) => {
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        scheduled: [...state.notifications.scheduled, notification]
                    }
                }));
            },

            /**
             * Remove scheduled notification
             */
            removeScheduledNotification: (notificationId) => {
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        scheduled: state.notifications.scheduled.filter(n => n.id !== notificationId)
                    }
                }));
            },

            /**
             * Update cache info
             */
            updateCacheInfo: (cacheInfo) => {
                set((state) => ({
                    cache: {
                        ...state.cache,
                        ...cacheInfo
                    }
                }));
            },

            /**
             * Clear cache
             */
            clearCache: async () => {
                try {
                    // Clear AsyncStorage cache (except persisted stores)
                    const keys = await AsyncStorage.getAllKeys();
                    const cacheKeys = keys.filter(key =>
                        !key.includes('user-store') &&
                        !key.includes('nutrition-store') &&
                        !key.includes('app-store')
                    );

                    if (cacheKeys.length > 0) {
                        await AsyncStorage.multiRemove(cacheKeys);
                    }

                    set((state) => ({
                        cache: {
                            ...state.cache,
                            lastCleared: new Date().toISOString(),
                            size: 0
                        }
                    }));

                    return true;
                } catch (error) {
                    console.error('Failed to clear cache:', error);
                    throw errorHandler.handleError(error);
                }
            },

            /**
             * Record app crash
             */
            recordCrash: (errorInfo) => {
                set((state) => ({
                    performance: {
                        ...state.performance,
                        crashCount: state.performance.crashCount + 1
                    }
                }));

                // Log crash to error handler
                errorHandler.handleError(new Error('App Crash'), {
                    level: 'fatal',
                    context: errorInfo
                });
            },

            /**
             * Start new session
             */
            startSession: () => {
                set((state) => ({
                    performance: {
                        ...state.performance,
                        sessionStartTime: new Date().toISOString()
                    }
                }));
            },

            /**
             * Get app health metrics
             */
            getHealthMetrics: () => {
                const state = get();
                const now = new Date();
                const sessionStart = new Date(state.performance.sessionStartTime);
                const appStart = new Date(state.performance.appStartTime);

                return {
                    sessionDuration: now - sessionStart,
                    appUptime: now - appStart,
                    crashRate: state.performance.crashCount / Math.max(1, state.performance.errorCount),
                    errorRate: state.performance.errorCount,
                    isHealthy: state.performance.crashCount === 0 && state.performance.errorCount < 10,
                    cacheUsage: (state.cache.size / state.cache.maxSize) * 100,
                    featuresEnabled: Object.values(state.features).filter(Boolean).length
                };
            },

            /**
             * Reset app state (factory reset)
             */
            factoryReset: async () => {
                try {
                    // Clear all AsyncStorage
                    await AsyncStorage.clear();

                    // Reset to initial state
                    set(initialAppState);

                    return true;
                } catch (error) {
                    console.error('Failed to perform factory reset:', error);
                    throw errorHandler.handleError(error);
                }
            },

            /**
             * Initialize app
             */
            initialize: async () => {
                set((state) => ({
                    performance: {
                        ...state.performance,
                        appStartTime: new Date().toISOString(),
                        sessionStartTime: new Date().toISOString()
                    }
                }));

                // Check if this is first launch
                if (get().isFirstLaunch) {
                    console.log('First app launch detected');
                }

                // Initialize features based on device capabilities
                // This would be expanded with actual capability checks
                const deviceFeatures = {
                    barcodeScan: true, // Check camera availability
                    photoCapture: true, // Check camera availability
                    hapticFeedback: true // Check haptic capability
                };

                set((state) => ({
                    features: {
                        ...state.features,
                        ...deviceFeatures
                    }
                }));
            }
        }),
        {
            name: 'app-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Persist most app state except performance and temporary states
                theme: state.theme,
                colorScheme: state.colorScheme,
                fontSize: state.fontSize,
                reducedMotion: state.reducedMotion,
                hapticFeedback: state.hapticFeedback,
                features: state.features,
                onboarding: state.onboarding,
                notifications: state.notifications,
                cache: state.cache,
                isFirstLaunch: state.isFirstLaunch,
                lastUpdateCheck: state.lastUpdateCheck
            })
        }
    )
);

export default useAppStore;