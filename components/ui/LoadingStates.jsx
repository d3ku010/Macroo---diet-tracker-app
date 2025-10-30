/**
 * Enhanced Loading States
 * Comprehensive loading indicators with skeleton screens
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Animated loading spinner
 */
export const LoadingSpinner = ({
    size = 40,
    color = '#007AFF',
    strokeWidth = 3,
    style
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const startRotation = () => {
            animatedValue.setValue(0);
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            }).start(() => startRotation());
        };

        startRotation();
    }, []);

    const rotate = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={[styles.spinnerContainer, { width: size, height: size }, style]}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        width: size,
                        height: size,
                        borderWidth: strokeWidth,
                        borderColor: color,
                        borderTopColor: 'transparent',
                        borderRadius: size / 2,
                        transform: [{ rotate }]
                    }
                ]}
            />
        </View>
    );
};

/**
 * Loading overlay
 */
export const LoadingOverlay = ({
    visible,
    message = 'Loading...',
    transparent = false,
    children
}) => {
    if (!visible) return children || null;

    return (
        <View style={styles.overlay}>
            {children}
            <View style={[
                styles.overlayContent,
                transparent && styles.transparentOverlay
            ]}>
                <LoadingSpinner size={48} />
                {message && (
                    <Text style={styles.overlayMessage}>{message}</Text>
                )}
            </View>
        </View>
    );
};

/**
 * Skeleton loading component
 */
export const SkeletonLoader = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const startAnimation = () => {
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: false
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: false
                })
            ]).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E1E9EE', '#F2F8FC']
    });

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor
                },
                style
            ]}
        />
    );
};

/**
 * Shimmer loading effect
 */
export const ShimmerLoader = ({
    width = '100%',
    height = 20,
    borderRadius = 4,
    style
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const startAnimation = () => {
            animatedValue.setValue(0);
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false
            }).start(() => startAnimation());
        };

        startAnimation();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width]
    });

    return (
        <View
            style={[
                styles.shimmerContainer,
                {
                    width,
                    height,
                    borderRadius
                },
                style
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmerGradient,
                    {
                        transform: [{ translateX }]
                    }
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.gradient,
                        {
                            width: typeof width === 'number' ? width : screenWidth,
                            height
                        }
                    ]}
                />
            </Animated.View>
        </View>
    );
};

/**
 * Card skeleton for meal entries
 */
export const MealCardSkeleton = ({ style }) => (
    <View style={[styles.cardSkeleton, style]}>
        <View style={styles.cardHeader}>
            <SkeletonLoader width={60} height={60} borderRadius={8} />
            <View style={styles.cardContent}>
                <SkeletonLoader width="70%" height={16} />
                <SkeletonLoader width="50%" height={12} style={{ marginTop: 4 }} />
                <SkeletonLoader width="40%" height={12} style={{ marginTop: 4 }} />
            </View>
        </View>
        <View style={styles.cardFooter}>
            <SkeletonLoader width={80} height={12} />
            <SkeletonLoader width={60} height={12} />
            <SkeletonLoader width={70} height={12} />
        </View>
    </View>
);

/**
 * List skeleton
 */
export const ListSkeleton = ({ itemCount = 5, ItemSkeleton = MealCardSkeleton }) => (
    <View style={styles.listSkeleton}>
        {Array.from({ length: itemCount }, (_, index) => (
            <ItemSkeleton key={index} style={{ marginBottom: 12 }} />
        ))}
    </View>
);

/**
 * Chart skeleton
 */
export const ChartSkeleton = ({ width = '100%', height = 200, style }) => (
    <View style={[styles.chartSkeleton, { width, height }, style]}>
        <View style={styles.chartHeader}>
            <SkeletonLoader width="60%" height={16} />
            <SkeletonLoader width="30%" height={12} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.chartContent}>
            <SkeletonLoader width="100%" height={height - 60} borderRadius={8} />
        </View>
    </View>
);

/**
 * Profile skeleton
 */
export const ProfileSkeleton = ({ style }) => (
    <View style={[styles.profileSkeleton, style]}>
        <View style={styles.profileHeader}>
            <SkeletonLoader width={80} height={80} borderRadius={40} />
            <View style={styles.profileInfo}>
                <SkeletonLoader width="80%" height={20} />
                <SkeletonLoader width="60%" height={14} style={{ marginTop: 8 }} />
                <SkeletonLoader width="70%" height={14} style={{ marginTop: 4 }} />
            </View>
        </View>
        <View style={styles.profileStats}>
            {Array.from({ length: 3 }, (_, index) => (
                <View key={index} style={styles.statItem}>
                    <SkeletonLoader width={50} height={24} />
                    <SkeletonLoader width={40} height={12} style={{ marginTop: 4 }} />
                </View>
            ))}
        </View>
    </View>
);

/**
 * Loading state wrapper
 */
export const LoadingState = ({
    loading,
    error,
    children,
    skeleton: Skeleton,
    emptyMessage = 'No data available',
    errorMessage = 'Something went wrong',
    onRetry
}) => {
    if (loading && Skeleton) {
        return <Skeleton />;
    }

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <LoadingSpinner />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>⚠️</Text>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
                {onRetry && (
                    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    if (!children) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>📭</Text>
                <Text style={styles.emptyMessage}>{emptyMessage}</Text>
            </View>
        );
    }

    return children;
};

const styles = StyleSheet.create({
    spinnerContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    spinner: {
        borderStyle: 'solid'
    },
    overlay: {
        flex: 1,
        position: 'relative'
    },
    overlayContent: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    },
    transparentOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)'
    },
    overlayMessage: {
        marginTop: 16,
        fontSize: 16,
        color: '#333',
        textAlign: 'center'
    },
    shimmerContainer: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden'
    },
    shimmerGradient: {
        flex: 1
    },
    gradient: {
        flex: 1
    },
    cardSkeleton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12
    },
    cardContent: {
        flex: 1,
        marginLeft: 12
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    listSkeleton: {
        padding: 16
    },
    chartSkeleton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    chartHeader: {
        marginBottom: 16
    },
    chartContent: {
        flex: 1
    },
    profileSkeleton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16
    },
    profileStats: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    statItem: {
        alignItems: 'center'
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    },
    errorText: {
        fontSize: 48,
        marginBottom: 16
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600'
    },
    emptyText: {
        fontSize: 48,
        marginBottom: 16
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    }
});

export default {
    LoadingSpinner,
    LoadingOverlay,
    SkeletonLoader,
    ShimmerLoader,
    MealCardSkeleton,
    ListSkeleton,
    ChartSkeleton,
    ProfileSkeleton,
    LoadingState
};