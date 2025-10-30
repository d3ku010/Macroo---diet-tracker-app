/**
 * Nutrition Store - Zustand
 * Manages daily nutrition tracking, meals, and food database
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { supabaseService } from '../services/supabaseService';
import { errorHandler } from '../utils/errorHandler';
import { validateFoodItem, validateMealEntry, validateWaterEntry } from '../utils/validation';

/**
 * Initial nutrition state
 */
const initialNutritionState = {
    // Today's data
    today: {
        date: new Date().toISOString().split('T')[0],
        meals: [],
        water: 0,
        totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
        },
        mealTotals: {
            breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }
    },

    // Historical data cache
    history: {},

    // Food database cache
    foodDatabase: {
        recent: [],
        favorites: [],
        custom: [],
        searchCache: {}
    },

    // Quick add templates
    mealTemplates: [],

    // Loading states
    loading: {
        meals: false,
        water: false,
        foodSearch: false,
        mealTemplates: false,
        history: false
    },

    // Error states
    errors: {
        meals: null,
        water: null,
        foodSearch: null,
        mealTemplates: null,
        history: null
    }
};

/**
 * Nutrition store with Zustand
 */
export const useNutritionStore = create(
    persist(
        (set, get) => ({
            ...initialNutritionState,

            /**
             * Clear all errors
             */
            clearErrors: () => {
                set((state) => ({
                    errors: {
                        meals: null,
                        water: null,
                        foodSearch: null,
                        mealTemplates: null,
                        history: null
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
             * Calculate nutrition totals for meals
             */
            calculateTotals: (meals) => {
                const totals = {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    fiber: 0,
                    sugar: 0,
                    sodium: 0
                };

                const mealTotals = {
                    breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
                };

                meals.forEach((meal) => {
                    const quantity = meal.quantity || 1;
                    const food = meal.food_item || meal.food || {};

                    // Calculate nutrition for this meal entry
                    const mealNutrition = {
                        calories: (food.calories || 0) * quantity,
                        protein: (food.protein || 0) * quantity,
                        carbs: (food.carbs || food.carbohydrates || 0) * quantity,
                        fat: (food.fat || food.total_fat || 0) * quantity,
                        fiber: (food.fiber || food.dietary_fiber || 0) * quantity,
                        sugar: (food.sugar || food.sugars || 0) * quantity,
                        sodium: (food.sodium || 0) * quantity
                    };

                    // Add to totals
                    Object.keys(totals).forEach(key => {
                        totals[key] += mealNutrition[key] || 0;
                    });

                    // Add to meal-specific totals
                    const mealType = meal.meal_type || 'snack';
                    if (mealTotals[mealType]) {
                        mealTotals[mealType].calories += mealNutrition.calories;
                        mealTotals[mealType].protein += mealNutrition.protein;
                        mealTotals[mealType].carbs += mealNutrition.carbs;
                        mealTotals[mealType].fat += mealNutrition.fat;
                    }
                });

                return { totals, mealTotals };
            },

            /**
             * Load meals for specific date
             */
            loadMeals: async (date, userId) => {
                if (!userId) return;

                const targetDate = date || new Date().toISOString().split('T')[0];
                get().setLoading('meals', true);

                try {
                    const meals = await supabaseService.getMealsByDate(userId, targetDate);
                    const { totals, mealTotals } = get().calculateTotals(meals);

                    set((state) => {
                        if (targetDate === state.today.date) {
                            return {
                                today: {
                                    ...state.today,
                                    meals,
                                    totals,
                                    mealTotals
                                },
                                loading: { ...state.loading, meals: false },
                                errors: { ...state.errors, meals: null }
                            };
                        } else {
                            return {
                                history: {
                                    ...state.history,
                                    [targetDate]: { meals, totals, mealTotals }
                                },
                                loading: { ...state.loading, meals: false },
                                errors: { ...state.errors, meals: null }
                            };
                        }
                    });

                    return meals;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('meals', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Add meal entry
             */
            addMeal: async (mealData, userId) => {
                if (!userId) throw new Error('User ID required');

                // Validate meal data
                const validationResult = validateMealEntry(mealData);
                if (!validationResult.isValid) {
                    throw new Error(`Invalid meal data: ${validationResult.errorMessages.join(', ')}`);
                }

                get().setLoading('meals', true);

                try {
                    const newMeal = await supabaseService.createMealEntry(userId, {
                        ...mealData,
                        date: mealData.date || new Date().toISOString().split('T')[0]
                    });

                    // Update today's meals if it's for today
                    const today = new Date().toISOString().split('T')[0];
                    if (newMeal.date === today) {
                        set((state) => {
                            const updatedMeals = [...state.today.meals, newMeal];
                            const { totals, mealTotals } = get().calculateTotals(updatedMeals);

                            return {
                                today: {
                                    ...state.today,
                                    meals: updatedMeals,
                                    totals,
                                    mealTotals
                                },
                                loading: { ...state.loading, meals: false },
                                errors: { ...state.errors, meals: null }
                            };
                        });
                    }

                    // Add to recent foods
                    get().addToRecent(newMeal.food_item || newMeal.food);

                    return newMeal;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('meals', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Update meal entry
             */
            updateMeal: async (mealId, mealData) => {
                get().setLoading('meals', true);

                try {
                    const updatedMeal = await supabaseService.updateMealEntry(mealId, mealData);

                    // Update in state
                    set((state) => {
                        const updatedMeals = state.today.meals.map(meal =>
                            meal.id === mealId ? updatedMeal : meal
                        );
                        const { totals, mealTotals } = get().calculateTotals(updatedMeals);

                        return {
                            today: {
                                ...state.today,
                                meals: updatedMeals,
                                totals,
                                mealTotals
                            },
                            loading: { ...state.loading, meals: false },
                            errors: { ...state.errors, meals: null }
                        };
                    });

                    return updatedMeal;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('meals', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Delete meal entry
             */
            deleteMeal: async (mealId) => {
                get().setLoading('meals', true);

                try {
                    await supabaseService.deleteMealEntry(mealId);

                    // Remove from state
                    set((state) => {
                        const updatedMeals = state.today.meals.filter(meal => meal.id !== mealId);
                        const { totals, mealTotals } = get().calculateTotals(updatedMeals);

                        return {
                            today: {
                                ...state.today,
                                meals: updatedMeals,
                                totals,
                                mealTotals
                            },
                            loading: { ...state.loading, meals: false },
                            errors: { ...state.errors, meals: null }
                        };
                    });
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('meals', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Log water intake
             */
            logWater: async (amount, userId) => {
                if (!userId) throw new Error('User ID required');

                // Validate water entry
                const validationResult = validateWaterEntry({ amount });
                if (!validationResult.isValid) {
                    throw new Error(`Invalid water amount: ${validationResult.errorMessages.join(', ')}`);
                }

                get().setLoading('water', true);

                try {
                    const waterEntry = await supabaseService.logWaterIntake(userId, amount);

                    // Update today's water total
                    set((state) => ({
                        today: {
                            ...state.today,
                            water: state.today.water + amount
                        },
                        loading: { ...state.loading, water: false },
                        errors: { ...state.errors, water: null }
                    }));

                    return waterEntry;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('water', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Search food database
             */
            searchFood: async (query, options = {}) => {
                if (!query.trim()) return [];

                const cacheKey = `${query.toLowerCase()}_${JSON.stringify(options)}`;
                const cached = get().foodDatabase.searchCache[cacheKey];

                if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
                    return cached.results;
                }

                get().setLoading('foodSearch', true);

                try {
                    const results = await supabaseService.searchFoods(query, options);

                    // Cache results
                    set((state) => ({
                        foodDatabase: {
                            ...state.foodDatabase,
                            searchCache: {
                                ...state.foodDatabase.searchCache,
                                [cacheKey]: {
                                    results,
                                    timestamp: Date.now()
                                }
                            }
                        },
                        loading: { ...state.loading, foodSearch: false },
                        errors: { ...state.errors, foodSearch: null }
                    }));

                    return results;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    get().setError('foodSearch', handledError.message);
                    throw handledError;
                }
            },

            /**
             * Add food to recent foods
             */
            addToRecent: (food) => {
                if (!food) return;

                set((state) => {
                    const recent = state.foodDatabase.recent.filter(item => item.id !== food.id);
                    return {
                        foodDatabase: {
                            ...state.foodDatabase,
                            recent: [food, ...recent].slice(0, 20) // Keep last 20
                        }
                    };
                });
            },

            /**
             * Add food to favorites
             */
            toggleFavorite: async (food, userId) => {
                if (!food || !userId) return;

                try {
                    const isFavorite = get().foodDatabase.favorites.some(fav => fav.id === food.id);

                    if (isFavorite) {
                        await supabaseService.removeFavoriteFood(userId, food.id);
                        set((state) => ({
                            foodDatabase: {
                                ...state.foodDatabase,
                                favorites: state.foodDatabase.favorites.filter(fav => fav.id !== food.id)
                            }
                        }));
                    } else {
                        await supabaseService.addFavoriteFood(userId, food.id);
                        set((state) => ({
                            foodDatabase: {
                                ...state.foodDatabase,
                                favorites: [...state.foodDatabase.favorites, food]
                            }
                        }));
                    }
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    throw handledError;
                }
            },

            /**
             * Create custom food item
             */
            createCustomFood: async (foodData, userId) => {
                if (!userId) throw new Error('User ID required');

                // Validate food data
                const validationResult = validateFoodItem(foodData);
                if (!validationResult.isValid) {
                    throw new Error(`Invalid food data: ${validationResult.errorMessages.join(', ')}`);
                }

                try {
                    const customFood = await supabaseService.createCustomFood(userId, foodData);

                    set((state) => ({
                        foodDatabase: {
                            ...state.foodDatabase,
                            custom: [...state.foodDatabase.custom, customFood]
                        }
                    }));

                    return customFood;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    throw handledError;
                }
            },

            /**
             * Get nutrition summary for date range
             */
            getNutritionSummary: async (startDate, endDate, userId) => {
                if (!userId) return null;

                try {
                    const summary = await supabaseService.getNutritionSummary(
                        userId,
                        startDate,
                        endDate
                    );
                    return summary;
                } catch (error) {
                    const handledError = errorHandler.handleError(error);
                    throw handledError;
                }
            },

            /**
             * Set current date and load data
             */
            setCurrentDate: async (date, userId) => {
                const newDate = date || new Date().toISOString().split('T')[0];

                set((state) => ({
                    today: {
                        ...state.today,
                        date: newDate,
                        meals: [],
                        water: 0,
                        totals: initialNutritionState.today.totals,
                        mealTotals: initialNutritionState.today.mealTotals
                    }
                }));

                if (userId) {
                    await get().loadMeals(newDate, userId);
                    await get().loadWaterIntake(newDate, userId);
                }
            },

            /**
             * Load water intake for date
             */
            loadWaterIntake: async (date, userId) => {
                if (!userId) return;

                const targetDate = date || new Date().toISOString().split('T')[0];

                try {
                    const waterEntries = await supabaseService.getWaterByDate(userId, targetDate);
                    const totalWater = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);

                    if (targetDate === get().today.date) {
                        set((state) => ({
                            today: {
                                ...state.today,
                                water: totalWater
                            }
                        }));
                    }

                    return totalWater;
                } catch (error) {
                    console.warn('Failed to load water intake:', error);
                    return 0;
                }
            },

            /**
             * Reset store to initial state
             */
            reset: () => {
                set(initialNutritionState);
            },

            /**
             * Initialize store with today's data
             */
            initialize: async (userId) => {
                if (!userId) return;

                const today = new Date().toISOString().split('T')[0];

                try {
                    await Promise.all([
                        get().loadMeals(today, userId),
                        get().loadWaterIntake(today, userId)
                    ]);
                } catch (error) {
                    console.error('Failed to initialize nutrition store:', error);
                    throw error;
                }
            }
        }),
        {
            name: 'nutrition-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Only persist food database cache and meal templates
                foodDatabase: state.foodDatabase,
                mealTemplates: state.mealTemplates
            })
        }
    )
);

export default useNutritionStore;