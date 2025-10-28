import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../ui/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const screenWidth = Dimensions.get('window').width;

export default function CalorieRingCard({ calories = 0, target = 2000, burned = 0 }) {
    const { theme } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;
    const progressValue = useRef(new Animated.Value(0)).current;

    // Validate and sanitize props
    const safeCalories = Math.max(0, Number(calories) || 0);
    const safeTarget = Math.max(1, Number(target) || 2000); // Minimum 1 to avoid division by zero
    const safeBurned = Math.max(0, Number(burned) || 0);

    // Clamp values to reasonable ranges
    const clampedCalories = Math.min(safeCalories, 20000); // Max 20k calories
    const clampedTarget = Math.min(safeTarget, 20000);
    const clampedBurned = Math.min(safeBurned, 10000); // Max 10k burned

    const radius = 80;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(clampedCalories / clampedTarget, 1);
    const remaining = Math.max(clampedTarget - clampedCalories, 0);

    useEffect(() => {
        Animated.parallel([
            Animated.spring(animatedValue, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }),
            Animated.timing(progressValue, {
                toValue: progress,
                duration: 1500,
                useNativeDriver: false,
            })
        ]).start();
    }, [calories, target]);

    const animatedStrokeDashoffset = progressValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    const scaleAnimation = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
    });

    const opacityAnimation = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Animated.View
            style={[
                styles.card,
                {
                    backgroundColor: theme.card,
                    transform: [{ scale: scaleAnimation }],
                    opacity: opacityAnimation,
                }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="flame" size={24} color="#FF6B35" />
                    <Text style={[styles.title, { color: theme.text }]}>Today's Calories</Text>
                </View>
                <Text style={[styles.date, { color: theme.subText }]}>
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    })}
                </Text>
            </View>

            <View style={styles.ringContainer}>
                <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
                    {/* Background circle */}
                    <Circle
                        cx={radius + strokeWidth / 2}
                        cy={radius + strokeWidth / 2}
                        r={radius}
                        stroke={theme.muted}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress circle */}
                    <AnimatedCircle
                        cx={radius + strokeWidth / 2}
                        cy={radius + strokeWidth / 2}
                        r={radius}
                        stroke="#6C5CE7"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={animatedStrokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                    />
                </Svg>

                <View style={styles.centerContent}>
                    <Text style={[styles.caloriesNumber, { color: theme.text }]}>
                        {clampedCalories.toLocaleString()}
                    </Text>
                    <Text style={[styles.caloriesLabel, { color: theme.subText }]}>
                        of {clampedTarget.toLocaleString()}
                    </Text>
                    <Text style={[styles.remainingLabel, { color: theme.primary }]}>
                        {remaining.toLocaleString()} left
                    </Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Ionicons name="restaurant" size={16} color={theme.success} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{clampedCalories}</Text>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Food</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                    <Ionicons name="fitness" size={16} color={theme.danger} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{clampedBurned}</Text>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Burned</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                    <Ionicons name="trending-up" size={16} color={theme.primary} />
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {Math.round(progress * 100)}%
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Goal</Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 8,
    },
    date: {
        fontSize: 14,
        fontWeight: '500',
    },
    ringContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    caloriesNumber: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 38,
    },
    caloriesLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    remainingLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(128, 128, 128, 0.2)',
        marginHorizontal: 16,
    },
});