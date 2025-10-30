/**
 * User Store - Zustand
 * Manages user profile, preferences, and settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabaseService } from '../services/supabaseService';
import { errorHandler } from '../utils/errorHandler';
import { validateUserProfile } from '../utils/validation';

/**
 * Initial user state
 */
const initialUserState = {
    // Profile data
    profile: null,
    preferences: {
        units: 'metric', // metric or imperial
        theme: 'system', // light, dark, system
        notifications: {
            reminders: true,
            achievements: true,
            weeklyReports: true
        },
        privacy: {
            shareProgress: false,
            anonymousData: false
        }
    },
    goals: {
        dailyCalories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        water: 2000, // ml
        weight: null, // target weight
        targetDate: null
    },
    achievements: [],
    streaks: {
        current: 0,
        longest: 0,
        lastLogDate: null
    },

    // Loading states
    loading: {
        profile: false,
        preferences: false,
        goals: false,
        achievements: false
    },

    // Error states
    errors: {
        profile: null,
        preferences: null,
        goals: null,
        achievements: null
    }
};

/**
 * User store with Zustand
 */
export const useUserStore = create(
    persist(
        (set, get) => ({
            ...initialUserState,

            /**
             * Clear all errors
             */
            clearErrors: () => {
                set((state) => ({
                    errors: {
                        profile: null,
                        preferences: null,
                        goals: null,
                        achievements: null
                    }
                }));
            },

            /**
             * Set loading state for specific section
             */
            setLoading: (section, isLoading) => {
                set((state) => ({
                    loading: {
                        ...state.loading,
                        [section]: isLoading
                    },
                    errors: {
                        ...state.errors,
                        [section]: isLoading ? null : state.errors[section]
                    }
                }));
            },

            /**
             * Set error for specific section
             */
            setError: (section, error) => {
                set((state) => ({
                    errors: {
                        ...state.errors,
                        [section]: error
                    },
                    loading: {
                        ...state.loading,
                        [section]: false
                    }
                }));
            },

            /**
             * Load user profile
             */
            loadProfile: async (userId) => {
                if (!userId) return;

                get().setLoading('profile', true);

                try {
                    const profile = await supabaseService.getUserProfile(userId);

                    set((state) => ({
                        profile,
                        loading: { ...state.loading, profile: false },
                        errors: { ...state.errors, profile: null }
                    }));

                    return profile;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('profile', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Update user profile
             */
            updateProfile: async (profileData) => {
                const { profile } = get();
                if (!profile?.id) throw new Error('No profile loaded');

                // Validate profile data
                const validationResult = validateUserProfile(profileData);
                if (!validationResult.isValid) {
                    throw new Error(`Invalid profile data: ${validationResult.errorMessages.join(', ')}`);
                }

                get().setLoading('profile', true);

                try {
                    const updatedProfile = await supabaseService.updateUserProfile(
                        profile.id,
                        profileData
                    );

                    set((state) => ({
                        profile: { ...state.profile, ...updatedProfile },
                        loading: { ...state.loading, profile: false },
                        errors: { ...state.errors, profile: null }
                    }));

                    return updatedProfile;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('profile', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Update preferences
             */
            updatePreferences: async (newPreferences) => {
                const { profile } = get();
                if (!profile?.id) throw new Error('No profile loaded');

                get().setLoading('preferences', true);

                try {
                    const updatedPreferences = { ...get().preferences, ...newPreferences };

                    // Save to database
                    await supabaseService.updateUserProfile(profile.id, {
                        preferences: updatedPreferences
                    });

                    set((state) => ({
                        preferences: updatedPreferences,
                        loading: { ...state.loading, preferences: false },
                        errors: { ...state.errors, preferences: null }
                    }));

                    return updatedPreferences;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('preferences', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Update goals
             */
            updateGoals: async (newGoals) => {
                const { profile } = get();
                if (!profile?.id) throw new Error('No profile loaded');

                get().setLoading('goals', true);

                try {
                    const updatedGoals = { ...get().goals, ...newGoals };

                    // Save to database
                    await supabaseService.updateUserProfile(profile.id, {
                        goals: updatedGoals
                    });

                    set((state) => ({
                        goals: updatedGoals,
                        loading: { ...state.loading, goals: false },
                        errors: { ...state.errors, goals: null }
                    }));

                    return updatedGoals;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('goals', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Load achievements
             */
            loadAchievements: async () => {
                const { profile } = get();
                if (!profile?.id) return;

                get().setLoading('achievements', true);

                try {
                    const achievements = await supabaseService.getUserAchievements(profile.id);

                    set((state) => ({
                        achievements,
                        loading: { ...state.loading, achievements: false },
                        errors: { ...state.errors, achievements: null }
                    }));

                    return achievements;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('achievements', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Add achievement
             */
            addAchievement: async (achievementData) => {
                const { profile } = get();
                if (!profile?.id) throw new Error('No profile loaded');

                try {
                    const newAchievement = await supabaseService.createAchievement(
                        profile.id,
                        achievementData
                    );

                    set((state) => ({
                        achievements: [...state.achievements, newAchievement]
                    }));

                    return newAchievement;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('achievements', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Update streak
             */
            updateStreak: (newStreakData) => {
                set((state) => ({
                    streaks: { ...state.streaks, ...newStreakData }
                }));
            },

            /**
             * Calculate daily calorie needs
             */
            calculateDailyCalories: () => {
                const { profile, goals } = get();
                if (!profile) return goals.dailyCalories;

                try {
                    // Basic BMR calculation using Mifflin-St Jeor Equation
                    let bmr;
                    if (profile.gender === 'male') {
                        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
                    } else {
                        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
                    }

                    // Activity multipliers
                    const activityMultipliers = {
                        sedentary: 1.2,
                        light: 1.375,
                        moderate: 1.55,
                        active: 1.725,
                        very_active: 1.9
                    };

                    const tdee = bmr * (activityMultipliers[profile.activity_level] || 1.2);

                    // Goal adjustments
                    let targetCalories = tdee;
                    if (profile.goal === 'lose') {
                        targetCalories = tdee - 500; // 1lb per week deficit
                    } else if (profile.goal === 'gain') {
                        targetCalories = tdee + 500; // 1lb per week surplus
                    }

                    // Update goals if auto-calculated
                    get().updateGoals({ dailyCalories: Math.round(targetCalories) });

                    return Math.round(targetCalories);
                } catch (error) {
                    console.warn('Failed to calculate daily calories:', error);
                    return goals.dailyCalories;
                }
            },

            /**
             * Reset store to initial state
             */
            reset: () => {
                set(initialUserState);
            },

            /**
             * Initialize store with user data
             */
            initialize: async (userId) => {
                if (!userId) return;

                try {
                    await Promise.all([
                        get().loadProfile(userId),
                        get().loadAchievements()
                    ]);
                } catch (error) {
                    console.error('Failed to initialize user store:', error);
                    throw error;
                }
            }
        }),
        {
            name: 'user-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist preferences, goals, achievements, and streaks
                preferences: state.preferences,
                goals: state.goals,
                achievements: state.achievements,
                streaks: state.streaks
            })
        }
    )
);

export default useUserStore;