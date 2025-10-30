/**
 * Global Error Boundary
 * Top-level error boundary with crash reporting and recovery
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createUserError, errorHandler } from '../utils/errorHandler';
import { showToast } from '../utils/toast';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state to show the fallback UI
        return {
            hasError: true,
            error,
            errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Global Error Boundary caught an error:', error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo,
            retryCount: this.state.retryCount + 1
        });

        // Record crash in app store
        if (this.props.recordCrash) {
            this.props.recordCrash({
                error: error.toString(),
                errorInfo,
                component: errorInfo.componentStack,
                errorId: this.state.errorId,
                retryCount: this.state.retryCount,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        }

        // Handle error through our error system
        try {
            const handledError = errorHandler.handleError(error, {
                level: 'fatal',
                context: {
                    component: 'GlobalErrorBoundary',
                    errorInfo,
                    errorId: this.state.errorId,
                    retryCount: this.state.retryCount
                }
            });

            // Log to console for development
            if (__DEV__) {
                console.group('🚨 Global Error Boundary');
                console.error('Error:', error);
                console.error('Error Info:', errorInfo);
                console.error('Handled Error:', handledError);
                console.groupEnd();
            }
        } catch (handlingError) {
            console.error('Failed to handle error:', handlingError);
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null
        });

        showToast('Retrying...', 'info');
    };

    handleReload = () => {
        // In a React Native app, you might want to restart the app
        // For now, we'll clear the error state and hope for the best
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
            retryCount: 0
        });

        // Could also trigger a full app reload or navigation reset
        if (this.props.onReload) {
            this.props.onReload();
        }

        showToast('Reloading app...', 'info');
    };

    handleReportError = () => {
        const { error, errorInfo, errorId } = this.state;

        try {
            // Create user-friendly error report
            const errorReport = {
                errorId,
                message: error?.message || 'Unknown error',
                stack: error?.stack,
                componentStack: errorInfo?.componentStack,
                timestamp: new Date().toISOString(),
                retryCount: this.state.retryCount
            };

            // Here you would send to your error reporting service
            console.log('Error Report:', errorReport);

            showToast('Error reported. Thank you!', 'success');
        } catch (reportError) {
            console.error('Failed to report error:', reportError);
            showToast('Failed to report error', 'error');
        }
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, errorId, retryCount } = this.state;
            const isRecoverable = retryCount < 3;

            return (
                <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                    <View style={styles.errorContainer}>
                        {/* Error Icon */}
                        <View style={styles.iconContainer}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                        </View>

                        {/* Error Title */}
                        <Text style={styles.title}>
                            Oops! Something went wrong
                        </Text>

                        {/* Error Description */}
                        <Text style={styles.description}>
                            {isRecoverable
                                ? "Don't worry, this happens sometimes. You can try again or reload the app."
                                : "The app has encountered multiple errors. Please restart the app or contact support."
                            }
                        </Text>

                        {/* Error ID */}
                        {errorId && (
                            <Text style={styles.errorId}>
                                Error ID: {errorId}
                            </Text>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            {isRecoverable && (
                                <TouchableOpacity
                                    style={[styles.button, styles.primaryButton]}
                                    onPress={this.handleRetry}
                                >
                                    <Text style={styles.primaryButtonText}>Try Again</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={this.handleReload}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    {isRecoverable ? 'Reload App' : 'Restart App'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.tertiaryButton]}
                                onPress={this.handleReportError}
                            >
                                <Text style={styles.tertiaryButtonText}>Report Error</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Development Error Details */}
                        {__DEV__ && error && (
                            <View style={styles.devContainer}>
                                <Text style={styles.devTitle}>Development Info:</Text>
                                <Text style={styles.devText}>{error.toString()}</Text>
                                {errorInfo?.componentStack && (
                                    <Text style={styles.devText}>{errorInfo.componentStack}</Text>
                                )}
                            </View>
                        )}
                    </View>
                </ScrollView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5'
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    errorContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    iconContainer: {
        marginBottom: 16
    },
    errorIcon: {
        fontSize: 64,
        textAlign: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16
    },
    errorId: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'monospace',
        marginBottom: 24,
        textAlign: 'center'
    },
    buttonContainer: {
        width: '100%',
        gap: 12
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center'
    },
    primaryButton: {
        backgroundColor: '#007AFF'
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600'
    },
    secondaryButton: {
        backgroundColor: '#F2F2F7',
        borderWidth: 1,
        borderColor: '#C6C6C8'
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600'
    },
    tertiaryButton: {
        backgroundColor: 'transparent'
    },
    tertiaryButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500'
    },
    devContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        width: '100%'
    },
    devTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    devText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
        lineHeight: 16
    }
});

/**
 * HOC to wrap components with error boundary
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
    const WrappedComponent = (props) => (
        <GlobalErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </GlobalErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
};

/**
 * Hook to use error boundary context
 */
export const useErrorBoundary = () => {
    const [error, setError] = React.useState(null);

    const captureError = React.useCallback((error, errorInfo = {}) => {
        console.error('Manual error capture:', error);

        // Handle the error through our error system
        try {
            const handledError = errorHandler.handleError(error, {
                level: 'error',
                context: {
                    component: 'useErrorBoundary',
                    manual: true,
                    ...errorInfo
                }
            });

            setError(handledError);
        } catch (handlingError) {
            console.error('Failed to handle captured error:', handlingError);
            setError(createUserError('An unexpected error occurred', 'UNKNOWN_ERROR'));
        }
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    // Throw error to be caught by error boundary
    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return {
        captureError,
        clearError,
        hasError: !!error
    };
};

export default GlobalErrorBoundary;