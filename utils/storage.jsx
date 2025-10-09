import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateFood } from '../types/index';

const FOOD_DB_KEY = 'food_database';
const MEAL_DB_KEY = 'meal_entries';
const WATER_DB_KEY = 'water_entries';
const PROFILE_KEY = 'user_profile';
const MEAL_TEMPLATES_KEY = 'meal_templates';
const ACHIEVEMENTS_KEY = 'achievements';
const CHALLENGES_KEY = 'weekly_challenges';
const CUSTOM_TARGETS_KEY = 'custom_macro_targets';
const PREFERENCES_KEY = 'user_preferences';

// Generic error handling wrapper
const handleStorageOperation = async (operation, fallback = null) => {
    try {
        return await operation();
    } catch (error) {
        console.error('Storage operation failed:', error);
        return fallback;
    }
};

// Enhanced data validation
const validateAndSanitizeData = (data, validator) => {
    if (validator) {
        const validation = validator(data);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
    }
    return data;
};

// Save a new food item to the food database
export const saveFoodToDatabase = async (foodItem) => {
    return handleStorageOperation(async () => {
        // Validate food data
        const validatedFood = validateAndSanitizeData(foodItem, validateFood);

        const existingData = await AsyncStorage.getItem(FOOD_DB_KEY);
        let foods = existingData ? JSON.parse(existingData) : [];

        // Check for duplicates
        const alreadyExists = foods.some(f => f.name.toLowerCase() === validatedFood.name.toLowerCase());
        if (alreadyExists) {
            throw new Error('Food already exists in database');
        }

        // Add metadata
        const enrichedFood = {
            ...validatedFood,
            id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            category: validatedFood.category || 'other',
        };

        foods.push(enrichedFood);
        await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(foods));

        return enrichedFood;
    }, null);
};

// Get all foods from the database
export const getFoodDatabase = async () => {
    try {
        const data = await AsyncStorage.getItem(FOOD_DB_KEY);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Failed to load food database:', err);
        return [];
    }
};

// Backwards-compatible alias: some files import getFoodList
export const getFoodList = getFoodDatabase;

// Enhanced Food Search Functions (MyFitnessPal-inspired)
export const searchFoodsEnhanced = async (query, options = {}) => {
    const { limit = 20, includeRecent = true, includeSources = ['local'] } = options;

    try {
        const results = [];

        // 1. Search local database first (fastest)
        if (includeSources.includes('local')) {
            const localDatabase = await getFoodDatabase();
            const localResults = localDatabase
                .filter(food =>
                    food.name.toLowerCase().includes(query.toLowerCase()) ||
                    food.brand?.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, Math.min(10, limit))
                .map(food => ({ ...food, source: 'Local', priority: 1 }));

            results.push(...localResults);
        }

        // 2. Search recent foods if enabled
        if (includeRecent && includeSources.includes('recent')) {
            const recentFoods = await getRecentFoods();
            const recentResults = recentFoods
                .filter(food =>
                    food.name.toLowerCase().includes(query.toLowerCase()) &&
                    !results.some(r => r.name.toLowerCase() === food.name.toLowerCase())
                )
                .slice(0, Math.min(5, limit - results.length))
                .map(food => ({ ...food, source: 'Recent', priority: 2 }));

            results.push(...recentResults);
        }

        // 3. If we have external API access, search those
        if (results.length < limit && includeSources.includes('external')) {
            try {
                const { searchFoodsMultiSource } = require('./foodDatabaseSources');
                const externalResults = await searchFoodsMultiSource(query, {
                    limit: limit - results.length
                });
                results.push(...externalResults.map(food => ({ ...food, priority: 3 })));
            } catch (error) {
                console.log('External API search not available:', error.message);
            }
        }

        // Sort by priority and relevance
        return results
            .sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;

                // Exact matches first
                const aExact = a.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
                const bExact = b.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
                if (aExact !== bExact) return bExact - aExact;

                // Then starts with query  
                const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
                const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
                return bStarts - aStarts;
            })
            .slice(0, limit);

    } catch (error) {
        console.error('Enhanced food search failed:', error);
        // Fallback to basic local search
        const localDatabase = await getFoodDatabase();
        return localDatabase
            .filter(food => food.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit)
            .map(food => ({ ...food, source: 'Local' }));
    }
};

// Recent foods management
export const saveRecentFood = async (food) => {
    try {
        const recentFoods = await getRecentFoods();
        const updatedRecent = [
            food,
            ...recentFoods.filter(f => f.name !== food.name)
        ].slice(0, 20); // Keep last 20 recent foods

        await AsyncStorage.setItem('recent_foods', JSON.stringify(updatedRecent));
    } catch (error) {
        console.error('Failed to save recent food:', error);
    }
};

export const getRecentFoods = async () => {
    try {
        const data = await AsyncStorage.getItem('recent_foods');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to get recent foods:', error);
        return [];
    }
};

// Save enhanced food database
export const saveFoodDatabase = async (foods) => {
    try {
        await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(foods));
        return true;
    } catch (error) {
        console.error('Failed to save food database:', error);
        return false;
    }
};

// Update a food by name (replace)
export const updateFood = async (oldName, newFood) => {
    try {
        const existingData = await AsyncStorage.getItem(FOOD_DB_KEY);
        let foods = existingData ? JSON.parse(existingData) : [];
        foods = foods.map(f => (f.name === oldName ? newFood : f));
        await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(foods));
    } catch (err) {
        console.error('Failed to update food:', err);
    }
};

export const deleteFood = async (name) => {
    try {
        const existingData = await AsyncStorage.getItem(FOOD_DB_KEY);
        let foods = existingData ? JSON.parse(existingData) : [];
        const remaining = [];
        let removed = null;
        for (const f of foods) {
            if (f.name === name && !removed) {
                removed = f;
            } else {
                remaining.push(f);
            }
        }
        await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(remaining));
        return removed;
    } catch (err) {
        console.error('Failed to delete food:', err);
        return null;
    }
};

// Save a meal entry
export const saveMealEntry = async (meal) => {
    try {
        const existingData = await AsyncStorage.getItem(MEAL_DB_KEY);
        let meals = existingData ? JSON.parse(existingData) : [];

        const newMeal = {
            ...meal,
            timestamp: new Date().toISOString(),
        };

        meals.push(newMeal);
        await AsyncStorage.setItem(MEAL_DB_KEY, JSON.stringify(meals));
    } catch (err) {
        console.error('Failed to save meal entry:', err);
    }
};

// Get all meals
export const getMeals = async () => {
    try {
        const data = await AsyncStorage.getItem(MEAL_DB_KEY);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Failed to load meals:', err);
        return [];
    }
};

// Clear all meals (optional utility)
export const clearMeals = async () => {
    try {
        await AsyncStorage.removeItem(MEAL_DB_KEY);
    } catch (err) {
        console.error('Failed to clear meals:', err);
    }
};

export const deleteMeal = async (timestamp) => {
    try {
        const existing = await AsyncStorage.getItem(MEAL_DB_KEY);
        const meals = existing ? JSON.parse(existing) : [];
        const remaining = [];
        let removed = null;
        for (const m of meals) {
            if (m.timestamp === timestamp && !removed) removed = m;
            else remaining.push(m);
        }
        await AsyncStorage.setItem(MEAL_DB_KEY, JSON.stringify(remaining));
        return removed;
    } catch (err) {
        console.error('Failed to delete meal:', err);
        return null;
    }
};

export const updateMeal = async (timestamp, updatedMeal) => {
    try {
        const existing = await AsyncStorage.getItem(MEAL_DB_KEY);
        const meals = existing ? JSON.parse(existing) : [];
        const mapped = meals.map(m => (m.timestamp === timestamp ? { ...m, ...updatedMeal } : m));
        await AsyncStorage.setItem(MEAL_DB_KEY, JSON.stringify(mapped));
    } catch (err) {
        console.error('Failed to update meal:', err);
    }
};

// Save a water intake entry (amount in ml)
export const saveWaterEntry = async (amountMl) => {
    try {
        const existing = await AsyncStorage.getItem(WATER_DB_KEY);
        const entries = existing ? JSON.parse(existing) : [];

        const newEntry = {
            amount: Number(amountMl),
            timestamp: new Date().toISOString(),
        };

        entries.push(newEntry);
        await AsyncStorage.setItem(WATER_DB_KEY, JSON.stringify(entries));
    } catch (err) {
        console.error('Failed to save water entry:', err);
    }
};

// Get all water entries
export const getWaterEntries = async () => {
    try {
        const data = await AsyncStorage.getItem(WATER_DB_KEY);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('Failed to load water entries:', err);
        return [];
    }
};

// Profile helpers
export const saveProfile = async (profile) => {
    try {
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (err) {
        console.error('Failed to save profile:', err);
    }
};

export const getProfile = async () => {
    try {
        const data = await AsyncStorage.getItem(PROFILE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Failed to load profile:', err);
        return null;
    }
};

// Simple BMR-based calorie suggestion (Mifflin-St Jeor)
export const suggestCalories = (profile) => {
    if (!profile) return null;
    const { weightKg, heightCm, age, gender, activityLevel, goal } = profile;
    if (!weightKg || !heightCm || !age) return null;

    let bmr;
    if (gender === 'female') {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    } else {
        bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    }

    const activityFactor = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
    }[activityLevel] || 1.2;

    let maintenance = Math.round(bmr * activityFactor);
    if (goal === 'lose') maintenance = Math.max(1200, maintenance - 500);
    if (goal === 'gain') maintenance = maintenance + 300;

    return maintenance;
};

// Meal Templates
export const saveMealTemplate = async (template) => {
    return handleStorageOperation(async () => {
        const existingData = await AsyncStorage.getItem(MEAL_TEMPLATES_KEY);
        let templates = existingData ? JSON.parse(existingData) : [];

        const newTemplate = {
            ...template,
            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
        };

        templates.push(newTemplate);
        await AsyncStorage.setItem(MEAL_TEMPLATES_KEY, JSON.stringify(templates));
        return newTemplate;
    }, null);
};

export const getMealTemplates = async () => {
    return handleStorageOperation(async () => {
        const data = await AsyncStorage.getItem(MEAL_TEMPLATES_KEY);
        return data ? JSON.parse(data) : [];
    }, []);
};

export const deleteMealTemplate = async (templateId) => {
    return handleStorageOperation(async () => {
        const existingData = await AsyncStorage.getItem(MEAL_TEMPLATES_KEY);
        let templates = existingData ? JSON.parse(existingData) : [];

        const filteredTemplates = templates.filter(t => t.id !== templateId);
        await AsyncStorage.setItem(MEAL_TEMPLATES_KEY, JSON.stringify(filteredTemplates));

        return true;
    }, false);
};

// Achievements
export const getAchievements = async () => {
    return handleStorageOperation(async () => {
        const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
        return data ? JSON.parse(data) : [];
    }, []);
};

export const updateAchievement = async (achievementId, progress) => {
    return handleStorageOperation(async () => {
        const achievements = await getAchievements();
        const updatedAchievements = achievements.map(achievement => {
            if (achievement.id === achievementId) {
                const newProgress = Math.min(progress, achievement.target);
                const wasUnlocked = achievement.unlockedAt;

                return {
                    ...achievement,
                    progress: newProgress,
                    unlockedAt: !wasUnlocked && newProgress >= achievement.target
                        ? new Date().toISOString()
                        : achievement.unlockedAt,
                };
            }
            return achievement;
        });

        await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updatedAchievements));
        return updatedAchievements;
    }, []);
};

// Weekly Challenges
export const getWeeklyChallenges = async () => {
    return handleStorageOperation(async () => {
        const data = await AsyncStorage.getItem(CHALLENGES_KEY);
        return data ? JSON.parse(data) : [];
    }, []);
};

export const updateChallengeProgress = async (challengeId, progress) => {
    return handleStorageOperation(async () => {
        const challenges = await getWeeklyChallenges();
        const updatedChallenges = challenges.map(challenge => {
            if (challenge.id === challengeId) {
                return {
                    ...challenge,
                    progress: Math.min(progress, challenge.target),
                };
            }
            return challenge;
        });

        await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(updatedChallenges));
        return updatedChallenges;
    }, []);
};

// Custom Macro Targets
export const saveCustomMacroTargets = async (targets) => {
    return handleStorageOperation(async () => {
        await AsyncStorage.setItem(CUSTOM_TARGETS_KEY, JSON.stringify(targets));
        return targets;
    }, null);
};

export const getCustomMacroTargets = async () => {
    return handleStorageOperation(async () => {
        const data = await AsyncStorage.getItem(CUSTOM_TARGETS_KEY);
        return data ? JSON.parse(data) : null;
    }, null);
};

// Search and filtering
export const searchFoods = async (query) => {
    return handleStorageOperation(async () => {
        const foods = await getFoodDatabase();
        if (!query || query.trim() === '') return foods;

        const searchTerm = query.toLowerCase().trim();
        return foods.filter(food =>
            food.name.toLowerCase().includes(searchTerm) ||
            (food.category && food.category.toLowerCase().includes(searchTerm))
        );
    }, []);
};

// Export functionality
export const exportUserData = async () => {
    return handleStorageOperation(async () => {
        const [foods, meals, waterEntries, profile, templates, achievements] = await Promise.all([
            getFoodDatabase(),
            getMeals(),
            getWaterEntries(),
            getProfile(),
            getMealTemplates(),
            getAchievements(),
        ]);

        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
                foods,
                meals,
                waterEntries,
                profile,
                templates,
                achievements,
            },
        };
    }, null);
};

// Import functionality
export const importUserData = async (importData) => {
    return handleStorageOperation(async () => {
        if (!importData?.data) {
            throw new Error('Invalid import data format');
        }

        const { foods, meals, waterEntries, profile, templates, achievements } = importData.data;

        // Import each data type
        if (foods) await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(foods));
        if (meals) await AsyncStorage.setItem(MEAL_DB_KEY, JSON.stringify(meals));
        if (waterEntries) await AsyncStorage.setItem(WATER_DB_KEY, JSON.stringify(waterEntries));
        if (profile) await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        if (templates) await AsyncStorage.setItem(MEAL_TEMPLATES_KEY, JSON.stringify(templates));
        if (achievements) await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));

        return true;
    }, false);
};