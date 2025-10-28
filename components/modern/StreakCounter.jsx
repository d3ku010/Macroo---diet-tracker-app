import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';

export default function StreakCounter({ streak = 0, bestStreak = 0 }) {
    const { theme } = useTheme();
    const flameAnimation = useRef(new Animated.Value(0)).current;
    const scaleAnimation = useRef(new Animated.Value(0)).current;
    const bounceAnimation = useRef(new Animated.Value(1)).current;

    // Validate and sanitize props
    const safeStreak = Math.max(0, Math.min(Number(streak) || 0, 10000)); // Max 10k days streak
    const safeBestStreak = Math.max(0, Math.min(Number(bestStreak) || 0, 10000));

    useEffect(() => {
        // Initial load animation
        const animation = Animated.parallel([
            Animated.spring(scaleAnimation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(flameAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flameAnimation, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ),
        ]);

        animation.start();

        // Cleanup function to stop animations
        return () => {
        };

    }, [streak]);

    const flameOpacity = flameAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
    });

    const flameScale = flameAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1.1],
    });

    const getStreakMessage = () => {
        if (safeStreak === 0) return "Start your journey!";
        if (safeStreak === 1) return "Great start!";
        if (safeStreak < 7) return "Building momentum!";
        if (safeStreak < 30) return "You're on fire!";
        if (safeStreak < 100) return "Unstoppable!";
        return "Legendary streak!";
    };

    const getStreakColor = () => {
        if (safeStreak === 0) return theme.subText;
        if (safeStreak < 7) return '#FDCB6E';
        if (safeStreak < 30) return '#FF6B35';
        if (safeStreak < 100) return '#E17055';
        return '#D63031';
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: theme.card,
                    transform: [{ scale: scaleAnimation }]
                }
            ]}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Logging Streak</Text>
                <Text style={[styles.subtitle, { color: theme.subText }]}>
                    Keep the momentum going!
                </Text>
            </View>

            <View style={styles.streakContent}>
                <Animated.View
                    style={[
                        styles.flameContainer,
                        {
                            transform: [
                                { scale: Animated.multiply(flameScale, bounceAnimation) }
                            ],
                            opacity: safeStreak > 0 ? flameOpacity : 0.3,
                        }
                    ]}
                >
                    <Ionicons
                        name="flame"
                        size={48}
                        color={getStreakColor()}
                    />
                </Animated.View>

                <View style={styles.streakInfo}>
                    <Text style={[styles.streakNumber, { color: theme.text }]}>
                        {safeStreak}
                    </Text>
                    <Text style={[styles.streakLabel, { color: theme.subText }]}>
                        {safeStreak === 1 ? 'day' : 'days'}
                    </Text>
                    <Text style={[styles.streakMessage, { color: getStreakColor() }]}>
                        {getStreakMessage()}
                    </Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {safeBestStreak}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>
                        Best Streak
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {Math.ceil(safeStreak / 7)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>
                        Weeks
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {safeStreak > 0 ? Math.round((safeStreak / 365) * 100) : 0}%
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>
                        Year Goal
                    </Text>
                </View>
            </View>

            {/* Progress bar for next milestone */}
            {safeStreak > 0 && (
                <View style={styles.progressSection}>
                    <Text style={[styles.progressLabel, { color: theme.subText }]}>
                        Next milestone: {Math.ceil(safeStreak / 7) * 7} days
                    </Text>
                    <View style={[styles.progressBar, { backgroundColor: theme.muted }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: getStreakColor(),
                                    width: `${((safeStreak % 7) / 7) * 100}%`
                                }
                            ]}
                        />
                    </View>
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    streakContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    flameContainer: {
        marginRight: 20,
    },
    streakInfo: {
        flex: 1,
    },
    streakNumber: {
        fontSize: 36,
        fontWeight: '800',
        lineHeight: 42,
    },
    streakLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 2,
    },
    streakMessage: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
        marginHorizontal: 16,
    },
    progressSection: {
        marginTop: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
        textAlign: 'center',
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});