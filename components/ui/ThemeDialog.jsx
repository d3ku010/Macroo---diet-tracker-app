import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { borderRadius, shadows, spacing, typography } from '../../utils/responsive';
import { useTheme } from './ThemeProvider';

export default function ThemeDialog({ visible, onClose }) {
    const { theme, toggle, paletteName, setPalette, palettesList } = useTheme();

    const paletteDescriptions = {
        cyber: { emoji: '🌟', desc: 'Futuristic purple & pink' },
        vapor: { emoji: '💜', desc: 'Dreamy pink & purple' },
        solar: { emoji: '🌅', desc: 'Warm orange & yellow' },
        modern: { emoji: '🔷', desc: 'Clean blue & purple' }
    };

    const handlePaletteSelect = (palette) => {
        setPalette(palette);
    };

    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, scaleAnim, fadeAnim]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View style={[
                            styles.dialog,
                            { backgroundColor: theme.card, borderColor: theme.border },
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            }
                        ]}>
                            {/* Header */}
                            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.title, { color: theme.text }]}>
                                    Theme Settings
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={theme.subText} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.content} bounces={false}>
                                {/* Light/Dark Mode Toggle */}
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        Appearance
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.modeToggle, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
                                        onPress={toggle}
                                    >
                                        <View style={styles.modeOption}>
                                            <Ionicons
                                                name={theme.name === 'dark' ? 'moon' : 'sunny'}
                                                size={20}
                                                color={theme.primary}
                                            />
                                            <Text style={[styles.modeText, { color: theme.primary }]}>
                                                {theme.name === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                            </Text>
                                        </View>
                                        <View style={[styles.toggleIndicator, { backgroundColor: theme.primary }]}>
                                            <Text style={[styles.toggleText, { color: theme.onPrimary }]}>
                                                Switch to {theme.name === 'dark' ? 'Light' : 'Dark'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Color Schemes */}
                                <View style={styles.section}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                        Color Schemes
                                    </Text>
                                    <Text style={[styles.sectionSubtitle, { color: theme.subText }]}>
                                        Choose your preferred color palette
                                    </Text>

                                    {palettesList.map((palette) => {
                                        const isSelected = palette === paletteName;
                                        const info = paletteDescriptions[palette] || { emoji: '🎨', desc: 'Custom colors' };

                                        return (
                                            <TouchableOpacity
                                                key={palette}
                                                style={[
                                                    styles.paletteOption,
                                                    {
                                                        backgroundColor: isSelected ? theme.primaryLight : 'transparent',
                                                        borderColor: isSelected ? theme.primary : theme.border
                                                    }
                                                ]}
                                                onPress={() => handlePaletteSelect(palette)}
                                            >
                                                <View style={styles.paletteInfo}>
                                                    <Text style={styles.paletteEmoji}>{info.emoji}</Text>
                                                    <View style={styles.paletteDetails}>
                                                        <Text style={[
                                                            styles.paletteName,
                                                            { color: isSelected ? theme.primary : theme.text }
                                                        ]}>
                                                            {palette.charAt(0).toUpperCase() + palette.slice(1)}
                                                        </Text>
                                                        <Text style={[
                                                            styles.paletteDesc,
                                                            { color: isSelected ? theme.primary : theme.subText }
                                                        ]}>
                                                            {info.desc}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons
                                                    name={isSelected ? "checkmark-circle" : "radio-button-off-outline"}
                                                    size={24}
                                                    color={isSelected ? theme.primary : theme.subText}
                                                />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    dialog: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        ...shadows.heavy,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },
    title: {
        ...typography.xl,
        fontWeight: '600',
    },
    closeButton: {
        padding: spacing.xs,
        borderRadius: borderRadius.round,
    },
    content: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.lg,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    sectionSubtitle: {
        ...typography.sm,
        marginBottom: spacing.md,
    },
    modeToggle: {
        borderRadius: borderRadius.md,
        borderWidth: 2,
        overflow: 'hidden',
    },
    modeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    modeText: {
        ...typography.md,
        fontWeight: '500',
        marginLeft: spacing.sm,
    },
    toggleIndicator: {
        padding: spacing.sm,
        alignItems: 'center',
    },
    toggleText: {
        ...typography.sm,
        fontWeight: '500',
    },
    paletteOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginBottom: spacing.sm,
    },
    paletteInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    paletteEmoji: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    paletteDetails: {
        flex: 1,
    },
    paletteName: {
        ...typography.md,
        fontWeight: '500',
    },
    paletteDesc: {
        ...typography.sm,
        marginTop: 2,
    },
});