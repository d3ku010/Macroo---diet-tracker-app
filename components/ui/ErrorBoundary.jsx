import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from './ThemeProvider';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            errorId: Date.now().toString()
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('Error Boundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // You can also log the error to an error reporting service here
        this.logErrorToService(error, errorInfo);
    }

    logErrorToService = (error, errorInfo) => {
        try {
            // In a real app, you would send this to your error reporting service
            const errorData = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                errorId: this.state.errorId,
                userAgent: navigator?.userAgent || 'Unknown',
                url: window?.location?.href || 'React Native App'
            };

            console.warn('Error logged:', errorData);

            // Example: Send to error service
            // errorReportingService.captureException(error, {
            //     extra: errorData
            // });
        } catch (loggingError) {
            console.error('Failed to log error:', loggingError);
        }
    };

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <ErrorBoundaryFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    errorId={this.state.errorId}
                    onRetry={this.handleRetry}
                    showDetails={this.props.showDetails}
                    fallbackComponent={this.props.fallbackComponent}
                />
            );
        }

        return this.props.children;
    }
}

// Functional component for the error UI (uses hooks)
const ErrorBoundaryFallback = ({
    error,
    errorInfo,
    errorId,
    onRetry,
    showDetails = __DEV__,
    fallbackComponent
}) => {
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
        background: '#FFFFFF',
        card: '#F8F9FA',
        text: '#1F2937',
        subText: '#6B7280',
        danger: '#DC2626',
        primary: '#3B82F6'
    };

    if (fallbackComponent) {
        return fallbackComponent({ error, errorInfo, onRetry });
    }

    return (
        <View style={[styles.container, { backgroundColor: safeTheme.background }]}>
            <View style={[styles.errorCard, { backgroundColor: safeTheme.card }]}>
                <View style={styles.iconContainer}>
                    <Ionicons name="warning" size={48} color={safeTheme.danger} />
                </View>

                <Text style={[styles.title, { color: safeTheme.text }]}>
                    Oops! Something went wrong
                </Text>

                <Text style={[styles.message, { color: safeTheme.subText }]}>
                    We encountered an unexpected error. Don't worry, your data is safe.
                </Text>

                {errorId && (
                    <Text style={[styles.errorId, { color: safeTheme.subText }]}>
                        Error ID: {errorId}
                    </Text>
                )}

                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: safeTheme.primary }]}
                    onPress={onRetry}
                >
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text style={[styles.retryText, { color: "#FFFFFF" }]}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                {showDetails && error && (
                    <View style={[styles.detailsContainer, { backgroundColor: safeTheme.muted || '#F3F4F6' }]}>
                        <Text style={[styles.detailsTitle, { color: safeTheme.text }]}>
                            Error Details (Dev Mode):
                        </Text>
                        <Text style={[styles.errorText, { color: safeTheme.danger }]}>
                            {error.message}
                        </Text>
                        {error.stack && (
                            <Text style={[styles.stackTrace, { color: safeTheme.subText }]}>
                                {error.stack.substring(0, 500)}
                                {error.stack.length > 500 ? '...' : ''}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 8,
    },
    errorId: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'monospace',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    detailsContainer: {
        padding: 16,
        borderRadius: 8,
        width: '100%',
        marginTop: 8,
    },
    detailsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 8,
    },
    stackTrace: {
        fontSize: 10,
        fontFamily: 'monospace',
        lineHeight: 14,
    },
});

export default ErrorBoundary;