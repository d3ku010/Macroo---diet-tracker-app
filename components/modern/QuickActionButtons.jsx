import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';

export default function QuickActionButtons({ onCameraPress, onBarcodePress, onVoicePress, onQuickAddPress }) {
    const { theme } = useTheme();
    const animatedValues = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0)
    ]).current;

    useEffect(() => {
        const animations = animatedValues.map((value, index) =>
            Animated.spring(value, {
                toValue: 1,
                useNativeDriver: true,
                delay: index * 100,
                tension: 50,
                friction: 7,
            })
        );

        Animated.stagger(100, animations).start();
    }, []);

    const quickActions = [
        {
            icon: 'camera',
            label: 'Snap Food',
            color: '#6C5CE7',
            gradient: ['#6C5CE7', '#A29BFE'],
            onPress: onCameraPress || (() => { }),
        },
        {
            icon: 'barcode',
            label: 'Scan',
            color: '#00B894',
            gradient: ['#00B894', '#55EFC4'],
            onPress: onBarcodePress || (() => { }),
        },
        {
            icon: 'mic',
            label: 'Voice Log',
            color: '#E17055',
            gradient: ['#E17055', '#FDCB6E'],
            onPress: onVoicePress || (() => { }),
        },
        {
            icon: 'add-circle',
            label: 'Quick Add',
            color: '#74B9FF',
            gradient: ['#74B9FF', '#0984E3'],
            onPress: onQuickAddPress || (() => { }),
        },
    ];

    const QuickActionButton = ({ action, index }) => {
        const animatedValue = animatedValues[index];
        const pressAnimation = useRef(new Animated.Value(1)).current;

        const handlePressIn = () => {
            Animated.spring(pressAnimation, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(pressAnimation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        };

        const translateY = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
        });

        const opacity = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        return (
            <Animated.View
                style={[
                    styles.actionWrapper,
                    {
                        transform: [
                            { translateY },
                            { scale: pressAnimation }
                        ],
                        opacity,
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        { backgroundColor: action.color + '15', borderColor: action.color + '30' }
                    ]}
                    onPress={action.onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.8}
                >
                    <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                        <Ionicons name={action.icon} size={24} color="white" />
                    </View>
                    <Text style={[styles.actionLabel, { color: theme.text }]}>
                        {action.label}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Quick Actions</Text>
                <Text style={[styles.subtitle, { color: theme.subText }]}>
                    Log your meals faster
                </Text>
            </View>

            <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                    <QuickActionButton
                        key={action.label}
                        action={action}
                        index={index}
                    />
                ))}
            </View>
        </View>
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
        marginBottom: 16,
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
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionWrapper: {
        flex: 1,
        marginHorizontal: 4,
    },
    actionButton: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        minHeight: 100,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 16,
    },
});