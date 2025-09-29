import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

let showRef = null;

export function showToast(message, type = 'info', duration = 2500) {
    if (showRef) showRef({ message, type, duration });
}

export default function ToastHost() {
    const [toast, setToast] = useState(null);
    const anim = useRef(new Animated.Value(0)).current;

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

    const bg = toast.type === 'success' ? '#34d399' : toast.type === 'error' ? '#fb7185' : '#60a5fa';

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[styles.wrapper, { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}
        >
            <TouchableWithoutFeedback onPress={() => { Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null)); }}>
                <View style={[styles.toast, { backgroundColor: bg }]}>
                    <Text style={styles.text}>{toast.message}</Text>
                </View>
            </TouchableWithoutFeedback>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 24,
        zIndex: 9999,
    },
    toast: {
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 6,
    },
    text: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
