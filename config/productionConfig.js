/**
 * Production Build Configuration
 * Comprehensive build optimization and deployment configuration
 */

// Build optimization configuration
export const BUILD_CONFIG = {
    // Bundle configuration
    bundle: {
        minifyJS: true,
        minifyCSS: true,
        optimizeImages: true,
        enableTreeShaking: true,
        enableCodeSplitting: true,

        // Metro bundler configuration
        metro: {
            transformer: {
                minifierConfig: {
                    keep_fnames: false,
                    mangle: {
                        keep_fnames: false,
                    },
                    compress: {
                        drop_console: true, // Remove console logs in production
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug'],
                    },
                },
            },
            resolver: {
                alias: {
                    '@': './src',
                    '@components': './components',
                    '@utils': './utils',
                    '@assets': './assets',
                },
            },
        },
    },

    // Asset optimization
    assets: {
        enableImageOptimization: true,
        enableWebP: true,
        enableLazyLoading: true,
        fontSubsetting: true,
        svgOptimization: true,

        // Image compression settings
        imageCompression: {
            quality: 85,
            progressive: true,
            optimizationLevel: 7,
        },
    },

    // Performance optimizations
    performance: {
        enableHermes: true, // JavaScript engine optimization
        enableFabric: true, // New architecture
        enableTurboModules: true,
        enableConcurrentFeatures: true,

        // Bundle splitting
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },

    // Security settings
    security: {
        enableProGuard: true, // Android obfuscation
        enableBitcode: true, // iOS optimization
        stripDebugSymbols: true,
        enableCodeObfuscation: true,
        removeSourceMaps: false, // Keep for crash reporting
    },

    // Environment configuration
    environments: {
        development: {
            enableSourceMaps: true,
            enableHotReload: true,
            enableFlipperIntegration: true,
            logLevel: 'debug',
        },
        staging: {
            enableSourceMaps: true,
            enableHotReload: false,
            enableFlipperIntegration: false,
            logLevel: 'info',
        },
        production: {
            enableSourceMaps: false,
            enableHotReload: false,
            enableFlipperIntegration: false,
            logLevel: 'error',
        },
    },
};

// App Store optimization configuration
export const STORE_CONFIG = {
    // Metadata optimization
    metadata: {
        // Keywords for ASO (App Store Optimization)
        keywords: [
            'diet tracker',
            'nutrition app',
            'calorie counter',
            'meal planning',
            'health tracking',
            'fitness',
            'macro tracking',
            'food diary',
            'weight loss',
            'healthy eating',
        ],

        // App descriptions optimized for search
        shortDescription: 'Track nutrition, plan meals, and achieve your health goals',
        longDescription: `
      Transform your health journey with our comprehensive diet tracking app. 
      Features include:
      
      📊 Advanced Nutrition Tracking
      - Track calories, macros, and micronutrients
      - Comprehensive food database
      - Barcode scanning for easy logging
      
      🎯 Personalized Goals
      - Custom macro and calorie targets
      - Progress tracking and analytics
      - Achievement system
      
      📱 Smart Features
      - Meal photo capture
      - Recipe management
      - Export and backup data
      
      🔒 Privacy Focused
      - Secure local storage
      - Optional cloud backup with encryption
      - GDPR compliant
    `,

        // Categories
        primaryCategory: 'Health & Fitness',
        secondaryCategories: ['Medical', 'Lifestyle'],

        // Age rating
        ageRating: '4+',
        contentRating: 'Everyone',
    },

    // Visual assets
    assets: {
        // App icons (multiple sizes required)
        appIcons: {
            ios: [
                { size: '1024x1024', file: 'icon-1024.png' }, // App Store
                { size: '180x180', file: 'icon-180.png' }, // iPhone
                { size: '167x167', file: 'icon-167.png' }, // iPad Pro
                { size: '152x152', file: 'icon-152.png' }, // iPad
                { size: '120x120', file: 'icon-120.png' }, // iPhone (2x)
                { size: '87x87', file: 'icon-87.png' }, // iPhone (3x)
                { size: '80x80', file: 'icon-80.png' }, // iPad (2x)
                { size: '76x76', file: 'icon-76.png' }, // iPad
                { size: '60x60', file: 'icon-60.png' }, // iPhone
                { size: '58x58', file: 'icon-58.png' }, // Spotlight (2x)
                { size: '40x40', file: 'icon-40.png' }, // Spotlight
                { size: '29x29', file: 'icon-29.png' }, // Settings
            ],
            android: [
                { size: '512x512', file: 'icon-512.png' }, // Play Store
                { size: '192x192', file: 'icon-192.png' }, // xxxhdpi
                { size: '144x144', file: 'icon-144.png' }, // xxhdpi
                { size: '96x96', file: 'icon-96.png' }, // xhdpi
                { size: '72x72', file: 'icon-72.png' }, // hdpi
                { size: '48x48', file: 'icon-48.png' }, // mdpi
            ],
        },

        // Screenshots for app stores
        screenshots: {
            ios: {
                iphone: [
                    '6.5-inch-1.png', '6.5-inch-2.png', '6.5-inch-3.png',
                    '6.5-inch-4.png', '6.5-inch-5.png'
                ],
                ipad: [
                    '12.9-inch-1.png', '12.9-inch-2.png', '12.9-inch-3.png',
                    '12.9-inch-4.png', '12.9-inch-5.png'
                ],
            },
            android: {
                phone: [
                    'phone-1.png', 'phone-2.png', 'phone-3.png',
                    'phone-4.png', 'phone-5.png'
                ],
                tablet: [
                    'tablet-1.png', 'tablet-2.png', 'tablet-3.png'
                ],
            },
        },

        // Feature graphics
        featureGraphic: 'feature-graphic-1024x500.png', // Android
        promoGraphic: 'promo-graphic-180x120.png', // Android
    },

    // Store listing optimization
    optimization: {
        // A/B testing configurations
        variants: {
            titleA: 'Diet Tracker - Nutrition App',
            titleB: 'NutriTrack - Calorie Counter',

            iconA: 'icon-variant-a.png',
            iconB: 'icon-variant-b.png',

            screenshotsA: ['variant-a-1.png', 'variant-a-2.png'],
            screenshotsB: ['variant-b-1.png', 'variant-b-2.png'],
        },

        // Localization
        supportedLanguages: [
            'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT',
            'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW'
        ],

        // Seasonal campaigns
        campaigns: {
            newYear: {
                title: 'New Year, New You - Diet Tracker',
                description: 'Start your health journey with our comprehensive nutrition app',
                keywords: ['new year resolution', 'weight loss', 'healthy habits'],
            },
            summer: {
                title: 'Summer Body Ready - Diet Tracker',
                description: 'Get beach ready with personalized nutrition tracking',
                keywords: ['summer body', 'beach ready', 'fitness goals'],
            },
        },
    },
};

// CI/CD Pipeline configuration
export const CICD_CONFIG = {
    // Build pipeline stages
    stages: {
        lint: {
            enabled: true,
            failOnError: true,
            rules: ['@typescript-eslint/recommended', 'prettier'],
        },

        test: {
            enabled: true,
            coverage: {
                threshold: 70,
                failOnThreshold: true,
            },
            types: ['unit', 'integration', 'e2e'],
        },

        security: {
            enabled: true,
            scanTypes: ['vulnerability', 'secrets', 'licenses'],
            failOnHigh: true,
        },

        build: {
            platforms: ['ios', 'android'],
            configurations: ['development', 'staging', 'production'],
            artifacts: ['ipa', 'apk', 'aab'],
        },

        deploy: {
            environments: ['staging', 'production'],
            strategies: ['rolling', 'blue-green'],
            approvals: {
                staging: 'automatic',
                production: 'manual',
            },
        },
    },

    // Environment variables
    environments: {
        development: {
            API_URL: 'https://dev-api.diettracker.app',
            SUPABASE_URL: 'https://dev.supabase.co',
            ANALYTICS_ENABLED: false,
            LOG_LEVEL: 'debug',
        },
        staging: {
            API_URL: 'https://staging-api.diettracker.app',
            SUPABASE_URL: 'https://staging.supabase.co',
            ANALYTICS_ENABLED: true,
            LOG_LEVEL: 'info',
        },
        production: {
            API_URL: 'https://api.diettracker.app',
            SUPABASE_URL: 'https://prod.supabase.co',
            ANALYTICS_ENABLED: true,
            LOG_LEVEL: 'error',
        },
    },

    // Notification settings
    notifications: {
        slack: {
            channel: '#deployments',
            events: ['build-success', 'build-failure', 'deploy-success', 'deploy-failure'],
        },
        email: {
            recipients: ['team@diettracker.app'],
            events: ['production-deploy', 'critical-failure'],
        },
    },

    // Deployment strategies
    deployment: {
        ios: {
            testflight: {
                enabled: true,
                groups: ['internal', 'beta-testers'],
                autoSubmit: false,
            },
            appstore: {
                enabled: true,
                autoSubmit: false,
                phasedreleases: true,
                reviewNotes: 'Updated nutrition tracking with new features',
            },
        },
        android: {
            internal: {
                enabled: true,
                track: 'internal',
                rollout: 100,
            },
            beta: {
                enabled: true,
                track: 'beta',
                rollout: 50,
            },
            production: {
                enabled: true,
                track: 'production',
                rollout: 10, // Start with 10% rollout
            },
        },
    },
};

// Monitoring and alerting configuration
export const MONITORING_CONFIG = {
    // Performance monitoring
    performance: {
        // Core Web Vitals thresholds
        thresholds: {
            appStartTime: 3000, // 3 seconds
            screenTransition: 300, // 300ms
            apiResponse: 2000, // 2 seconds
            crashRate: 0.01, // 1%
            memoryUsage: 80, // 80% of available memory
        },

        // Monitoring intervals
        intervals: {
            performance: 30000, // 30 seconds
            memory: 60000, // 1 minute
            crashes: 10000, // 10 seconds
        },
    },

    // Error tracking
    errors: {
        // Error rate thresholds
        thresholds: {
            errorRate: 0.05, // 5%
            crashRate: 0.01, // 1%
            apiErrorRate: 0.02, // 2%
        },

        // Alert levels
        alertLevels: {
            warning: 0.02, // 2%
            critical: 0.05, // 5%
            emergency: 0.1, // 10%
        },

        // Ignored errors
        ignoredErrors: [
            'Network request failed',
            'ChunkLoadError',
            'Loading chunk',
            'Non-Error promise rejection captured',
        ],
    },

    // User analytics
    analytics: {
        // Key metrics
        metrics: [
            'daily_active_users',
            'weekly_active_users',
            'monthly_active_users',
            'session_duration',
            'retention_rate',
            'conversion_rate',
        ],

        // Funnel tracking
        funnels: {
            onboarding: [
                'app_opened',
                'account_created',
                'profile_completed',
                'first_meal_logged',
            ],
            engagement: [
                'meal_logged',
                'photo_captured',
                'goal_set',
                'achievement_unlocked',
            ],
        },
    },

    // Alerting rules
    alerts: {
        // Performance alerts
        appStartTimeSlow: {
            condition: 'app_start_time > 5000',
            severity: 'warning',
            channels: ['slack', 'email'],
        },

        highCrashRate: {
            condition: 'crash_rate > 0.02',
            severity: 'critical',
            channels: ['slack', 'email', 'pager'],
        },

        lowDailyActiveUsers: {
            condition: 'daily_active_users < 100',
            severity: 'warning',
            channels: ['slack'],
        },

        apiErrorSpike: {
            condition: 'api_error_rate > 0.05',
            severity: 'critical',
            channels: ['slack', 'email'],
        },
    },
};

// Feature flags configuration
export const FEATURE_FLAGS = {
    // Core features
    core: {
        enhancedNutritionTracking: {
            enabled: true,
            rollout: 100,
            description: 'Enhanced nutrition tracking with micronutrients',
        },

        barcodeScanning: {
            enabled: true,
            rollout: 100,
            description: 'Barcode scanning for food items',
        },

        mealPhotoCapture: {
            enabled: true,
            rollout: 80,
            description: 'Photo capture for meals',
        },
    },

    // Experimental features
    experimental: {
        aiNutritionRecommendations: {
            enabled: false,
            rollout: 10,
            description: 'AI-powered nutrition recommendations',
        },

        socialSharing: {
            enabled: false,
            rollout: 25,
            description: 'Share progress with friends',
        },

        premiumFeatures: {
            enabled: true,
            rollout: 100,
            description: 'Premium subscription features',
        },
    },

    // Platform-specific features
    platform: {
        ios: {
            healthKitIntegration: {
                enabled: true,
                rollout: 100,
                description: 'Apple HealthKit integration',
            },

            siriShortcuts: {
                enabled: true,
                rollout: 50,
                description: 'Siri shortcuts for quick actions',
            },
        },

        android: {
            googleFitIntegration: {
                enabled: true,
                rollout: 100,
                description: 'Google Fit integration',
            },

            androidShortcuts: {
                enabled: true,
                rollout: 75,
                description: 'Android app shortcuts',
            },
        },
    },
};

// Export all configurations
export default {
    BUILD_CONFIG,
    STORE_CONFIG,
    CICD_CONFIG,
    MONITORING_CONFIG,
    FEATURE_FLAGS,
};