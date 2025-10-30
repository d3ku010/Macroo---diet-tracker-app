/**
 * Environment Configuration
 * Centralized configuration management with secure environment variable handling
 */

import Constants from 'expo-constants';

// Environment types
const ENV_TYPES = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
};

// Get current environment
const getEnvironment = () => {
    if (__DEV__) return ENV_TYPES.DEVELOPMENT;
    return Constants.expoConfig?.extra?.environment || ENV_TYPES.PRODUCTION;
};

// Validate required environment variables
const validateEnvironmentVariables = (config) => {
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missing = requiredVars.filter(key => !config[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

// Environment configuration
const configs = {
    [ENV_TYPES.DEVELOPMENT]: {
        SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        API_TIMEOUT: 10000,
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
        LOG_LEVEL: 'debug',
        ENABLE_ANALYTICS: false,
        SENTRY_DSN: null
    },
    [ENV_TYPES.STAGING]: {
        SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl,
        SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey,
        API_TIMEOUT: 15000,
        CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
        LOG_LEVEL: 'warn',
        ENABLE_ANALYTICS: true,
        SENTRY_DSN: Constants.expoConfig?.extra?.sentryDsn
    },
    [ENV_TYPES.PRODUCTION]: {
        SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl,
        SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey,
        API_TIMEOUT: 20000,
        CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
        LOG_LEVEL: 'error',
        ENABLE_ANALYTICS: true,
        SENTRY_DSN: Constants.expoConfig?.extra?.sentryDsn
    }
};

// Get current configuration
const currentEnv = getEnvironment();
const config = configs[currentEnv];

// Validate configuration
try {
    validateEnvironmentVariables(config);
} catch (error) {
    console.error('❌ Environment Configuration Error:', error.message);
    // In development, show helpful error message
    if (__DEV__) {
        console.error(`
🔧 Setup Instructions:
1. Copy .env.example to .env
2. Add your Supabase credentials:
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
3. Restart the development server
    `);
    }
}

// Export configuration
export const ENV = currentEnv;
export const CONFIG = {
    ...config,
    IS_DEV: currentEnv === ENV_TYPES.DEVELOPMENT,
    IS_PROD: currentEnv === ENV_TYPES.PRODUCTION,
    APP_VERSION: Constants.expoConfig?.version || '1.0.0',
    BUILD_NUMBER: Constants.expoConfig?.extra?.buildNumber || 1
};

// Database table names
export const TABLES = {
    USERS: 'users',
    FOODS: 'foods',
    MEALS: 'meal_entries',
    WATER_ENTRIES: 'water_entries',
    USER_PROFILES: 'user_profiles',
    MEAL_TEMPLATES: 'meal_templates',
    ACHIEVEMENTS: 'user_achievements',
    WEEKLY_CHALLENGES: 'weekly_challenges'
};

// API endpoints
export const API_ENDPOINTS = {
    AUTH: {
        SIGN_UP: '/auth/v1/signup',
        SIGN_IN: '/auth/v1/token',
        SIGN_OUT: '/auth/v1/logout',
        REFRESH: '/auth/v1/token?grant_type=refresh_token'
    },
    DATA: {
        FOODS: '/rest/v1/foods',
        MEALS: '/rest/v1/meal_entries',
        WATER: '/rest/v1/water_entries',
        PROFILE: '/rest/v1/user_profiles'
    }
};

export default CONFIG;