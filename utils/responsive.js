import { Dimensions, Platform } from 'react-native';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Screen size breakpoints (following mobile-first approach)
export const breakpoints = {
    xs: 0,     // Very small phones
    sm: 375,   // Small phones (iPhone SE)
    md: 414,   // Medium phones (iPhone 12)
    lg: 768,   // Tablets
    xl: 1024,  // Large tablets
};

export const screenSizes = {
    isXS: screenWidth < breakpoints.sm,
    isSM: screenWidth >= breakpoints.sm && screenWidth < breakpoints.md,
    isMD: screenWidth >= breakpoints.md && screenWidth < breakpoints.lg,
    isLG: screenWidth >= breakpoints.lg && screenWidth < breakpoints.xl,
    isXL: screenWidth >= breakpoints.xl,
    isTablet: screenWidth >= breakpoints.lg,
    isPhone: screenWidth < breakpoints.lg,
};

// Responsive spacing
export const spacing = {
    xs: screenSizes.isXS ? 4 : 6,
    sm: screenSizes.isXS ? 8 : 12,
    md: screenSizes.isXS ? 12 : 16,
    lg: screenSizes.isXS ? 16 : 24,
    xl: screenSizes.isXS ? 24 : 32,
    xxl: screenSizes.isXS ? 32 : 48,
};

// Responsive typography
export const typography = {
    xs: {
        fontSize: screenSizes.isXS ? 10 : 12,
        lineHeight: screenSizes.isXS ? 16 : 18,
    },
    sm: {
        fontSize: screenSizes.isXS ? 12 : 14,
        lineHeight: screenSizes.isXS ? 18 : 20,
    },
    md: {
        fontSize: screenSizes.isXS ? 14 : 16,
        lineHeight: screenSizes.isXS ? 20 : 24,
    },
    lg: {
        fontSize: screenSizes.isXS ? 16 : 18,
        lineHeight: screenSizes.isXS ? 24 : 28,
    },
    xl: {
        fontSize: screenSizes.isXS ? 18 : 24,
        lineHeight: screenSizes.isXS ? 28 : 32,
    },
    xxl: {
        fontSize: screenSizes.isXS ? 24 : 32,
        lineHeight: screenSizes.isXS ? 32 : 40,
    },
};

// Safe area utilities
export const safeArea = {
    top: Platform.OS === 'ios' ? (screenHeight >= 812 ? 44 : 20) : 0,
    bottom: Platform.OS === 'ios' ? (screenHeight >= 812 ? 34 : 0) : 0,
};

// Layout utilities
export const layout = {
    screenWidth,
    screenHeight,
    contentWidth: screenWidth - (spacing.md * 2),
    cardSpacing: spacing.md,
    headerHeight: Platform.OS === 'ios' ? 44 : 56,
    tabBarHeight: Platform.OS === 'ios' ? 49 : 56,
};

// Responsive card dimensions
export const cardDimensions = {
    small: {
        width: screenSizes.isXS ? '100%' : (screenWidth - (spacing.md * 3)) / 2,
        minHeight: screenSizes.isXS ? 80 : 100,
    },
    medium: {
        width: '100%',
        minHeight: screenSizes.isXS ? 120 : 150,
    },
    large: {
        width: '100%',
        minHeight: screenSizes.isXS ? 200 : 250,
    },
};

// Common shadow styles
export const shadows = {
    light: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    heavy: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
};

// Border radius
export const borderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 999,
};

export default {
    breakpoints,
    screenSizes,
    spacing,
    typography,
    safeArea,
    layout,
    cardDimensions,
    shadows,
    borderRadius,
};