/**
 * Supabase Service Tests
 * Test Supabase database service functionality
 */

import { supabaseService } from '../services/supabaseService';

// Mock supabase client
const mockSupabaseClient = {
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                single: jest.fn(),
                order: jest.fn(() => ({
                    limit: jest.fn()
                }))
            })),
            order: jest.fn(() => ({
                limit: jest.fn()
            })),
            limit: jest.fn(),
            range: jest.fn()
        })),
        insert: jest.fn(() => ({
            select: jest.fn(() => ({
                single: jest.fn()
            }))
        })),
        update: jest.fn(() => ({
            eq: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn()
                }))
            }))
        })),
        delete: jest.fn(() => ({
            eq: jest.fn()
        })),
        upsert: jest.fn(() => ({
            select: jest.fn(() => ({
                single: jest.fn()
            }))
        }))
    })),
    auth: {
        getUser: jest.fn()
    },
    storage: {
        from: jest.fn(() => ({
            upload: jest.fn(),
            download: jest.fn(),
            remove: jest.fn(),
            list: jest.fn()
        }))
    }
};

jest.mock('../utils/supabaseClient', () => ({
    supabase: mockSupabaseClient
}));

// Mock error handler
const mockErrorHandler = {
    handleError: jest.fn(),
    createUserError: jest.fn((message) => new Error(message)),
};

jest.mock('../utils/errorHandler', () => mockErrorHandler);

describe('SupabaseService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('User Profile Operations', () => {
        test('should get user profile', async () => {
            const mockProfile = {
                id: 'user-123',
                email: 'test@example.com',
                full_name: 'Test User',
                created_at: '2025-01-01'
            };

            mockSupabaseClient.from().select().eq().single.mockResolvedValue({
                data: mockProfile,
                error: null
            });

            const result = await supabaseService.getUserProfile('user-123');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
            expect(result).toEqual(mockProfile);
        });

        test('should handle user profile not found', async () => {
            mockSupabaseClient.from().select().eq().single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows returned' }
            });

            await expect(supabaseService.getUserProfile('nonexistent-user'))
                .rejects.toThrow();

            expect(mockErrorHandler.handleError).toHaveBeenCalled();
        });

        test('should create user profile', async () => {
            const newProfile = {
                id: 'user-123',
                email: 'test@example.com',
                full_name: 'Test User'
            };

            const createdProfile = {
                ...newProfile,
                created_at: '2025-01-01',
                updated_at: '2025-01-01'
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: createdProfile,
                error: null
            });

            const result = await supabaseService.createUserProfile(newProfile);

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
            expect(result).toEqual(createdProfile);
        });

        test('should update user profile', async () => {
            const updates = {
                full_name: 'Updated Name',
                age: 30
            };

            const updatedProfile = {
                id: 'user-123',
                email: 'test@example.com',
                full_name: 'Updated Name',
                age: 30,
                updated_at: '2025-01-01'
            };

            mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
                data: updatedProfile,
                error: null
            });

            const result = await supabaseService.updateUserProfile('user-123', updates);

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
            expect(result).toEqual(updatedProfile);
        });
    });

    describe('Food Database Operations', () => {
        test('should search foods', async () => {
            const mockFoods = [
                { id: 'food-1', name: 'Apple', calories: 52 },
                { id: 'food-2', name: 'Banana', calories: 89 }
            ];

            mockSupabaseClient.from().select().limit.mockResolvedValue({
                data: mockFoods,
                error: null
            });

            const result = await supabaseService.searchFoods('apple', 10);

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
            expect(result).toEqual(mockFoods);
        });

        test('should get food by id', async () => {
            const mockFood = {
                id: 'food-123',
                name: 'Apple',
                calories: 52,
                protein: 0.3,
                carbs: 14,
                fat: 0.2
            };

            mockSupabaseClient.from().select().eq().single.mockResolvedValue({
                data: mockFood,
                error: null
            });

            const result = await supabaseService.getFoodById('food-123');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
            expect(result).toEqual(mockFood);
        });

        test('should create custom food', async () => {
            const newFood = {
                name: 'Custom Recipe',
                calories: 250,
                protein: 15,
                carbs: 30,
                fat: 8,
                user_id: 'user-123'
            };

            const createdFood = {
                ...newFood,
                id: 'food-custom-123',
                created_at: '2025-01-01'
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: createdFood,
                error: null
            });

            const result = await supabaseService.createCustomFood(newFood);

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
            expect(result).toEqual(createdFood);
        });
    });

    describe('Meal Operations', () => {
        test('should save meal', async () => {
            const newMeal = {
                user_id: 'user-123',
                name: 'Breakfast',
                type: 'breakfast',
                foods: [
                    { food_id: 'food-1', quantity: 1, calories: 100 }
                ],
                timestamp: '2025-01-01T08:00:00Z'
            };

            const savedMeal = {
                ...newMeal,
                id: 'meal-123',
                created_at: '2025-01-01'
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: savedMeal,
                error: null
            });

            const result = await supabaseService.saveMeal(newMeal);

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('meals');
            expect(result).toEqual(savedMeal);
        });

        test('should get user meals', async () => {
            const mockMeals = [
                { id: 'meal-1', name: 'Breakfast', type: 'breakfast' },
                { id: 'meal-2', name: 'Lunch', type: 'lunch' }
            ];

            mockSupabaseClient.from().select().eq().order().mockResolvedValue({
                data: mockMeals,
                error: null
            });

            const result = await supabaseService.getUserMeals('user-123');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('meals');
            expect(result).toEqual(mockMeals);
        });

        test('should get meals by date range', async () => {
            const mockMeals = [
                { id: 'meal-1', timestamp: '2025-01-01T08:00:00Z' },
                { id: 'meal-2', timestamp: '2025-01-01T12:00:00Z' }
            ];

            // Mock the complex query chain
            const mockQuery = {
                eq: jest.fn(() => mockQuery),
                gte: jest.fn(() => mockQuery),
                lte: jest.fn(() => mockQuery),
                order: jest.fn(() => mockQuery)
            };

            mockSupabaseClient.from().select.mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({
                data: mockMeals,
                error: null
            });

            const result = await supabaseService.getMealsByDateRange(
                'user-123',
                '2025-01-01',
                '2025-01-01'
            );

            expect(result).toEqual(mockMeals);
        });

        test('should update meal', async () => {
            const updates = {
                name: 'Updated Breakfast',
                foods: [
                    { food_id: 'food-2', quantity: 2, calories: 200 }
                ]
            };

            const updatedMeal = {
                id: 'meal-123',
                name: 'Updated Breakfast',
                foods: updates.foods,
                updated_at: '2025-01-01'
            };

            mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
                data: updatedMeal,
                error: null
            });

            const result = await supabaseService.updateMeal('meal-123', updates);

            expect(result).toEqual(updatedMeal);
        });

        test('should delete meal', async () => {
            mockSupabaseClient.from().delete().eq.mockResolvedValue({
                error: null
            });

            await supabaseService.deleteMeal('meal-123');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('meals');
            expect(mockSupabaseClient.from().delete().eq).toHaveBeenCalledWith('id', 'meal-123');
        });
    });

    describe('Water Tracking Operations', () => {
        test('should save water intake', async () => {
            const waterEntry = {
                user_id: 'user-123',
                amount: 250,
                timestamp: '2025-01-01T10:00:00Z'
            };

            const savedEntry = {
                ...waterEntry,
                id: 'water-123',
                created_at: '2025-01-01'
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: savedEntry,
                error: null
            });

            const result = await supabaseService.saveWaterIntake(waterEntry);

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('water_intake');
            expect(result).toEqual(savedEntry);
        });

        test('should get daily water intake', async () => {
            const mockWaterEntries = [
                { id: 'water-1', amount: 250, timestamp: '2025-01-01T08:00:00Z' },
                { id: 'water-2', amount: 300, timestamp: '2025-01-01T10:00:00Z' }
            ];

            const mockQuery = {
                eq: jest.fn(() => mockQuery),
                gte: jest.fn(() => mockQuery),
                lt: jest.fn(() => mockQuery),
                order: jest.fn(() => mockQuery)
            };

            mockSupabaseClient.from().select.mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({
                data: mockWaterEntries,
                error: null
            });

            const result = await supabaseService.getDailyWaterIntake('user-123', '2025-01-01');

            expect(result).toEqual(mockWaterEntries);
        });
    });

    describe('Achievement Operations', () => {
        test('should get user achievements', async () => {
            const mockAchievements = [
                { id: 'ach-1', title: 'First Meal', earned: true },
                { id: 'ach-2', title: 'Week Streak', earned: false }
            ];

            mockSupabaseClient.from().select().eq().order().mockResolvedValue({
                data: mockAchievements,
                error: null
            });

            const result = await supabaseService.getUserAchievements('user-123');

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('achievements');
            expect(result).toEqual(mockAchievements);
        });

        test('should create achievement', async () => {
            const newAchievement = {
                user_id: 'user-123',
                title: 'New Achievement',
                description: 'Achievement description',
                earned: true
            };

            const createdAchievement = {
                ...newAchievement,
                id: 'ach-123',
                created_at: '2025-01-01'
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: createdAchievement,
                error: null
            });

            const result = await supabaseService.createAchievement(newAchievement);

            expect(result).toEqual(createdAchievement);
        });
    });

    describe('Analytics Operations', () => {
        test('should get nutrition summary', async () => {
            const mockSummary = {
                total_calories: 2000,
                total_protein: 100,
                total_carbs: 250,
                total_fat: 70,
                meal_count: 3
            };

            const mockQuery = {
                eq: jest.fn(() => mockQuery),
                gte: jest.fn(() => mockQuery),
                lte: jest.fn(() => mockQuery),
                single: jest.fn()
            };

            mockSupabaseClient.from().select.mockReturnValue(mockQuery);
            mockQuery.single.mockResolvedValue({
                data: mockSummary,
                error: null
            });

            const result = await supabaseService.getNutritionSummary(
                'user-123',
                '2025-01-01',
                '2025-01-07'
            );

            expect(result).toEqual(mockSummary);
        });

        test('should get weekly trends', async () => {
            const mockTrends = [
                { date: '2025-01-01', calories: 2000, weight: 70 },
                { date: '2025-01-02', calories: 1800, weight: 69.8 }
            ];

            const mockQuery = {
                eq: jest.fn(() => mockQuery),
                gte: jest.fn(() => mockQuery),
                lte: jest.fn(() => mockQuery),
                order: jest.fn(() => mockQuery)
            };

            mockSupabaseClient.from().select.mockReturnValue(mockQuery);
            mockQuery.order.mockResolvedValue({
                data: mockTrends,
                error: null
            });

            const result = await supabaseService.getWeeklyTrends('user-123', '2025-01-01');

            expect(result).toEqual(mockTrends);
        });
    });

    describe('File Storage Operations', () => {
        test('should upload meal photo', async () => {
            const mockFile = { uri: 'file://photo.jpg', type: 'image/jpeg' };
            const mockUploadResult = {
                data: { path: 'meals/user-123/photo.jpg' },
                error: null
            };

            mockSupabaseClient.storage.from().upload.mockResolvedValue(mockUploadResult);

            const result = await supabaseService.uploadMealPhoto('user-123', mockFile);

            expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('meal-photos');
            expect(result).toEqual(mockUploadResult.data);
        });

        test('should handle upload error', async () => {
            const mockFile = { uri: 'file://photo.jpg', type: 'image/jpeg' };
            const uploadError = { message: 'Upload failed' };

            mockSupabaseClient.storage.from().upload.mockResolvedValue({
                data: null,
                error: uploadError
            });

            await expect(supabaseService.uploadMealPhoto('user-123', mockFile))
                .rejects.toThrow();

            expect(mockErrorHandler.handleError).toHaveBeenCalledWith(uploadError);
        });
    });

    describe('Error Handling', () => {
        test('should handle database connection errors', async () => {
            mockSupabaseClient.from().select().eq().single.mockRejectedValue(
                new Error('Connection failed')
            );

            await expect(supabaseService.getUserProfile('user-123'))
                .rejects.toThrow();

            expect(mockErrorHandler.handleError).toHaveBeenCalled();
        });

        test('should handle row level security errors', async () => {
            const securityError = {
                code: '42501',
                message: 'Row level security violation'
            };

            mockSupabaseClient.from().select().eq().single.mockResolvedValue({
                data: null,
                error: securityError
            });

            await expect(supabaseService.getUserProfile('user-123'))
                .rejects.toThrow();

            expect(mockErrorHandler.handleError).toHaveBeenCalledWith(securityError);
        });

        test('should handle validation errors', async () => {
            const validationError = {
                code: '23514',
                message: 'Check constraint violation'
            };

            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
                data: null,
                error: validationError
            });

            await expect(supabaseService.createUserProfile({}))
                .rejects.toThrow();

            expect(mockErrorHandler.handleError).toHaveBeenCalledWith(validationError);
        });
    });
});