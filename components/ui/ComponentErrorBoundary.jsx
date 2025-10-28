import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorBoundary from './ErrorBoundary';
import { useTheme } from './ThemeProvider';

// Lightweight error boundary for individual components
export const ComponentErrorBoundary = ({ children, componentName = 'Component', fallback }) => {
    return (
        <ErrorBoundary
            showDetails={__DEV__}
            fallbackComponent={fallback || ((props) => (
                <ComponentErrorFallback
                    {...props}
                    componentName={componentName}
                />
            ))}
        >
            {children}
        </ErrorBoundary>
    );
};

const ComponentErrorFallback = ({ error, onRetry, componentName }) => {
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
        card: '#F8F9FA',
        text: '#1F2937',
        subText: '#6B7280',
        danger: '#DC2626',
        primary: '#3B82F6'
    };

    return (
        <View style={[styles.componentError, { backgroundColor: safeTheme.card, borderColor: safeTheme.danger }]}>
            <View style={styles.errorHeader}>
                <Ionicons name="alert-circle" size={16} color={safeTheme.danger} />
                <Text style={[styles.errorTitle, { color: safeTheme.danger }]}>
                    {componentName} Error
                </Text>
            </View>

            <Text style={[styles.errorMessage, { color: safeTheme.subText }]}>
                This component failed to load
            </Text>

            {__DEV__ && error && (
                <Text style={[styles.devError, { color: safeTheme.subText }]}>
                    {error.message}
                </Text>
            )}

            <TouchableOpacity
                style={[styles.retryButton, { borderColor: safeTheme.primary }]}
                onPress={onRetry}
            >
                <Ionicons name="refresh" size={12} color={safeTheme.primary} />
                <Text style={[styles.retryText, { color: safeTheme.primary }]}>
                    Retry
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    componentError: {
        padding: 16,
        margin: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    errorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    errorMessage: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 8,
    },
    devError: {
        fontSize: 10,
        fontFamily: 'monospace',
        textAlign: 'center',
        marginBottom: 8,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
    },
    retryText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
});

export default ComponentErrorBoundary;