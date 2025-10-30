// Jest configuration for React Native
module.exports = {
    preset: 'react-native',

    // Setup files
    setupFiles: ['<rootDir>/jest/globals.js'],
    setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        '<rootDir>/jest/setup.js'
    ],

    // Module mapping
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^~/(.*)$': '<rootDir>/$1'
    },

    // Transform ignore patterns
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native(-.*)?|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],

    // Mock patterns
    modulePathIgnorePatterns: [
        '<rootDir>/node_modules',
        '<rootDir>/dist'
    ],

    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        'components/**/*.{js,jsx}',
        'contexts/**/*.{js,jsx}',
        'hooks/**/*.{js,jsx}',
        'services/**/*.{js,jsx}',
        'stores/**/*.{js,jsx}',
        'utils/**/*.{js,jsx}',
        '!**/__tests__/**',
        '!**/*.test.{js,jsx}',
        '!**/*.spec.{js,jsx}',
        '!**/node_modules/**',
        '!**/coverage/**'
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Test environment
    testEnvironment: 'react-native',

    // Test patterns
    testMatch: [
        '**/__tests__/**/*.{js,jsx}',
        '**/*.{test,spec}.{js,jsx}'
    ],

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,

    // Global variables
    globals: {
        '__DEV__': true,
    },

    // Timeout
    testTimeout: 10000
};