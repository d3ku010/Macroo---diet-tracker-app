import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({
    loading = true,
    progress = 0,
    message = 'Loading...',
    error = null,
    onLoadingComplete,
    onRetry,
    onFactoryReset
}) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start the initial animation sequence
        const animationSequence = Animated.sequence([
            // Phase 1: Fade in and scale up logo
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ])
        ]);

        animationSequence.start();
    }, [fadeAnim, scaleAnim]);

    // Update progress animation when progress changes
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress / 100,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [progress, progressAnim]);

    // Handle completion
    useEffect(() => {
        if (!loading && !error && progress >= 100) {
            const timer = setTimeout(() => {
                onLoadingComplete?.();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, error, progress, onLoadingComplete]);

    // Render error state
    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <View style={[styles.logoCircle, styles.errorCircle]}>
                            <Text style={styles.logoText}>⚠️</Text>
                        </View>
                        <Text style={styles.appName}>Initialization Failed</Text>
                        <Text style={styles.errorMessage}>{error.message || 'Something went wrong'}</Text>
                    </Animated.View>

                    <View style={styles.errorActions}>
                        {onRetry && (
                            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        )}
                        {onFactoryReset && (
                            <TouchableOpacity style={styles.resetButton} onPress={onFactoryReset}>
                                <Text style={styles.resetButtonText}>Reset App</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Logo and App Name */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>🍽️</Text>
                    </View>
                    <Text style={styles.appName}>Macroo</Text>
                    <Text style={styles.tagline}>Diet Tracker</Text>
                </Animated.View>

                {/* Loading Progress */}
                <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.loadingText}>{message}</Text>
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </Animated.View>
            </View>

            {/* Version Info */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Text style={styles.versionText}>v1.0.0</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 80,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 48,
    },
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        fontWeight: '300',
    },
    loadingContainer: {
        width: '100%',
        alignItems: 'center',
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    progressBarContainer: {
        width: '80%',
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
    },
    versionText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        textAlign: 'center',
    },
    progressText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    errorCircle: {
        backgroundColor: 'rgba(255, 59, 48, 0.2)',
    },
    errorMessage: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    errorActions: {
        alignItems: 'center',
        marginTop: 40,
    },
    retryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 25,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    resetButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    resetButtonText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        textAlign: 'center',
    },
});