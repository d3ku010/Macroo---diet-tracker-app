import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from './ThemeProvider';

export default function SegmentedControl({ options = [], value, onChange, style }) {
    const { theme } = useTheme();
    const [width, setWidth] = useState(0);
    const indicator = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const idx = Math.max(0, options.findIndex(o => o.key === value));
        if (width && options.length) {
            Animated.spring(indicator, { toValue: idx * (width / options.length), useNativeDriver: true, friction: 10 }).start();
        }
    }, [value, width, options.length, indicator]);

    return (
        <View style={[styles.wrap, { backgroundColor: theme.pillBg }, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {width > 0 && options.length ? (
                <Animated.View style={[styles.indicator, { width: width / options.length - 6, backgroundColor: theme.primary, transform: [{ translateX: indicator }], top: 3, left: 3 }]} />
            ) : null}
            {options.map((opt, i) => {
                const active = opt.key === value;
                return (
                    <TouchableOpacity key={opt.key} onPress={() => onChange(opt.key)} style={styles.item} activeOpacity={0.8}>
                        <Text style={[styles.label, { color: active ? (theme.onPrimary || '#fff') : theme.text, fontWeight: active ? '800' : '700' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        borderRadius: 12,
        padding: 3,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
    },
    indicator: {
        position: 'absolute',
        height: '100%',
        borderRadius: 10,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    label: { fontSize: 13 }
});
