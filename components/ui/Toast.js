import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './ThemeProvider';

let showRef = null;

// showToast supports: { message, type, duration, action: { label, onPress } }
export function showToast(messageOrObj, type = 'info', duration = 2500) {
    const payload = typeof messageOrObj === 'string' ? { message: messageOrObj, type, duration } : messageOrObj;
    if (showRef) showRef(payload);
}

export default function ToastHost() {
    const [toast, setToast] = useState(null);
    const anim = useRef(new Animated.Value(0)).current;
    const { theme } = useTheme();

    useEffect(() => {
        showRef = (t) => setToast(t);
        return () => {
            showRef = null;
        };
    }, []);

    useEffect(() => {
        if (!toast) return;
        Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();

        const t = setTimeout(() => {
            Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
        }, toast.duration || 2500);

        return () => clearTimeout(t);
    }, [toast]);

    if (!toast) return null;

    const bg = toast.type === 'success' ? theme.success : toast.type === 'error' ? theme.danger : theme.primary;
    // keep toast text high-contrast; use onPrimary token so both themes show good contrast on primary-like backgrounds
    const textColor = theme.onPrimary || '#fff';
    const actionColor = theme.onPrimary || '#fff';
    // softer shadow that works in both light and dark modes
    const shadowColor = theme.name === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)';

    return (
        <Animated.View
            style={[styles.wrapper, { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }], pointerEvents: 'box-none' }]}
        >
            <View style={[styles.toast, { backgroundColor: bg, shadowColor }]}>
                <Text style={[styles.text, { color: textColor }]}>{toast.message}</Text>
                {toast.action ? (
                    <Text style={[styles.actionText, { color: actionColor }]} onPress={() => { toast.action.onPress && toast.action.onPress(); Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null)); }}>{toast.action.label}</Text>
                ) : null}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 80,
        zIndex: 9999,
    },
    toast: {
        padding: 12,
        borderRadius: 12,
        // leave shadowColor blank; computed at runtime and applied inline
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    text: { fontWeight: '700', textAlign: 'center' },
    // actionText color is provided at render time via actionColor to ensure theme contrast
    actionText: { fontWeight: '900', marginLeft: 12 },
});
