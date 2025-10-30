// Simple Jest configuration for React Native
module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/jest/setup.simple.js'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    collectCoverage: false, // Disable for now to get tests working
    testMatch: [
        '**/__tests__/**/*.{js,jsx}',
        '**/*.{test,spec}.{js,jsx}'
    ],
    moduleFileExtensions: ['js', 'jsx', 'json'],
    verbose: true,
    clearMocks: true,
    testTimeout: 10000,
};