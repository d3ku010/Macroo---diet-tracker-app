import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './ThemeProvider';

export default function Toast({ message, type = 'success', visible, onHide, duration = 3000 }) {
    const { theme } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Show animation
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible, duration]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(() => {
            if (onHide) onHide();
        });
    };

    if (!visible && fadeAnim._value === 0) {
        return null;
    }

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return theme.success;
            case 'error':
                return theme.danger;
            case 'warning':
                return theme.fat;
            case 'info':
                return theme.primary;
            default:
                return theme.success;
        }
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.toast,
                    {
                        backgroundColor: getBackgroundColor(),
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={styles.message}>{message}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
    },
    toast: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 20,
        maxWidth: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    message: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 14,
    },
});