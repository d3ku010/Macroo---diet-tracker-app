/**
 * AuthContext Tests
 * Test authentication context functionality
 */

import { act, renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock supabase client
const mockSupabaseClient = {
    auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn(() => ({
            data: { subscription: { unsubscribe: jest.fn() } }
        })),
    },
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                single: jest.fn()
            }))
        })),
        insert: jest.fn(),
        update: jest.fn(() => ({
            eq: jest.fn()
        }))
    }))
};

jest.mock('../utils/supabaseClient', () => ({
    supabase: mockSupabaseClient
}));

// Mock AsyncStorage
const mockAsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock error handler
const mockErrorHandler = {
    handleError: jest.fn(),
    createUserError: jest.fn((message) => new Error(message)),
    showToast: jest.fn(),
};

jest.mock('../utils/errorHandler', () => mockErrorHandler);

// Test wrapper
const createWrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset default mocks
        mockSupabaseClient.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null
        });
        mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null
        });
        mockAsyncStorage.getItem.mockResolvedValue(null);
    });

    describe('Initial State', () => {
        test('should provide initial auth state', () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            expect(result.current.user).toBe(null);
            expect(result.current.session).toBe(null);
            expect(result.current.loading).toBe(true);
            expect(result.current.initialized).toBe(false);
        });

        test('should initialize with existing session', async () => {
            const mockSession = {
                access_token: 'test-token',
                user: { id: 'user-123', email: 'test@example.com' }
            };

            mockSupabaseClient.auth.getSession.mockResolvedValue({
                data: { session: mockSession },
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            // Wait for initialization
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(result.current.session).toEqual(mockSession);
            expect(result.current.user).toEqual(mockSession.user);
            expect(result.current.loading).toBe(false);
            expect(result.current.initialized).toBe(true);
        });
    });

    describe('Sign In', () => {
        test('should sign in successfully', async () => {
            const mockSession = {
                access_token: 'test-token',
                user: { id: 'user-123', email: 'test@example.com' }
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
                data: { session: mockSession, user: mockSession.user },
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('test@example.com', 'password123');
            });

            expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(signInResult.success).toBe(true);
            expect(result.current.user).toEqual(mockSession.user);
            expect(result.current.session).toEqual(mockSession);
            expect(result.current.loading).toBe(false);
        });

        test('should handle sign in error', async () => {
            const authError = { message: 'Invalid credentials' };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
                data: { session: null, user: null },
                error: authError
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('test@example.com', 'wrongpassword');
            });

            expect(signInResult.success).toBe(false);
            expect(signInResult.error).toBe('Invalid credentials');
            expect(result.current.user).toBe(null);
            expect(result.current.session).toBe(null);
            expect(mockErrorHandler.handleError).toHaveBeenCalled();
        });

        test('should validate email format', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('invalid-email', 'password123');
            });

            expect(signInResult.success).toBe(false);
            expect(signInResult.error).toContain('valid email');
            expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
        });

        test('should validate password length', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('test@example.com', '123');
            });

            expect(signInResult.success).toBe(false);
            expect(signInResult.error).toContain('6 characters');
            expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
        });
    });

    describe('Sign Up', () => {
        test('should sign up successfully', async () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };

            mockSupabaseClient.auth.signUp.mockResolvedValue({
                data: { user: mockUser, session: null },
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signUpResult;
            await act(async () => {
                signUpResult = await result.current.signUp('test@example.com', 'password123');
            });

            expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(signUpResult.success).toBe(true);
            expect(signUpResult.requiresConfirmation).toBe(true);
        });

        test('should handle sign up error', async () => {
            const authError = { message: 'Email already registered' };

            mockSupabaseClient.auth.signUp.mockResolvedValue({
                data: { user: null, session: null },
                error: authError
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signUpResult;
            await act(async () => {
                signUpResult = await result.current.signUp('test@example.com', 'password123');
            });

            expect(signUpResult.success).toBe(false);
            expect(signUpResult.error).toBe('Email already registered');
            expect(mockErrorHandler.handleError).toHaveBeenCalled();
        });
    });

    describe('Sign Out', () => {
        test('should sign out successfully', async () => {
            mockSupabaseClient.auth.signOut.mockResolvedValue({
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            // Set initial authenticated state
            act(() => {
                result.current.user = { id: 'user-123', email: 'test@example.com' };
                result.current.session = { access_token: 'test-token' };
            });

            await act(async () => {
                await result.current.signOut();
            });

            expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
            expect(result.current.user).toBe(null);
            expect(result.current.session).toBe(null);
            expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_session');
        });

        test('should handle sign out error', async () => {
            const signOutError = { message: 'Network error' };

            mockSupabaseClient.auth.signOut.mockResolvedValue({
                error: signOutError
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            await act(async () => {
                await result.current.signOut();
            });

            expect(mockErrorHandler.handleError).toHaveBeenCalledWith(signOutError);
        });
    });

    describe('Session Management', () => {
        test('should restore session from storage', async () => {
            const storedSession = JSON.stringify({
                access_token: 'stored-token',
                user: { id: 'user-123', email: 'test@example.com' }
            });

            mockAsyncStorage.getItem.mockResolvedValue(storedSession);
            mockSupabaseClient.auth.getSession.mockResolvedValue({
                data: { session: JSON.parse(storedSession) },
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_session');
            expect(result.current.session.access_token).toBe('stored-token');
            expect(result.current.user.id).toBe('user-123');
        });

        test('should handle auth state changes', async () => {
            let authStateChangeCallback;

            mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
                authStateChangeCallback = callback;
                return {
                    data: { subscription: { unsubscribe: jest.fn() } }
                };
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            // Simulate auth state change
            const newSession = {
                access_token: 'new-token',
                user: { id: 'user-456', email: 'new@example.com' }
            };

            await act(async () => {
                authStateChangeCallback('SIGNED_IN', newSession);
            });

            expect(result.current.session).toEqual(newSession);
            expect(result.current.user).toEqual(newSession.user);
            expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
                'user_session',
                JSON.stringify(newSession)
            );
        });

        test('should handle session expiry', async () => {
            let authStateChangeCallback;

            mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
                authStateChangeCallback = callback;
                return {
                    data: { subscription: { unsubscribe: jest.fn() } }
                };
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            await act(async () => {
                authStateChangeCallback('SIGNED_OUT', null);
            });

            expect(result.current.session).toBe(null);
            expect(result.current.user).toBe(null);
            expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_session');
        });
    });

    describe('Password Reset', () => {
        test('should request password reset', async () => {
            mockSupabaseClient.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
                data: {},
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let resetResult;
            await act(async () => {
                resetResult = await result.current.resetPassword('test@example.com');
            });

            expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                'test@example.com'
            );
            expect(resetResult.success).toBe(true);
        });

        test('should handle password reset error', async () => {
            mockSupabaseClient.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'User not found' }
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let resetResult;
            await act(async () => {
                resetResult = await result.current.resetPassword('test@example.com');
            });

            expect(resetResult.success).toBe(false);
            expect(resetResult.error).toBe('User not found');
        });
    });

    describe('Profile Management', () => {
        test('should update user profile', async () => {
            const mockUpdatedProfile = {
                id: 'user-123',
                email: 'test@example.com',
                full_name: 'Test User'
            };

            mockSupabaseClient.from().update().eq.mockResolvedValue({
                data: [mockUpdatedProfile],
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            // Set initial user
            act(() => {
                result.current.user = { id: 'user-123', email: 'test@example.com' };
            });

            let updateResult;
            await act(async () => {
                updateResult = await result.current.updateProfile({ full_name: 'Test User' });
            });

            expect(updateResult.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors gracefully', async () => {
            mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
                new Error('Network request failed')
            );

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            let signInResult;
            await act(async () => {
                signInResult = await result.current.signIn('test@example.com', 'password123');
            });

            expect(signInResult.success).toBe(false);
            expect(signInResult.error).toContain('network');
            expect(mockErrorHandler.handleError).toHaveBeenCalled();
        });

        test('should clear errors on successful operations', async () => {
            const mockSession = {
                access_token: 'test-token',
                user: { id: 'user-123', email: 'test@example.com' }
            };

            mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
                data: { session: mockSession, user: mockSession.user },
                error: null
            });

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper,
            });

            await act(async () => {
                await result.current.signIn('test@example.com', 'password123');
            });

            expect(result.current.error).toBe(null);
        });
    });
});