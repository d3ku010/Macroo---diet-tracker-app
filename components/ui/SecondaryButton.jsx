import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';
import SmoothButton from './SmoothButton';
import { useTheme } from './ThemeProvider';

export default function SecondaryButton({ title, onPress, style, icon, textStyle, disabled, active = false, activeOpacity = 0.8 }) {
    const { theme } = useTheme();

    return (
        <SmoothButton
            onPress={onPress}
            disabled={disabled}
            animationType="both"
            scaleValue={0.96}
            opacityValue={0.85}
            duration={120}
            style={[
                styles.btn,
                { borderColor: theme.primary, backgroundColor: active ? theme.primary : 'transparent' },
                active ? (Platform.OS === 'web' ? { boxShadow: `0px 5px 10px ${theme.primary}88` } : { shadowColor: theme.primary, shadowOpacity: 0.85, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 }) : null,
                disabled ? styles.disabled : null,
                style
            ]}
        >
            {icon ? <Ionicons name={icon} size={16} color={active ? (theme.onPrimary || '#fff') : theme.primary} style={{ marginRight: 8 }} /> : null}
            <View>
                <Text style={[styles.text, { color: active ? (theme.onPrimary || '#fff') : theme.primary }, textStyle]}>{title}</Text>
            </View>
        </SmoothButton>
    );
}

const styles = StyleSheet.create({
    btn: {
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        cursor: Platform.OS === 'web' ? 'pointer' : 'default',
        userSelect: Platform.OS === 'web' ? 'none' : 'auto',
    },
    text: {
        fontWeight: '700',
        userSelect: Platform.OS === 'web' ? 'none' : 'auto',
    },
    disabled: {
        opacity: 0.6,
        cursor: Platform.OS === 'web' ? 'not-allowed' : 'default',
    },
});
