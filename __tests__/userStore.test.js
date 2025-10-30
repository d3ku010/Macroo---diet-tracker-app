/**
 * User Store Tests
 * Test Zustand user store functionality
 */

import { act, renderHook } from '@testing-library/react-native';
import { useUserStore } from '../stores/userStore';

// Mock AsyncStorage
const mockAsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock supabase service
const mockSupabaseService = {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    getUserAchievements: jest.fn(),
    createAchievement: jest.fn(),
};

jest.mock('../services/supabaseService', () => ({
    supabaseService: mockSupabaseService
}));

describe('UserStore', () => {
    beforeEach(() => {
        // Reset store state
        useUserStore.getState().reset();
        jest.clearAllMocks();
    });

    describe('Initial State', () => {
        test('should have correct initial state', () => {
            const { result } = renderHook(() => useUserStore());

            expect(result.current.profile).toBe(null);
            expect(result.current.preferences.units).toBe('metric');
            expect(result.current.preferences.theme).toBe('system');
            expect(result.current.goals.dailyCalories).toBe(2000);
            expect(result.current.achievements).toEqual([]);
            expect(result.current.loading.profile).toBe(false);
        });
    });

    describe('Profile Management', () => {
        test('should load user profile', async () => {
            const mockProfile = {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                age: 30,
                height: 175,
                weight: 70
            };

            mockSupabaseService.getUserProfile.mockResolvedValue(mockProfile);

            const { result } = renderHook(() => useUserStore());

            await act(async () => {
                await result.current.loadProfile('user-123');
            });

            expect(mockSupabaseService.getUserProfile).toHaveBeenCalledWith('user-123');
            expect(result.current.profile).toEqual(mockProfile);
            expect(result.current.loading.profile).toBe(false);
            expect(result.current.errors.profile).toBe(null);
        });

        test('should handle profile loading error', async () => {
            const error = new Error('Profile not found');
            mockSupabaseService.getUserProfile.mockRejectedValue(error);

            const { result } = renderHook(() => useUserStore());

            await act(async () => {
                try {
                    await result.current.loadProfile('user-123');
                } catch (err) {
                    // Expected to throw
                }
            });

            expect(result.current.profile).toBe(null);
            expect(result.current.loading.profile).toBe(false);
            expect(result.current.errors.profile).toBeTruthy();
        });

        test('should update user profile', async () => {
            const initialProfile = { id: 'user-123', name: 'Test User' };
            const updatedData = { name: 'Updated User', age: 31 };
            const updatedProfile = { ...initialProfile, ...updatedData };

            mockSupabaseService.updateUserProfile.mockResolvedValue(updatedProfile);

            const { result } = renderHook(() => useUserStore());

            // Set initial profile
            act(() => {
                result.current.profile = initialProfile;
            });

            await act(async () => {
                await result.current.updateProfile(updatedData);
            });

            expect(mockSupabaseService.updateUserProfile).toHaveBeenCalledWith('user-123', updatedData);
            expect(result.current.profile.name).toBe('Updated User');
            expect(result.current.profile.age).toBe(31);
        });
    });

    describe('Preferences Management', () => {
        test('should update preferences', async () => {
            const mockProfile = { id: 'user-123' };
            const newPreferences = {
                units: 'imperial',
                theme: 'dark',
                notifications: { reminders: false }
            };

            mockSupabaseService.updateUserProfile.mockResolvedValue({});

            const { result } = renderHook(() => useUserStore());

            // Set initial profile
            act(() => {
                result.current.profile = mockProfile;
            });

            await act(async () => {
                await result.current.updatePreferences(newPreferences);
            });

            expect(result.current.preferences.units).toBe('imperial');
            expect(result.current.preferences.theme).toBe('dark');
            expect(result.current.preferences.notifications.reminders).toBe(false);
        });

        test('should merge preferences correctly', async () => {
            const mockProfile = { id: 'user-123' };
            mockSupabaseService.updateUserProfile.mockResolvedValue({});

            const { result } = renderHook(() => useUserStore());

            // Set initial profile
            act(() => {
                result.current.profile = mockProfile;
            });

            // Update only theme, other preferences should remain
            await act(async () => {
                await result.current.updatePreferences({ theme: 'light' });
            });

            expect(result.current.preferences.theme).toBe('light');
            expect(result.current.preferences.units).toBe('metric'); // Should remain unchanged
            expect(result.current.preferences.notifications.reminders).toBe(true); // Should remain unchanged
        });
    });

    describe('Goals Management', () => {
        test('should update goals', async () => {
            const mockProfile = { id: 'user-123' };
            const newGoals = {
                dailyCalories: 2200,
                protein: 180,
                water: 2500
            };

            mockSupabaseService.updateUserProfile.mockResolvedValue({});

            const { result } = renderHook(() => useUserStore());

            // Set initial profile
            act(() => {
                result.current.profile = mockProfile;
            });

            await act(async () => {
                await result.current.updateGoals(newGoals);
            });

            expect(result.current.goals.dailyCalories).toBe(2200);
            expect(result.current.goals.protein).toBe(180);
            expect(result.current.goals.water).toBe(2500);
        });

        test('should calculate daily calories based on profile', () => {
            const mockProfile = {
                id: 'user-123',
                gender: 'male',
                age: 30,
                height: 175, // cm
                weight: 70, // kg
                activity_level: 'moderate',
                goal: 'maintain'
            };

            const { result } = renderHook(() => useUserStore());

            // Set profile
            act(() => {
                result.current.profile = mockProfile;
            });

            const calculatedCalories = result.current.calculateDailyCalories();

            // Should calculate BMR and apply activity multiplier
            expect(calculatedCalories).toBeGreaterThan(1500);
            expect(calculatedCalories).toBeLessThan(3000);
            expect(typeof calculatedCalories).toBe('number');
        });
    });

    describe('Achievements Management', () => {
        test('should load achievements', async () => {
            const mockAchievements = [
                { id: 'ach-1', title: 'First Meal Logged', earned: true },
                { id: 'ach-2', title: 'Week Streak', earned: false }
            ];

            mockSupabaseService.getUserAchievements.mockResolvedValue(mockAchievements);

            const { result } = renderHook(() => useUserStore());

            // Set profile
            act(() => {
                result.current.profile = { id: 'user-123' };
            });

            await act(async () => {
                await result.current.loadAchievements();
            });

            expect(result.current.achievements).toEqual(mockAchievements);
        });

        test('should add new achievement', async () => {
            const mockProfile = { id: 'user-123' };
            const newAchievement = {
                id: 'ach-new',
                title: 'New Achievement',
                earned: true
            };

            mockSupabaseService.createAchievement.mockResolvedValue(newAchievement);

            const { result } = renderHook(() => useUserStore());

            // Set initial state
            act(() => {
                result.current.profile = mockProfile;
                result.current.achievements = [];
            });

            await act(async () => {
                await result.current.addAchievement({ title: 'New Achievement' });
            });

            expect(result.current.achievements).toContain(newAchievement);
        });
    });

    describe('Streak Management', () => {
        test('should update streak data', () => {
            const { result } = renderHook(() => useUserStore());

            const newStreakData = {
                current: 5,
                longest: 10,
                lastLogDate: '2025-10-30'
            };

            act(() => {
                result.current.updateStreak(newStreakData);
            });

            expect(result.current.streaks.current).toBe(5);
            expect(result.current.streaks.longest).toBe(10);
            expect(result.current.streaks.lastLogDate).toBe('2025-10-30');
        });
    });

    describe('Error Handling', () => {
        test('should handle loading states correctly', async () => {
            const { result } = renderHook(() => useUserStore());

            // Test loading state
            act(() => {
                result.current.setLoading('profile', true);
            });

            expect(result.current.loading.profile).toBe(true);
            expect(result.current.errors.profile).toBe(null);

            // Test error state
            act(() => {
                result.current.setError('profile', 'Loading failed');
            });

            expect(result.current.loading.profile).toBe(false);
            expect(result.current.errors.profile).toBe('Loading failed');
        });

        test('should clear errors', () => {
            const { result } = renderHook(() => useUserStore());

            // Set some errors
            act(() => {
                result.current.setError('profile', 'Profile error');
                result.current.setError('goals', 'Goals error');
            });

            expect(result.current.errors.profile).toBe('Profile error');
            expect(result.current.errors.goals).toBe('Goals error');

            // Clear errors
            act(() => {
                result.current.clearErrors();
            });

            expect(result.current.errors.profile).toBe(null);
            expect(result.current.errors.goals).toBe(null);
        });
    });

    describe('Store Reset', () => {
        test('should reset store to initial state', () => {
            const { result } = renderHook(() => useUserStore());

            // Modify state
            act(() => {
                result.current.profile = { id: 'user-123', name: 'Test' };
                result.current.achievements = [{ id: 'ach-1', title: 'Test Achievement' }];
                result.current.setError('profile', 'Some error');
            });

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.profile).toBe(null);
            expect(result.current.achievements).toEqual([]);
            expect(result.current.errors.profile).toBe(null);
            expect(result.current.preferences.units).toBe('metric');
        });
    });
});