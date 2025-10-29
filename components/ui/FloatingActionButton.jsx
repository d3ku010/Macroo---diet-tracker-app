import { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { shadows, spacing, typography } from '../../utils/responsive';
import SmoothButton from './SmoothButton';
import { useTheme } from './ThemeProvider';

export default function FloatingActionButton({
    onPress,
    icon,
    size = 56,
    backgroundColor,
    iconColor,
    style,
    disabled = false,
    badge,
    badgeColor,
    ...props
}) {
    const { theme } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopPulse = () => {
        pulseAnim.setValue(1);
    };

    const fabStyles = [
        styles.fab,
        {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: backgroundColor || theme.primary,
        },
        style,
    ];

    return (
        <View style={styles.container}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <SmoothButton
                    onPress={onPress}
                    disabled={disabled}
                    animationType="both"
                    scaleValue={0.9}
                    opacityValue={0.8}
                    duration={150}
                    style={fabStyles}
                    onPressIn={stopPulse}
                    onPressOut={startPulse}
                    {...props}
                >
                    {icon}

                    {badge && (
                        <View style={[
                            styles.badge,
                            { backgroundColor: badgeColor || theme.danger }
                        ]}>
                            <Text style={[styles.badgeText, { color: theme.onPrimary }]}>
                                {badge}
                            </Text>
                        </View>
                    )}
                </SmoothButton>
            </Animated.View>
        </View>
    );
}

// Specialized FAB variants
export function AddMealFAB({ onPress, disabled, ...props }) {
    const { theme } = useTheme();

    return (
        <FloatingActionButton
            onPress={onPress}
            disabled={disabled}
            backgroundColor={theme.success}
            icon={
                <Text style={[styles.fabIcon, { color: theme.onPrimary }]}>
                    🍽️
                </Text>
            }
            {...props}
        />
    );
}

export function AddWaterFAB({ onPress, disabled, badge, ...props }) {
    const { theme } = useTheme();

    return (
        <FloatingActionButton
            onPress={onPress}
            disabled={disabled}
            backgroundColor={theme.primary}
            badge={badge}
            icon={
                <Text style={[styles.fabIcon, { color: theme.onPrimary }]}>
                    💧
                </Text>
            }
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    fab: {
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        ...shadows.heavy,
        ...(Platform.OS === 'web' && {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }),
    },
    fabIcon: {
        fontSize: 24,
        lineHeight: 28,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
    },
    badgeText: {
        ...typography.xs,
        fontWeight: '700',
        fontSize: 10,
    },
});