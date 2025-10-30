/**
 * Authentication Context Provider
 * Centralized authentication state management with secure patterns
 */

import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { supabaseService } from '../services/supabaseService';
import { createAuthError, errorHandler } from '../utils/errorHandler';
import { showToast } from '../utils/toast';
import { validateSignIn, validateSignUp } from '../utils/validation';

/**
 * Authentication state
 */
const initialState = {
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    profile: null,
    onboardingComplete: false
};

/**
 * Authentication actions
 */
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_SESSION: 'SET_SESSION',
    SET_USER: 'SET_USER',
    SET_PROFILE: 'SET_PROFILE',
    SIGN_OUT: 'SIGN_OUT',
    UPDATE_ONBOARDING: 'UPDATE_ONBOARDING'
};

/**
 * Authentication reducer
 */
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
                error: action.payload ? null : state.error
            };

        case AUTH_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        case AUTH_ACTIONS.SET_SESSION:
            return {
                ...state,
                session: action.payload,
                user: action.payload?.user || null,
                isAuthenticated: !!action.payload,
                loading: false,
                error: null
            };

        case AUTH_ACTIONS.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: !!action.payload,
                loading: false
            };

        case AUTH_ACTIONS.SET_PROFILE:
            return {
                ...state,
                profile: action.payload,
                onboardingComplete: action.payload?.onboarding_complete || false
            };

        case AUTH_ACTIONS.SIGN_OUT:
            return {
                ...initialState,
                loading: false
            };

        case AUTH_ACTIONS.UPDATE_ONBOARDING:
            return {
                ...state,
                onboardingComplete: action.payload,
                profile: state.profile ? {
                    ...state.profile,
                    onboarding_complete: action.payload
                } : state.profile
            };

        default:
            return state;
    }
};

/**
 * Authentication context
 */
const AuthContext = createContext(null);

/**
 * Authentication provider component
 */
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }, []);

    /**
     * Load user profile
     */
    const loadUserProfile = useCallback(async (userId) => {
        try {
            const profile = await supabaseService.getUserProfile(userId);
            dispatch({ type: AUTH_ACTIONS.SET_PROFILE, payload: profile });
            return profile;
        } catch (error) {
            console.warn('Failed to load user profile:', error);
            // Don't throw - profile is optional on initial load
            return null;
        }
    }, []);

    /**
     * Sign up new user
     */
    const signUp = useCallback(async (userData) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            // Validate input data
            const validationResult = validateSignUp(userData);
            if (!validationResult.isValid) {
                throw createAuthError(
                    `Invalid signup data: ${validationResult.errorMessages.join(', ')}`,
                    'VALIDATION_ERROR'
                );
            }

            const { user, session } = await supabaseService.signUp(
                userData.email,
                userData.password,
                {
                    data: {
                        full_name: userData.fullName || '',
                        display_name: userData.displayName || userData.fullName || ''
                    }
                }
            );

            dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });

            // Create initial profile if user is confirmed
            if (user && !user.email_confirmed_at) {
                showToast('Please check your email to confirm your account', 'info');
            } else if (user) {
                await loadUserProfile(user.id);
            }

            return { user, session };
        } catch (error) {
            const handledError = errorHandler.handleError(error);
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: handledError.message });
            throw handledError;
        }
    }, [loadUserProfile]);

    /**
     * Sign in existing user
     */
    const signIn = useCallback(async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            // Validate input data
            const validationResult = validateSignIn(credentials);
            if (!validationResult.isValid) {
                throw createAuthError(
                    `Invalid login credentials: ${validationResult.errorMessages.join(', ')}`,
                    'VALIDATION_ERROR'
                );
            }

            const { user, session } = await supabaseService.signIn(
                credentials.email,
                credentials.password
            );

            dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });

            // Load user profile
            if (user) {
                await loadUserProfile(user.id);
            }

            return { user, session };
        } catch (error) {
            const handledError = errorHandler.handleError(error);
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: handledError.message });
            throw handledError;
        }
    }, [loadUserProfile]);

    /**
     * Sign out user
     */
    const signOut = useCallback(async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        try {
            await supabaseService.signOut();
            dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
        } catch (error) {
            const handledError = errorHandler.handleError(error);
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: handledError.message });
            throw handledError;
        }
    }, []);

    /**
     * Reset password
     */
    const resetPassword = useCallback(async (email) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            await supabaseService.resetPassword(email);
            showToast('Password reset email sent', 'success');
        } catch (error) {
            const handledError = errorHandler.handleError(error);
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: handledError.message });
            throw handledError;
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    /**
     * Update password
     */
    const updatePassword = useCallback(async (newPassword) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            await supabaseService.updatePassword(newPassword);
            showToast('Password updated successfully', 'success');
        } catch (error) {
            const handledError = errorHandler.handleError(error);
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: handledError.message });
            throw handledError;
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, []);

    /**
     * Update user profile
     */
    const updateProfile = useCallback(async (profileData) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

        try {
            const updatedProfile = await supabaseService.updateUserProfile(
                state.user.id,
                profileData
            );
            dispatch({ type: AUTH_ACTIONS.SET_PROFILE, payload: updatedProfile });
            showToast('Profile updated successfully', 'success');
            return updatedProfile;
        } catch (error) {
            const handledError = errorHandler.handleError(error);
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: handledError.message });
            throw handledError;
        } finally {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
    }, [state.user]);

    /**
     * Complete onboarding
     */
    const completeOnboarding = useCallback(async () => {
        try {
            await updateProfile({ onboarding_complete: true });
            dispatch({ type: AUTH_ACTIONS.UPDATE_ONBOARDING, payload: true });
        } catch (error) {
            throw errorHandler.handleError(error);
        }
    }, [updateProfile]);

    /**
     * Refresh session
     */
    const refreshSession = useCallback(async () => {
        try {
            const { session } = await supabaseService.refreshSession();
            dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });
            return session;
        } catch (error) {
            console.warn('Failed to refresh session:', error);
            dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
            return null;
        }
    }, []);

    /**
     * Initialize authentication state
     */
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { session } = await supabaseService.getSession();

                if (mounted) {
                    if (session?.user) {
                        dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });
                        await loadUserProfile(session.user.id);
                    } else {
                        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                    }
                }
            } catch (error) {
                console.warn('Failed to initialize auth:', error);
                if (mounted) {
                    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabaseService.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                console.log('Auth state changed:', event, session?.user?.id);

                switch (event) {
                    case 'SIGNED_IN':
                        dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });
                        if (session?.user) {
                            await loadUserProfile(session.user.id);
                        }
                        break;

                    case 'SIGNED_OUT':
                        dispatch({ type: AUTH_ACTIONS.SIGN_OUT });
                        break;

                    case 'TOKEN_REFRESHED':
                        dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });
                        break;

                    case 'USER_UPDATED':
                        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: session?.user || null });
                        break;

                    default:
                        // Handle other events as needed
                        break;
                }
            }
        );

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, [loadUserProfile]);

    /**
     * Context value
     */
    const value = {
        // State
        ...state,

        // Actions
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        completeOnboarding,
        refreshSession,
        clearError,

        // Computed values
        isLoading: state.loading,
        hasError: !!state.error,
        needsOnboarding: state.isAuthenticated && !state.onboardingComplete
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

/**
 * Higher-order component for protected routes
 */
export const withAuth = (Component) => {
    return (props) => {
        const { isAuthenticated, loading } = useAuth();

        if (loading) {
            return null; // or loading component
        }

        if (!isAuthenticated) {
            return null; // or redirect to login
        }

        return <Component {...props} />;
    };
};

export default AuthProvider;