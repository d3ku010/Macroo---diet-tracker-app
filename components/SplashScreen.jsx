import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onLoadingComplete }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start the animation sequence
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
            ]),
            // Phase 2: Progress bar animation
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: false,
            }),
        ]);

        animationSequence.start(() => {
            // Wait a bit more then complete loading
            setTimeout(() => {
                onLoadingComplete();
            }, 300);
        });
    }, [fadeAnim, scaleAnim, progressAnim, onLoadingComplete]);

    return (
        <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            style={styles.container}
        >
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
                    <Text style={styles.loadingText}>Loading your nutrition data...</Text>
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
                </Animated.View>
            </View>

            {/* Version Info */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Text style={styles.versionText}>v1.0.0</Text>
            </Animated.View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
});