/**
 * Enhanced User Feedback System
 * Toast notifications, alerts, and user feedback components
 */

import React, { createContext, useCallback, useContext, useReducer } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Feedback types
 */
export const FEEDBACK_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    LOADING: 'loading'
};

/**
 * Initial feedback state
 */
const initialState = {
    toasts: [],
    alerts: [],
    notifications: []
};

/**
 * Feedback actions
 */
const FEEDBACK_ACTIONS = {
    ADD_TOAST: 'ADD_TOAST',
    REMOVE_TOAST: 'REMOVE_TOAST',
    ADD_ALERT: 'ADD_ALERT',
    REMOVE_ALERT: 'REMOVE_ALERT',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
    CLEAR_ALL: 'CLEAR_ALL'
};

/**
 * Feedback reducer
 */
const feedbackReducer = (state, action) => {
    switch (action.type) {
        case FEEDBACK_ACTIONS.ADD_TOAST:
            return {
                ...state,
                toasts: [...state.toasts, action.payload]
            };

        case FEEDBACK_ACTIONS.REMOVE_TOAST:
            return {
                ...state,
                toasts: state.toasts.filter(toast => toast.id !== action.payload)
            };

        case FEEDBACK_ACTIONS.ADD_ALERT:
            return {
                ...state,
                alerts: [...state.alerts, action.payload]
            };

        case FEEDBACK_ACTIONS.REMOVE_ALERT:
            return {
                ...state,
                alerts: state.alerts.filter(alert => alert.id !== action.payload)
            };

        case FEEDBACK_ACTIONS.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [...state.notifications, action.payload]
            };

        case FEEDBACK_ACTIONS.REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(notif => notif.id !== action.payload)
            };

        case FEEDBACK_ACTIONS.CLEAR_ALL:
            return initialState;

        default:
            return state;
    }
};

/**
 * Toast component
 */
const Toast = ({ toast, onDismiss }) => {
    const translateY = React.useRef(new Animated.Value(-100)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();

        // Auto dismiss
        if (toast.duration > 0) {
            const timer = setTimeout(() => {
                animateOut();
            }, toast.duration);

            return () => clearTimeout(timer);
        }
    }, []);

    const animateOut = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true
            })
        ]).start(() => {
            onDismiss(toast.id);
        });
    };

    const getToastStyle = () => {
        const baseStyle = styles.toast;
        switch (toast.type) {
            case FEEDBACK_TYPES.SUCCESS:
                return [baseStyle, styles.successToast];
            case FEEDBACK_TYPES.ERROR:
                return [baseStyle, styles.errorToast];
            case FEEDBACK_TYPES.WARNING:
                return [baseStyle, styles.warningToast];
            case FEEDBACK_TYPES.INFO:
                return [baseStyle, styles.infoToast];
            default:
                return baseStyle;
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case FEEDBACK_TYPES.SUCCESS:
                return '✅';
            case FEEDBACK_TYPES.ERROR:
                return '❌';
            case FEEDBACK_TYPES.WARNING:
                return '⚠️';
            case FEEDBACK_TYPES.INFO:
                return 'ℹ️';
            default:
                return '';
        }
    };

    return (
        <Animated.View
            style={[
                getToastStyle(),
                {
                    transform: [{ translateY }],
                    opacity
                }
            ]}
        >
            <TouchableOpacity
                style={styles.toastContent}
                onPress={animateOut}
                activeOpacity={0.9}
            >
                <Text style={styles.toastIcon}>{getIcon()}</Text>
                <View style={styles.toastTextContainer}>
                    {toast.title && (
                        <Text style={styles.toastTitle}>{toast.title}</Text>
                    )}
                    <Text style={styles.toastMessage}>{toast.message}</Text>
                </View>
                {toast.action && (
                    <TouchableOpacity
                        style={styles.toastAction}
                        onPress={toast.action.onPress}
                    >
                        <Text style={styles.toastActionText}>{toast.action.label}</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

/**
 * Alert component
 */
const Alert = ({ alert, onDismiss }) => {
    const scaleValue = React.useRef(new Animated.Value(0.8)).current;
    const opacityValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true
            }),
            Animated.timing(opacityValue, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    }, []);

    const animateOut = (callback) => {
        Animated.parallel([
            Animated.timing(scaleValue, {
                toValue: 0.8,
                duration: 150,
                useNativeDriver: true
            }),
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            })
        ]).start(() => {
            onDismiss(alert.id);
            callback?.();
        });
    };

    const handleAction = (action) => {
        animateOut(() => {
            action.onPress?.();
        });
    };

    return (
        <View style={styles.alertOverlay}>
            <Animated.View
                style={[
                    styles.alertContainer,
                    {
                        transform: [{ scale: scaleValue }],
                        opacity: opacityValue
                    }
                ]}
            >
                {alert.icon && (
                    <Text style={styles.alertIcon}>{alert.icon}</Text>
                )}

                {alert.title && (
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                )}

                <Text style={styles.alertMessage}>{alert.message}</Text>

                <View style={styles.alertActions}>
                    {alert.actions?.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.alertButton,
                                action.style === 'destructive' && styles.destructiveButton,
                                action.style === 'cancel' && styles.cancelButton
                            ]}
                            onPress={() => handleAction(action)}
                        >
                            <Text
                                style={[
                                    styles.alertButtonText,
                                    action.style === 'destructive' && styles.destructiveButtonText,
                                    action.style === 'cancel' && styles.cancelButtonText
                                ]}
                            >
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    )) || (
                            <TouchableOpacity
                                style={styles.alertButton}
                                onPress={() => animateOut()}
                            >
                                <Text style={styles.alertButtonText}>OK</Text>
                            </TouchableOpacity>
                        )}
                </View>
            </Animated.View>
        </View>
    );
};

/**
 * Feedback context
 */
const FeedbackContext = createContext(null);

/**
 * Feedback provider
 */
export const FeedbackProvider = ({ children }) => {
    const [state, dispatch] = useReducer(feedbackReducer, initialState);
    const insets = useSafeAreaInsets();

    /**
     * Show toast notification
     */
    const showToast = useCallback((message, type = FEEDBACK_TYPES.INFO, options = {}) => {
        const toast = {
            id: Date.now() + Math.random(),
            message,
            type,
            title: options.title,
            duration: options.duration ?? 4000,
            action: options.action,
            ...options
        };

        dispatch({ type: FEEDBACK_ACTIONS.ADD_TOAST, payload: toast });

        return toast.id;
    }, []);

    /**
     * Show alert dialog
     */
    const showAlert = useCallback((message, options = {}) => {
        const alert = {
            id: Date.now() + Math.random(),
            message,
            title: options.title,
            icon: options.icon,
            actions: options.actions,
            ...options
        };

        dispatch({ type: FEEDBACK_ACTIONS.ADD_ALERT, payload: alert });

        return alert.id;
    }, []);

    /**
     * Show confirmation dialog
     */
    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            const alert = {
                id: Date.now() + Math.random(),
                message,
                title: options.title || 'Confirm',
                icon: options.icon || '❓',
                actions: [
                    {
                        label: options.cancelLabel || 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false)
                    },
                    {
                        label: options.confirmLabel || 'Confirm',
                        style: options.destructive ? 'destructive' : 'default',
                        onPress: () => resolve(true)
                    }
                ]
            };

            dispatch({ type: FEEDBACK_ACTIONS.ADD_ALERT, payload: alert });
        });
    }, []);

    /**
     * Dismiss toast
     */
    const dismissToast = useCallback((id) => {
        dispatch({ type: FEEDBACK_ACTIONS.REMOVE_TOAST, payload: id });
    }, []);

    /**
     * Dismiss alert
     */
    const dismissAlert = useCallback((id) => {
        dispatch({ type: FEEDBACK_ACTIONS.REMOVE_ALERT, payload: id });
    }, []);

    /**
     * Clear all feedback
     */
    const clearAll = useCallback(() => {
        dispatch({ type: FEEDBACK_ACTIONS.CLEAR_ALL });
    }, []);

    const value = {
        showToast,
        showAlert,
        showConfirm,
        dismissToast,
        dismissAlert,
        clearAll,
        toasts: state.toasts,
        alerts: state.alerts
    };

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            {/* Toast Container */}
            <View
                style={[
                    styles.toastContainer,
                    { top: insets.top + 10 }
                ]}
                pointerEvents="box-none"
            >
                {state.toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onDismiss={dismissToast}
                    />
                ))}
            </View>

            {/* Alert Container */}
            {state.alerts.map((alert) => (
                <Alert
                    key={alert.id}
                    alert={alert}
                    onDismiss={dismissAlert}
                />
            ))}
        </FeedbackContext.Provider>
    );
};

/**
 * Hook to use feedback context
 */
export const useFeedback = () => {
    const context = useContext(FeedbackContext);

    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }

    return context;
};

/**
 * Convenience hooks
 */
export const useToast = () => {
    const { showToast } = useFeedback();

    return {
        success: (message, options) => showToast(message, FEEDBACK_TYPES.SUCCESS, options),
        error: (message, options) => showToast(message, FEEDBACK_TYPES.ERROR, options),
        warning: (message, options) => showToast(message, FEEDBACK_TYPES.WARNING, options),
        info: (message, options) => showToast(message, FEEDBACK_TYPES.INFO, options)
    };
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 1000
    },
    toast: {
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    successToast: {
        backgroundColor: '#4CAF50'
    },
    errorToast: {
        backgroundColor: '#F44336'
    },
    warningToast: {
        backgroundColor: '#FF9800'
    },
    infoToast: {
        backgroundColor: '#2196F3'
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    toastIcon: {
        fontSize: 20,
        marginRight: 12
    },
    toastTextContainer: {
        flex: 1
    },
    toastTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 2
    },
    toastMessage: {
        fontSize: 14,
        color: 'white',
        lineHeight: 18
    },
    toastAction: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 6,
        marginLeft: 12
    },
    toastActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white'
    },
    alertOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
    },
    alertContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginHorizontal: 32,
        maxWidth: screenWidth - 64,
        alignItems: 'center'
    },
    alertIcon: {
        fontSize: 40,
        marginBottom: 16
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8
    },
    alertMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24
    },
    alertActions: {
        flexDirection: 'row',
        gap: 12
    },
    alertButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center'
    },
    alertButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white'
    },
    destructiveButton: {
        backgroundColor: '#FF3B30'
    },
    destructiveButtonText: {
        color: 'white'
    },
    cancelButton: {
        backgroundColor: '#F2F2F7',
        borderWidth: 1,
        borderColor: '#C6C6C8'
    },
    cancelButtonText: {
        color: '#007AFF'
    }
});

export default FeedbackProvider;