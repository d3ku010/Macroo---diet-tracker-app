import { Ionicons } from '@expo/vector-icons';
import { Animated, Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useTheme } from './ThemeProvider';

export default function PrimaryButton({ title, onPress, style, textStyle, disabled, icon, active = false, activeOpacity = 0.8 }) {
    const { theme } = useTheme();
    const backgroundColor = active ? theme.primary : 'transparent';
    const borderColor = theme.primary;
    const textColor = active ? (theme.onPrimary || '#fff') : theme.primary;
    const iconColor = active ? (theme.onPrimary || '#fff') : theme.primary;
    const scale = new Animated.Value(1);

    const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 7 }).start();
    const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

    return (
        <TouchableWithoutFeedback onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} disabled={disabled}>
            <Animated.View style={[
                styles.btn,
                { backgroundColor, borderColor, borderWidth: active ? 0 : 1, transform: [{ scale }] },
                active ? (Platform.OS === 'web' ? { boxShadow: `0px 6px 12px ${theme.primary}66` } : { shadowColor: theme.primary, shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 }) : null,
                style
            ]}>
                {icon ? <Ionicons name={icon} size={16} color={iconColor} style={{ marginRight: 8 }} /> : null}
                <View>
                    <Text style={[styles.text, textStyle, { color: textColor }]}>{title}</Text>
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    btn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        cursor: Platform.OS === 'web' ? 'pointer' : 'default',
        userSelect: Platform.OS === 'web' ? 'none' : 'auto',
    },
    // don't hardcode color here; textColor is applied inline based on theme
    text: {
        fontWeight: '700',
        userSelect: Platform.OS === 'web' ? 'none' : 'auto',
    },
    disabled: {
        opacity: 0.6,
        cursor: Platform.OS === 'web' ? 'not-allowed' : 'default',
    },
});
