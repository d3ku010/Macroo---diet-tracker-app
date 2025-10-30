/**
 * Nutrition Store Tests
 * Test Zustand nutrition tracking store functionality
 */

import { act, renderHook } from '@testing-library/react-native';
import { useNutritionStore } from '../stores/nutritionStore';

// Mock AsyncStorage
const mockAsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock cache strategies
const mockCacheStrategies = {
    setWithTTL: jest.fn(),
    getWithTTL: jest.fn(),
    invalidate: jest.fn(),
};

jest.mock('../utils/cacheStrategies', () => mockCacheStrategies);

// Mock date utilities
jest.mock('../utils/healthCalculations', () => ({
    calculateBMI: jest.fn(() => 22.5),
    calculateBMR: jest.fn(() => 1650),
    calculateMacroTargets: jest.fn(() => ({
        protein: 150,
        carbs: 200,
        fat: 65
    }))
}));

describe('NutritionStore', () => {
    beforeEach(() => {
        // Reset store state
        useNutritionStore.getState().reset();
        jest.clearAllMocks();

        // Mock current date
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-10-30T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initial State', () => {
        test('should have correct initial state', () => {
            const { result } = renderHook(() => useNutritionStore());

            expect(result.current.meals).toEqual([]);
            expect(result.current.foods).toEqual([]);
            expect(result.current.waterIntake).toBe(0);
            expect(result.current.dailyGoals.calories).toBe(2000);
            expect(result.current.loading.meals).toBe(false);
            expect(result.current.errors.meals).toBe(null);
        });
    });

    describe('Meal Management', () => {
        test('should add a meal', () => {
            const { result } = renderHook(() => useNutritionStore());

            const newMeal = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(newMeal);
            });

            expect(result.current.meals).toHaveLength(1);
            expect(result.current.meals[0]).toEqual(newMeal);
        });

        test('should update existing meal', () => {
            const { result } = renderHook(() => useNutritionStore());

            const initialMeal = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(initialMeal);
            });

            const updatedMeal = {
                ...initialMeal,
                name: 'Updated Breakfast',
                foods: [{ id: 'food-1', name: 'Oatmeal', calories: 150 }]
            };

            act(() => {
                result.current.updateMeal('meal-1', updatedMeal);
            });

            expect(result.current.meals[0].name).toBe('Updated Breakfast');
            expect(result.current.meals[0].foods).toHaveLength(1);
        });

        test('should delete meal', () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(meal);
            });

            expect(result.current.meals).toHaveLength(1);

            act(() => {
                result.current.deleteMeal('meal-1');
            });

            expect(result.current.meals).toHaveLength(0);
        });

        test('should get meals by date', () => {
            const { result } = renderHook(() => useNutritionStore());

            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            const todayMeal = {
                id: 'meal-today',
                name: 'Today Breakfast',
                foods: [],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            const yesterdayMeal = {
                id: 'meal-yesterday',
                name: 'Yesterday Breakfast',
                foods: [],
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(todayMeal);
                result.current.addMeal(yesterdayMeal);
            });

            const todayMeals = result.current.getMealsByDate(today);
            const yesterdayMeals = result.current.getMealsByDate(yesterday);

            expect(todayMeals).toHaveLength(1);
            expect(todayMeals[0].id).toBe('meal-today');
            expect(yesterdayMeals).toHaveLength(1);
            expect(yesterdayMeals[0].id).toBe('meal-yesterday');
        });
    });

    describe('Food Management', () => {
        test('should add food to meal', () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            const food = {
                id: 'food-1',
                name: 'Banana',
                calories: 105,
                protein: 1.3,
                carbs: 27,
                fat: 0.4,
                quantity: 1
            };

            act(() => {
                result.current.addMeal(meal);
                result.current.addFoodToMeal('meal-1', food);
            });

            expect(result.current.meals[0].foods).toHaveLength(1);
            expect(result.current.meals[0].foods[0]).toEqual(food);
        });

        test('should remove food from meal', () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [
                    { id: 'food-1', name: 'Banana', calories: 105 },
                    { id: 'food-2', name: 'Apple', calories: 80 }
                ],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(meal);
            });

            act(() => {
                result.current.removeFoodFromMeal('meal-1', 'food-1');
            });

            expect(result.current.meals[0].foods).toHaveLength(1);
            expect(result.current.meals[0].foods[0].id).toBe('food-2');
        });

        test('should update food quantity', () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [
                    { id: 'food-1', name: 'Banana', calories: 105, quantity: 1 }
                ],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(meal);
            });

            act(() => {
                result.current.updateFoodQuantity('meal-1', 'food-1', 2);
            });

            expect(result.current.meals[0].foods[0].quantity).toBe(2);
        });
    });

    describe('Water Tracking', () => {
        test('should add water intake', () => {
            const { result } = renderHook(() => useNutritionStore());

            act(() => {
                result.current.addWater(250);
            });

            expect(result.current.waterIntake).toBe(250);

            act(() => {
                result.current.addWater(300);
            });

            expect(result.current.waterIntake).toBe(550);
        });

        test('should set water intake', () => {
            const { result } = renderHook(() => useNutritionStore());

            act(() => {
                result.current.addWater(500);
            });

            expect(result.current.waterIntake).toBe(500);

            act(() => {
                result.current.setWaterIntake(1000);
            });

            expect(result.current.waterIntake).toBe(1000);
        });

        test('should reset daily water intake', () => {
            const { result } = renderHook(() => useNutritionStore());

            act(() => {
                result.current.addWater(1500);
            });

            expect(result.current.waterIntake).toBe(1500);

            act(() => {
                result.current.resetDailyWater();
            });

            expect(result.current.waterIntake).toBe(0);
        });
    });

    describe('Nutrition Calculations', () => {
        test('should calculate daily totals', () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal1 = {
                id: 'meal-1',
                name: 'Breakfast',
                foods: [
                    { id: 'food-1', calories: 200, protein: 10, carbs: 30, fat: 5 },
                    { id: 'food-2', calories: 150, protein: 8, carbs: 20, fat: 3 }
                ],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            const meal2 = {
                id: 'meal-2',
                name: 'Lunch',
                foods: [
                    { id: 'food-3', calories: 400, protein: 25, carbs: 40, fat: 15 }
                ],
                timestamp: new Date().toISOString(),
                type: 'lunch'
            };

            act(() => {
                result.current.addMeal(meal1);
                result.current.addMeal(meal2);
            });

            const dailyTotals = result.current.getDailyTotals();

            expect(dailyTotals.calories).toBe(750);
            expect(dailyTotals.protein).toBe(43);
            expect(dailyTotals.carbs).toBe(90);
            expect(dailyTotals.fat).toBe(23);
        });

        test('should calculate daily totals for specific date', () => {
            const { result } = renderHook(() => useNutritionStore());

            const today = new Date().toISOString();
            const yesterday = new Date(Date.now() - 86400000).toISOString();

            const todayMeal = {
                id: 'meal-today',
                foods: [{ calories: 300, protein: 15, carbs: 25, fat: 10 }],
                timestamp: today,
                type: 'breakfast'
            };

            const yesterdayMeal = {
                id: 'meal-yesterday',
                foods: [{ calories: 500, protein: 20, carbs: 40, fat: 20 }],
                timestamp: yesterday,
                type: 'lunch'
            };

            act(() => {
                result.current.addMeal(todayMeal);
                result.current.addMeal(yesterdayMeal);
            });

            const todayTotals = result.current.getDailyTotals(today.split('T')[0]);
            const yesterdayTotals = result.current.getDailyTotals(yesterday.split('T')[0]);

            expect(todayTotals.calories).toBe(300);
            expect(yesterdayTotals.calories).toBe(500);
        });

        test('should calculate macro percentages', () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal = {
                id: 'meal-1',
                foods: [
                    { calories: 400, protein: 25, carbs: 50, fat: 10 } // ~25% protein, 50% carbs, 25% fat
                ],
                timestamp: new Date().toISOString(),
                type: 'lunch'
            };

            act(() => {
                result.current.addMeal(meal);
            });

            const macroPercentages = result.current.getMacroPercentages();

            // Protein: 25g * 4 cal/g = 100 cal = 25%
            // Carbs: 50g * 4 cal/g = 200 cal = 50%
            // Fat: 10g * 9 cal/g = 90 cal = 22.5%
            expect(macroPercentages.protein).toBeCloseTo(25, 0);
            expect(macroPercentages.carbs).toBeCloseTo(50, 0);
            expect(macroPercentages.fat).toBeCloseTo(22.5, 0);
        });
    });

    describe('Goals Management', () => {
        test('should update daily goals', () => {
            const { result } = renderHook(() => useNutritionStore());

            const newGoals = {
                calories: 2200,
                protein: 150,
                carbs: 275,
                fat: 75,
                water: 2500
            };

            act(() => {
                result.current.updateDailyGoals(newGoals);
            });

            expect(result.current.dailyGoals).toEqual(newGoals);
        });

        test('should get progress towards goals', () => {
            const { result } = renderHook(() => useNutritionStore());

            // Set goals
            act(() => {
                result.current.updateDailyGoals({
                    calories: 2000,
                    protein: 100,
                    carbs: 250,
                    fat: 70,
                    water: 2000
                });
            });

            // Add meal
            const meal = {
                id: 'meal-1',
                foods: [
                    { calories: 1000, protein: 50, carbs: 125, fat: 35 }
                ],
                timestamp: new Date().toISOString(),
                type: 'lunch'
            };

            act(() => {
                result.current.addMeal(meal);
                result.current.addWater(1000);
            });

            const progress = result.current.getGoalProgress();

            expect(progress.calories).toBeCloseTo(0.5, 2); // 50%
            expect(progress.protein).toBeCloseTo(0.5, 2); // 50%
            expect(progress.carbs).toBeCloseTo(0.5, 2); // 50%
            expect(progress.fat).toBeCloseTo(0.5, 2); // 50%
            expect(progress.water).toBeCloseTo(0.5, 2); // 50%
        });
    });

    describe('Data Persistence', () => {
        test('should save data to cache', async () => {
            const { result } = renderHook(() => useNutritionStore());

            const meal = {
                id: 'meal-1',
                name: 'Test Meal',
                foods: [],
                timestamp: new Date().toISOString(),
                type: 'breakfast'
            };

            act(() => {
                result.current.addMeal(meal);
            });

            await act(async () => {
                await result.current.saveToCache();
            });

            expect(mockCacheStrategies.setWithTTL).toHaveBeenCalledWith(
                'nutrition_meals',
                expect.arrayContaining([meal]),
                expect.any(Number)
            );
        });

        test('should load data from cache', async () => {
            const cachedMeals = [
                {
                    id: 'cached-meal',
                    name: 'Cached Meal',
                    foods: [],
                    timestamp: new Date().toISOString(),
                    type: 'dinner'
                }
            ];

            mockCacheStrategies.getWithTTL.mockResolvedValue(cachedMeals);

            const { result } = renderHook(() => useNutritionStore());

            await act(async () => {
                await result.current.loadFromCache();
            });

            expect(result.current.meals).toEqual(cachedMeals);
        });
    });

    describe('Error Handling', () => {
        test('should handle loading states', () => {
            const { result } = renderHook(() => useNutritionStore());

            act(() => {
                result.current.setLoading('meals', true);
            });

            expect(result.current.loading.meals).toBe(true);

            act(() => {
                result.current.setLoading('meals', false);
            });

            expect(result.current.loading.meals).toBe(false);
        });

        test('should set and clear errors', () => {
            const { result } = renderHook(() => useNutritionStore());

            act(() => {
                result.current.setError('meals', 'Failed to load meals');
            });

            expect(result.current.errors.meals).toBe('Failed to load meals');

            act(() => {
                result.current.clearError('meals');
            });

            expect(result.current.errors.meals).toBe(null);
        });
    });

    describe('Store Reset', () => {
        test('should reset store to initial state', () => {
            const { result } = renderHook(() => useNutritionStore());

            // Modify state
            act(() => {
                result.current.addMeal({
                    id: 'meal-1',
                    name: 'Test Meal',
                    foods: [],
                    timestamp: new Date().toISOString(),
                    type: 'breakfast'
                });
                result.current.addWater(1500);
                result.current.setError('meals', 'Some error');
            });

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.meals).toEqual([]);
            expect(result.current.waterIntake).toBe(0);
            expect(result.current.errors.meals).toBe(null);
            expect(result.current.dailyGoals.calories).toBe(2000);
        });
    });
});