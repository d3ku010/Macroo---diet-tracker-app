import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { borderRadius, shadows, spacing, typography } from '../../utils/responsive';
import { useTheme } from '../ui/ThemeProvider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HamburgerMenu({
    visible,
    onClose,
    children,
    title = "Menu",
    width = screenWidth * 0.85
}) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        theme = null;
    }

    const safeTheme = theme || {
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#1F2937',
        subText: '#6B7280',
        border: '#E5E7EB',
        primary: '#3B82F6',
        primaryLight: '#DBEAFE',
        textMuted: '#9CA3AF',
        colors: {
            surface: '#FFFFFF',
            background: '#FFFFFF',
            text: '#1F2937',
            textSecondary: '#6B7280',
            border: '#E5E7EB',
            primary: '#3B82F6',
            primaryLight: '#DBEAFE',
            textDisabled: '#9CA3AF'
        }
    };

    const slideAnim = useRef(new Animated.Value(-width)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Slide out animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -width,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, overlayOpacity, width]);

    const styles = createStyles(safeTheme);

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Overlay */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View
                        style={[
                            styles.overlay,
                            { opacity: overlayOpacity }
                        ]}
                    />
                </TouchableWithoutFeedback>

                {/* Menu Panel */}
                <Animated.View
                    style={[
                        styles.menuPanel,
                        {
                            width: width,
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color={safeTheme.subText || safeTheme.colors?.textSecondary || '#6B7280'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

// Menu Item Component
export function MenuItem({
    icon,
    title,
    subtitle,
    onPress,
    rightContent,
    style,
    disabled = false
}) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        theme = null;
    }

    const safeTheme = theme || {
        text: '#1F2937',
        subText: '#6B7280',
        primary: '#3B82F6',
        textMuted: '#9CA3AF',
        colors: {
            text: '#1F2937',
            textSecondary: '#6B7280',
            primary: '#3B82F6',
            textDisabled: '#9CA3AF'
        }
    };

    const styles = createStyles(safeTheme);

    return (
        <TouchableOpacity
            style={[
                styles.menuItem,
                disabled && styles.menuItemDisabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <View style={styles.menuItemLeft}>
                {icon && (
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={icon}
                            size={20}
                            color={disabled ? (safeTheme.textMuted || safeTheme.colors?.textDisabled || '#9CA3AF') : (safeTheme.primary || safeTheme.colors?.primary || '#3B82F6')}
                        />
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text style={[
                        styles.menuItemTitle,
                        disabled && styles.menuItemTitleDisabled
                    ]}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[
                            styles.menuItemSubtitle,
                            disabled && styles.menuItemSubtitleDisabled
                        ]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            {rightContent && (
                <View style={styles.menuItemRight}>
                    {rightContent}
                </View>
            )}
        </TouchableOpacity>
    );
}

// Menu Section Component
export function MenuSection({ title, children, style }) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        theme = null;
    }

    const safeTheme = theme || {
        subText: '#6B7280',
        colors: {
            textSecondary: '#6B7280'
        }
    };

    const styles = createStyles(safeTheme);

    return (
        <View style={[styles.menuSection, style]}>
            {title && (
                <Text style={styles.sectionTitle}>{title}</Text>
            )}
            {children}
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
    },
    menuPanel: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: screenHeight,
        backgroundColor: theme.card || theme.colors?.surface || '#FFFFFF',
        ...shadows.heavy,
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.border || theme.colors?.border || '#E5E7EB',
        backgroundColor: theme.card || theme.colors?.surface || '#FFFFFF',
    },
    title: {
        ...typography.xl,
        fontWeight: '600',
        color: theme.text || theme.colors?.text || '#1F2937',
    },
    closeButton: {
        padding: spacing.xs,
        borderRadius: borderRadius.round,
        backgroundColor: theme.background || theme.colors?.background || '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingTop: spacing.sm,
    },
    menuSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.sm,
        fontWeight: '600',
        color: theme.subText || theme.colors?.textSecondary || '#6B7280',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: 'transparent',
    },
    menuItemDisabled: {
        opacity: 0.5,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.primaryLight || theme.colors?.primaryLight || '#DBEAFE',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    menuItemTitle: {
        ...typography.md,
        fontWeight: '500',
        color: theme.text || theme.colors?.text || '#1F2937',
    },
    menuItemTitleDisabled: {
        color: theme.textMuted || theme.colors?.textDisabled || '#9CA3AF',
    },
    menuItemSubtitle: {
        ...typography.sm,
        color: theme.subText || theme.colors?.textSecondary || '#6B7280',
        marginTop: 2,
    },
    menuItemSubtitleDisabled: {
        color: theme.textMuted || theme.colors?.textDisabled || '#9CA3AF',
    },
    menuItemRight: {
        marginLeft: spacing.sm,
    },
});