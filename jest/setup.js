/**
 * Jest Setup File
 * Global test configuration and mocks
 */

import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Global variables for React Native
global.__DEV__ = true;
global.__reanimatedWorkletInit = jest.fn();

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
        SafeAreaProvider: ({ children }) => children,
        SafeAreaConsumer: ({ children }) => children(inset),
        useSafeAreaInsets: () => inset,
        useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
    Constants: {
        expoConfig: {
            extra: {
                SUPABASE_URL: 'https://test.supabase.co',
                SUPABASE_ANON_KEY: 'test-key',
                NODE_ENV: 'test'
            }
        }
    }
}));

jest.mock('expo-linear-gradient', () => {
    const React = require('react');
    return {
        LinearGradient: ({ children, ...props }) =>
            React.createElement('View', props, children)
    };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
        reset: jest.fn(),
        setParams: jest.fn(),
    }),
    useRoute: () => ({
        params: {},
    }),
    useFocusEffect: jest.fn(),
    NavigationContainer: ({ children }) => children,
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } }
            })),
            resetPasswordForEmail: jest.fn(),
            updateUser: jest.fn(),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn(),
        })),
        rpc: jest.fn(),
    }))
}));

// Mock performance APIs
global.performance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
    }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() { }
    disconnect() { }
    unobserve() { }
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
    constructor() { }
    observe() { }
    disconnect() { }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock Blob for cache size calculations
global.Blob = class Blob {
    constructor(content) {
        this.size = JSON.stringify(content).length;
    }
};

// Console setup for tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
    // Suppress console errors/warnings during tests unless needed
    console.error = jest.fn();
    console.warn = jest.fn();
});

afterEach(() => {
    // Restore console
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    // Clear all mocks
    jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
    // Mock user data
    mockUser: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
            full_name: 'Test User'
        }
    },

    // Mock nutrition data
    mockMeal: {
        id: 'test-meal-id',
        food_item: {
            id: 'test-food-id',
            name: 'Test Food',
            calories: 100,
            protein: 10,
            carbs: 15,
            fat: 5
        },
        quantity: 1,
        meal_type: 'breakfast',
        date: '2025-10-30'
    },

    // Mock food item
    mockFood: {
        id: 'test-food-id',
        name: 'Apple',
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4
    },

    // Create mock store state
    createMockStore: (initialState = {}) => ({
        subscribe: jest.fn(),
        getState: jest.fn(() => initialState),
        setState: jest.fn(),
        ...initialState
    }),

    // Wait for async operations
    waitFor: (callback, options = {}) => {
        const { timeout = 1000, interval = 50 } = options;
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const check = () => {
                try {
                    const result = callback();
                    if (result) {
                        resolve(result);
                        return;
                    }
                } catch (error) {
                    // Continue checking
                }

                if (Date.now() - startTime >= timeout) {
                    reject(new Error('Timeout waiting for condition'));
                    return;
                }

                setTimeout(check, interval);
            };

            check();
        });
    }
};

// Setup fake timers
beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});