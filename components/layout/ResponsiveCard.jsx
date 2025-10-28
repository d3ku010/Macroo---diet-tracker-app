import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { borderRadius, cardDimensions, shadows, spacing, typography } from '../../utils/responsive';
import { useTheme } from '../ui/ThemeProvider';

export default function ResponsiveCard({
    children,
    title,
    subtitle,
    size = 'medium', // 'small', 'medium', 'large'
    onPress,
    style,
    contentStyle,
    showShadow = true,
    disabled = false,
}) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        // If theme context is not available, use default values
        theme = null;
    }

    // Default theme fallback
    const safeTheme = theme || {
        card: '#FFFFFF',
        border: '#E5E7EB',
        text: '#1F2937',
        subText: '#6B7280',
        colors: {
            surface: '#FFFFFF',
            border: '#E5E7EB'
        }
    };

    const styles = createStyles(safeTheme, size, showShadow);

    const CardComponent = onPress ? TouchableOpacity : View;

    return (
        <CardComponent
            style={[styles.card, style]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={onPress ? 0.8 : 1}
        >
            {(title || subtitle) && (
                <View style={styles.header}>
                    {title && (
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    )}
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={2}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            )}
            <View style={[styles.content, contentStyle]}>
                {children}
            </View>
        </CardComponent>
    );
}

// Specialized card components
export function StatsCard({ value, label, icon, color, onPress, style }) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        theme = null;
    }

    const safeTheme = theme || {
        card: '#FFFFFF',
        border: '#E5E7EB',
        text: '#1F2937',
        subText: '#6B7280',
        colors: {
            surface: '#FFFFFF',
            border: '#E5E7EB',
            text: '#1F2937',
            textSecondary: '#6B7280'
        }
    };

    const styles = createStatsStyles(safeTheme, color);

    return (
        <ResponsiveCard
            size="small"
            onPress={onPress}
            style={[styles.statsCard, style]}
        >
            <View style={styles.statsContent}>
                {icon && (
                    <View style={styles.iconContainer}>
                        {icon}
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text style={styles.value} numberOfLines={1}>
                        {value}
                    </Text>
                    <Text style={styles.label} numberOfLines={1}>
                        {label}
                    </Text>
                </View>
            </View>
        </ResponsiveCard>
    );
}

export function ActionCard({ icon, title, description, onPress, style, disabled = false }) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        theme = null;
    }

    const safeTheme = theme || {
        card: '#FFFFFF',
        text: '#1F2937',
        subText: '#6B7280',
        primaryLight: '#DBEAFE',
        textMuted: '#9CA3AF',
        colors: {
            surface: '#FFFFFF',
            text: '#1F2937',
            textSecondary: '#6B7280',
            primaryLight: '#DBEAFE',
            textDisabled: '#9CA3AF'
        }
    };

    const styles = createActionStyles(safeTheme);

    return (
        <ResponsiveCard
            size="medium"
            onPress={onPress}
            style={[styles.actionCard, disabled && styles.disabledCard, style]}
            disabled={disabled}
        >
            <View style={styles.actionContent}>
                {icon && (
                    <View style={styles.actionIcon}>
                        {icon}
                    </View>
                )}
                <View style={styles.actionText}>
                    <Text style={[styles.actionTitle, disabled && styles.disabledText]}>
                        {title}
                    </Text>
                    {description && (
                        <Text style={[styles.actionDescription, disabled && styles.disabledText]}>
                            {description}
                        </Text>
                    )}
                </View>
            </View>
        </ResponsiveCard>
    );
}

const createStyles = (theme, size, showShadow) => StyleSheet.create({
    card: {
        backgroundColor: theme.card || theme.colors?.surface || '#FFFFFF',
        borderRadius: borderRadius.md,
        ...cardDimensions[size],
        ...(showShadow ? shadows.medium : {}),
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: theme.border || theme.colors?.border || '#E5E7EB',
        overflow: 'hidden',
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    title: {
        ...typography.lg,
        fontWeight: '600',
        color: theme.text || theme.colors?.text || '#1F2937',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.sm,
        color: theme.subText || theme.colors?.textSecondary || '#6B7280',
        lineHeight: typography.sm.lineHeight * 1.2,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
});

const createStatsStyles = (theme, color) => StyleSheet.create({
    statsCard: {
        backgroundColor: color ? `${color}10` : (theme.card || theme.colors?.surface || '#FFFFFF'),
        borderColor: color || (theme.border || theme.colors?.border || '#E5E7EB'),
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconContainer: {
        marginRight: spacing.sm,
    },
    textContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    value: {
        ...typography.xl,
        fontWeight: '700',
        color: color || (theme.text || theme.colors?.text || '#1F2937'),
    },
    label: {
        ...typography.xs,
        color: theme.subText || theme.colors?.textSecondary || '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },
});

const createActionStyles = (theme) => StyleSheet.create({
    actionCard: {
        backgroundColor: theme.card || theme.colors?.surface || '#FFFFFF',
    },
    disabledCard: {
        opacity: 0.6,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginRight: spacing.md,
        width: 40,
        height: 40,
        borderRadius: borderRadius.sm,
        backgroundColor: theme.primaryLight || theme.colors?.primaryLight || '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        ...typography.md,
        fontWeight: '600',
        color: theme.text || theme.colors?.text || '#1F2937',
        marginBottom: spacing.xs,
    },
    actionDescription: {
        ...typography.sm,
        color: theme.subText || theme.colors?.textSecondary || '#6B7280',
        lineHeight: typography.sm.lineHeight * 1.3,
    },
    disabledText: {
        color: theme.textMuted || theme.colors?.textDisabled || '#9CA3AF',
    },
});