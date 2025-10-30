/**
 * Custom Data Hooks
 * Convenient hooks for common data operations
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../stores/appStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { useUserStore } from '../stores/userStore';
import { showToast } from '../utils/toast';

/**
 * Hook for user profile operations
 */
export const useUserProfile = () => {
    const { user } = useAuth();
    const {
        profile,
        preferences,
        goals,
        loading,
        errors,
        loadProfile,
        updateProfile,
        updatePreferences,
        updateGoals,
        calculateDailyCalories
    } = useUserStore();

    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize profile data
    useEffect(() => {
        if (user?.id && !isInitialized) {
            loadProfile(user.id)
                .then(() => setIsInitialized(true))
                .catch(error => {
                    console.error('Failed to load profile:', error);
                    showToast('Failed to load profile data', 'error');
                });
        }
    }, [user?.id, loadProfile, isInitialized]);

    // Memoized update functions
    const updateProfileData = useCallback(async (data) => {
        try {
            await updateProfile(data);
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast('Failed to update profile', 'error');
            throw error;
        }
    }, [updateProfile]);

    const updateUserPreferences = useCallback(async (prefs) => {
        try {
            await updatePreferences(prefs);
            showToast('Preferences updated', 'success');
        } catch (error) {
            console.error('Failed to update preferences:', error);
            showToast('Failed to update preferences', 'error');
            throw error;
        }
    }, [updatePreferences]);

    const updateUserGoals = useCallback(async (newGoals) => {
        try {
            await updateGoals(newGoals);
            showToast('Goals updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update goals:', error);
            showToast('Failed to update goals', 'error');
            throw error;
        }
    }, [updateGoals]);

    return {
        profile,
        preferences,
        goals,
        loading: loading.profile,
        error: errors.profile,
        isInitialized,
        updateProfile: updateProfileData,
        updatePreferences: updateUserPreferences,
        updateGoals: updateUserGoals,
        calculateDailyCalories
    };
};

/**
 * Hook for nutrition tracking operations
 */
export const useNutrition = (date) => {
    const { user } = useAuth();
    const {
        today,
        history,
        loading,
        errors,
        loadMeals,
        addMeal,
        updateMeal,
        deleteMeal,
        logWater,
        setCurrentDate,
        initialize
    } = useNutritionStore();

    const [isInitialized, setIsInitialized] = useState(false);
    const currentDate = date || today.date;

    // Initialize nutrition data
    useEffect(() => {
        if (user?.id && !isInitialized) {
            initialize(user.id)
                .then(() => setIsInitialized(true))
                .catch(error => {
                    console.error('Failed to initialize nutrition:', error);
                    showToast('Failed to load nutrition data', 'error');
                });
        }
    }, [user?.id, initialize, isInitialized]);

    // Load data when date changes
    useEffect(() => {
        if (user?.id && isInitialized && date && date !== today.date) {
            setCurrentDate(date, user.id);
        }
    }, [user?.id, date, today.date, setCurrentDate, isInitialized]);

    // Get data for current date
    const currentData = currentDate === today.date ? today : history[currentDate];

    // Memoized functions
    const addMealEntry = useCallback(async (mealData) => {
        if (!user?.id) throw new Error('User not authenticated');

        try {
            const meal = await addMeal(mealData, user.id);
            showToast('Meal added successfully', 'success');
            return meal;
        } catch (error) {
            console.error('Failed to add meal:', error);
            showToast('Failed to add meal', 'error');
            throw error;
        }
    }, [user?.id, addMeal]);

    const updateMealEntry = useCallback(async (mealId, mealData) => {
        try {
            const meal = await updateMeal(mealId, mealData);
            showToast('Meal updated successfully', 'success');
            return meal;
        } catch (error) {
            console.error('Failed to update meal:', error);
            showToast('Failed to update meal', 'error');
            throw error;
        }
    }, [updateMeal]);

    const deleteMealEntry = useCallback(async (mealId) => {
        try {
            await deleteMeal(mealId);
            showToast('Meal deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete meal:', error);
            showToast('Failed to delete meal', 'error');
            throw error;
        }
    }, [deleteMeal]);

    const addWater = useCallback(async (amount) => {
        if (!user?.id) throw new Error('User not authenticated');

        try {
            await logWater(amount, user.id);
            showToast(`Added ${amount}ml water`, 'success');
        } catch (error) {
            console.error('Failed to log water:', error);
            showToast('Failed to log water', 'error');
            throw error;
        }
    }, [user?.id, logWater]);

    return {
        data: currentData || {
            meals: [],
            water: 0,
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            mealTotals: {}
        },
        loading: loading.meals,
        error: errors.meals,
        isInitialized,
        addMeal: addMealEntry,
        updateMeal: updateMealEntry,
        deleteMeal: deleteMealEntry,
        addWater,
        currentDate
    };
};

/**
 * Hook for food database operations
 */
export const useFoodDatabase = () => {
    const { user } = useAuth();
    const {
        foodDatabase,
        loading,
        errors,
        searchFood,
        addToRecent,
        toggleFavorite,
        createCustomFood
    } = useNutritionStore();

    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Memoized search function with debouncing
    const searchFoods = useCallback(async (query, options = {}) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchFood(query, options);
            setSearchResults(results);
            return results;
        } catch (error) {
            console.error('Food search failed:', error);
            showToast('Search failed', 'error');
            throw error;
        } finally {
            setIsSearching(false);
        }
    }, [searchFood]);

    const addToFavorites = useCallback(async (food) => {
        if (!user?.id) throw new Error('User not authenticated');

        try {
            await toggleFavorite(food, user.id);
            const isFavorite = foodDatabase.favorites.some(fav => fav.id === food.id);
            showToast(
                isFavorite ? 'Removed from favorites' : 'Added to favorites',
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            showToast('Failed to update favorites', 'error');
            throw error;
        }
    }, [user?.id, toggleFavorite, foodDatabase.favorites]);

    const createFood = useCallback(async (foodData) => {
        if (!user?.id) throw new Error('User not authenticated');

        try {
            const food = await createCustomFood(foodData, user.id);
            showToast('Custom food created', 'success');
            return food;
        } catch (error) {
            console.error('Failed to create food:', error);
            showToast('Failed to create food', 'error');
            throw error;
        }
    }, [user?.id, createCustomFood]);

    return {
        recent: foodDatabase.recent,
        favorites: foodDatabase.favorites,
        custom: foodDatabase.custom,
        searchResults,
        loading: loading.foodSearch || isSearching,
        error: errors.foodSearch,
        searchFood: searchFoods,
        addToRecent,
        toggleFavorite: addToFavorites,
        createCustomFood: createFood
    };
};

/**
 * Hook for app settings and preferences
 */
export const useAppSettings = () => {
    const {
        theme,
        colorScheme,
        fontSize,
        reducedMotion,
        hapticFeedback,
        features,
        notifications,
        setTheme,
        setColorScheme,
        setFontSize,
        toggleReducedMotion,
        toggleHapticFeedback,
        setFeature,
        updateNotificationSettings,
        clearCache,
        getHealthMetrics
    } = useAppStore();

    const updateTheme = useCallback((newTheme) => {
        setTheme(newTheme);
        showToast(`Theme changed to ${newTheme}`, 'success');
    }, [setTheme]);

    const updateFontSize = useCallback((size) => {
        setFontSize(size);
        showToast(`Font size changed to ${size}`, 'success');
    }, [setFontSize]);

    const toggleFeature = useCallback((featureName, enabled) => {
        setFeature(featureName, enabled);
        showToast(
            `${featureName} ${enabled ? 'enabled' : 'disabled'}`,
            'success'
        );
    }, [setFeature]);

    const clearAppCache = useCallback(async () => {
        try {
            await clearCache();
            showToast('Cache cleared successfully', 'success');
        } catch (error) {
            console.error('Failed to clear cache:', error);
            showToast('Failed to clear cache', 'error');
            throw error;
        }
    }, [clearCache]);

    return {
        theme,
        colorScheme,
        fontSize,
        reducedMotion,
        hapticFeedback,
        features,
        notifications,
        setTheme: updateTheme,
        setColorScheme,
        setFontSize: updateFontSize,
        toggleReducedMotion,
        toggleHapticFeedback,
        toggleFeature,
        updateNotificationSettings,
        clearCache: clearAppCache,
        getHealthMetrics
    };
};

/**
 * Hook for offline functionality
 */
export const useOffline = () => {
    const { connectivity, setConnectivity } = useAppStore();
    const [pendingActions, setPendingActions] = useState([]);

    // Monitor network connectivity
    useEffect(() => {
        // This would be implemented with actual network monitoring
        // For now, we'll simulate it
        const checkConnectivity = () => {
            const isOnline = navigator.onLine;
            setConnectivity({
                isOnline,
                lastOnline: isOnline ? new Date().toISOString() : connectivity.lastOnline
            });
        };

        window.addEventListener('online', checkConnectivity);
        window.addEventListener('offline', checkConnectivity);

        return () => {
            window.removeEventListener('online', checkConnectivity);
            window.removeEventListener('offline', checkConnectivity);
        };
    }, [setConnectivity, connectivity.lastOnline]);

    const addPendingAction = useCallback((action) => {
        setPendingActions(prev => [...prev, {
            ...action,
            id: Date.now(),
            timestamp: new Date().toISOString()
        }]);
    }, []);

    const processPendingActions = useCallback(async () => {
        if (!connectivity.isOnline || pendingActions.length === 0) return;

        const processed = [];
        for (const action of pendingActions) {
            try {
                await action.execute();
                processed.push(action.id);
                showToast(`Synced ${action.type}`, 'success');
            } catch (error) {
                console.error('Failed to process pending action:', error);
            }
        }

        setPendingActions(prev =>
            prev.filter(action => !processed.includes(action.id))
        );
    }, [connectivity.isOnline, pendingActions]);

    // Process pending actions when coming online
    useEffect(() => {
        if (connectivity.isOnline) {
            processPendingActions();
        }
    }, [connectivity.isOnline, processPendingActions]);

    return {
        isOnline: connectivity.isOnline,
        isSlowConnection: connectivity.isSlowConnection,
        lastOnline: connectivity.lastOnline,
        pendingActions: pendingActions.length,
        addPendingAction,
        processPendingActions
    };
};

/**
 * Hook for data synchronization
 */
export const useDataSync = () => {
    const { user } = useAuth();
    const { initialize: initializeUser } = useUserStore();
    const { initialize: initializeNutrition } = useNutritionStore();
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    const syncData = useCallback(async (force = false) => {
        if (!user?.id) return;

        // Don't sync too frequently unless forced
        if (!force && lastSync && Date.now() - new Date(lastSync).getTime() < 300000) {
            return;
        }

        setIsLoading(true);
        try {
            await Promise.all([
                initializeUser(user.id),
                initializeNutrition(user.id)
            ]);

            setLastSync(new Date().toISOString());
            showToast('Data synchronized', 'success');
        } catch (error) {
            console.error('Data sync failed:', error);
            showToast('Sync failed', 'error');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, initializeUser, initializeNutrition, lastSync]);

    // Auto-sync on app focus
    useEffect(() => {
        if (user?.id) {
            syncData();
        }
    }, [user?.id, syncData]);

    return {
        isLoading,
        lastSync,
        syncData
    };
};

export default {
    useUserProfile,
    useNutrition,
    useFoodDatabase,
    useAppSettings,
    useOffline,
    useDataSync
};