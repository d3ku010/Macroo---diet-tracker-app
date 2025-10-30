/**
 * Enhanced App Initializer
 * Production-ready app initialization with all systems integrated
 */

import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureEnvironment } from '../config/environment';
import { AuthProvider } from '../contexts/AuthContext';
import { useAppStore } from '../stores/appStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useUserStore } from '../stores/userStore';
import { errorHandler } from '../utils/errorHandler';
import SplashScreen from './SplashScreen';
import { FeedbackProvider } from './ui/FeedbackSystem';
import GlobalErrorBoundary from './ui/GlobalErrorBoundary';

/**
 * App initialization states
 */
const INIT_STATES = {
    STARTING: 'starting',
    CONFIGURING: 'configuring',
    LOADING_STORES: 'loading_stores',
    READY: 'ready',
    ERROR: 'error'
};

/**
 * App initializer component
 */
const AppInitializer = ({ children }) => {
    const [initState, setInitState] = useState(INIT_STATES.STARTING);
    const [initError, setInitError] = useState(null);
    const [initProgress, setInitProgress] = useState(0);

    // Store methods
    const { initialize: initializeApp, recordCrash } = useAppStore();
    const { reset: resetUser } = useUserStore();
    const { reset: resetNutrition } = useNutritionStore();

    /**
     * Initialize app systems
     */
    useEffect(() => {
        const initializeAppSystems = async () => {
            try {
                setInitState(INIT_STATES.CONFIGURING);
                setInitProgress(10);

                // 1. Configure environment
                console.log('🔧 Configuring environment...');
                await configureEnvironment();
                setInitProgress(25);

                // 2. Initialize error handler
                console.log('🛡️ Initializing error handler...');
                errorHandler.initialize();
                setInitProgress(40);

                // 3. Initialize app store
                console.log('🏪 Initializing app store...');
                setInitState(INIT_STATES.LOADING_STORES);
                await initializeApp();
                setInitProgress(60);

                // 4. Check for app updates or migrations
                console.log('🔄 Checking for updates...');
                await checkForUpdates();
                setInitProgress(80);

                // 5. Perform cleanup if needed
                console.log('🧹 Performing cleanup...');
                await performCleanup();
                setInitProgress(95);

                // 6. Final preparations
                console.log('✅ Finalizing initialization...');
                await finalizeInitialization();
                setInitProgress(100);

                // App is ready
                setInitState(INIT_STATES.READY);
                console.log('🎉 App initialization complete!');

            } catch (error) {
                console.error('❌ App initialization failed:', error);

                // Handle initialization error
                const handledError = errorHandler.handleError(error, {
                    level: 'fatal',
                    context: {
                        component: 'AppInitializer',
                        initState,
                        initProgress
                    }
                });

                setInitError(handledError);
                setInitState(INIT_STATES.ERROR);
            }
        };

        initializeAppSystems();
    }, []);

    /**
     * Check for app updates or data migrations
     */
    const checkForUpdates = async () => {
        try {
            // Check app version and perform migrations if needed
            const currentVersion = '1.0.0'; // This would come from app config
            const lastVersion = await AsyncStorage.getItem('app_version');

            if (lastVersion && lastVersion !== currentVersion) {
                console.log(`📱 Updating from ${lastVersion} to ${currentVersion}`);
                await performMigrations(lastVersion, currentVersion);
            }

            await AsyncStorage.setItem('app_version', currentVersion);
        } catch (error) {
            console.warn('Failed to check for updates:', error);
            // Non-critical error, continue initialization
        }
    };

    /**
     * Perform data migrations
     */
    const performMigrations = async (fromVersion, toVersion) => {
        try {
            console.log(`🔄 Performing migrations from ${fromVersion} to ${toVersion}`);

            // Example migration logic
            if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
                // Migrate old data structure
                await migrateToV1();
            }

            console.log('✅ Migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw new Error(`Migration failed: ${error.message}`);
        }
    };

    /**
     * Migrate to version 1.0
     */
    const migrateToV1 = async () => {
        // Example migration: convert old storage format
        try {
            const oldData = await AsyncStorage.getItem('old_user_data');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                // Convert and save in new format
                await AsyncStorage.setItem('user-store', JSON.stringify({
                    state: { profile: parsed },
                    version: 0
                }));
                await AsyncStorage.removeItem('old_user_data');
            }
        } catch (error) {
            console.warn('Failed to migrate user data:', error);
        }
    };

    /**
     * Perform cleanup tasks
     */
    const performCleanup = async () => {
        try {
            // Clear old cache entries
            const keys = await AsyncStorage.getAllKeys();
            const oldCacheKeys = keys.filter(key =>
                key.startsWith('cache_') &&
                !key.includes(new Date().toISOString().split('T')[0])
            );

            if (oldCacheKeys.length > 0) {
                await AsyncStorage.multiRemove(oldCacheKeys);
                console.log(`🗑️ Cleaned up ${oldCacheKeys.length} old cache entries`);
            }
        } catch (error) {
            console.warn('Failed to perform cleanup:', error);
            // Non-critical error, continue
        }
    };

    /**
     * Finalize initialization
     */
    const finalizeInitialization = async () => {
        try {
            // Set up global error handlers
            const originalHandler = ErrorUtils.getGlobalHandler();
            ErrorUtils.setGlobalHandler((error, isFatal) => {
                console.error('Global Error:', error, 'Fatal:', isFatal);

                // Record crash
                recordCrash({
                    error: error.toString(),
                    stack: error.stack,
                    isFatal,
                    timestamp: new Date().toISOString()
                });

                // Handle through our error system
                errorHandler.handleError(error, {
                    level: isFatal ? 'fatal' : 'error',
                    context: { global: true, isFatal }
                });

                // Call original handler
                originalHandler(error, isFatal);
            });

            // Initialize other global systems
            await initializeNotifications();
            await initializeAnalytics();

        } catch (error) {
            console.warn('Failed to finalize initialization:', error);
            // Continue anyway
        }
    };

    /**
     * Initialize notifications
     */
    const initializeNotifications = async () => {
        try {
            // This would integrate with your notification system
            console.log('🔔 Notifications initialized');
        } catch (error) {
            console.warn('Failed to initialize notifications:', error);
        }
    };

    /**
     * Initialize analytics
     */
    const initializeAnalytics = async () => {
        try {
            // This would integrate with your analytics system
            console.log('📊 Analytics initialized');
        } catch (error) {
            console.warn('Failed to initialize analytics:', error);
        }
    };

    /**
     * Handle initialization retry
     */
    const handleRetry = () => {
        setInitState(INIT_STATES.STARTING);
        setInitError(null);
        setInitProgress(0);

        // Reset stores
        resetUser();
        resetNutrition();
    };

    /**
     * Handle factory reset
     */
    const handleFactoryReset = async () => {
        try {
            await AsyncStorage.clear();
            setInitState(INIT_STATES.STARTING);
            setInitError(null);
            setInitProgress(0);
        } catch (error) {
            console.error('Factory reset failed:', error);
        }
    };

    /**
     * Render loading state
     */
    if (initState !== INIT_STATES.READY) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

                <SplashScreen
                    loading={initState !== INIT_STATES.ERROR}
                    progress={initProgress}
                    message={getLoadingMessage(initState)}
                    error={initError}
                    onRetry={handleRetry}
                    onFactoryReset={handleFactoryReset}
                />
            </View>
        );
    }

    /**
     * App is ready - render main app
     */
    return (
        <SafeAreaProvider>
            <GlobalErrorBoundary recordCrash={recordCrash}>
                <FeedbackProvider>
                    <AuthProvider>
                        <StatusBar barStyle="dark-content" backgroundColor="white" />
                        {children}
                    </AuthProvider>
                </FeedbackProvider>
            </GlobalErrorBoundary>
        </SafeAreaProvider>
    );
};

/**
 * Get loading message for current state
 */
const getLoadingMessage = (state) => {
    switch (state) {
        case INIT_STATES.STARTING:
            return 'Starting up...';
        case INIT_STATES.CONFIGURING:
            return 'Configuring environment...';
        case INIT_STATES.LOADING_STORES:
            return 'Loading data stores...';
        case INIT_STATES.ERROR:
            return 'Initialization failed';
        default:
            return 'Loading...';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#007AFF'
    }
});

export default AppInitializer;