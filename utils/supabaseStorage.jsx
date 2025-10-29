// Macroo Diet Tracker - Supabase Storage Service
// This replaces the AsyncStorage-based storage with Supabase
import { validateFood } from '../types/index';
import macrooDatabase from './macrooDatabase';

// For now, we'll use a demo user ID. In a real app, this would come from authentication
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'; // Demo user UUID

// ==================== FOOD DATABASE FUNCTIONS ====================

export const saveFoodToDatabase = async (foodItem) => {
    try {
        // Validate food data
        const validation = validateFood(foodItem);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Add food to Supabase
        const savedFood = await macrooDatabase.addFood(foodItem, DEMO_USER_ID);
        return savedFood;
    } catch (error) {
        console.error('❌ Error saving food to Supabase:', error);
        throw error;
    }
};

export const getFoodDatabase = async () => {
    try {
        const foods = await macrooDatabase.getAllFoods(DEMO_USER_ID);
        return foods;
    } catch (error) {
        console.error('❌ Error loading food database:', error);
        return [];
    }
};

export const updateFoodInDatabase = async (foodId, updatedFood) => {
    try {
        const updated = await macrooDatabase.updateFood(foodId, updatedFood);
        return updated;
    } catch (error) {
        console.error('❌ Error updating food:', error);
        throw error;
    }
};

export const deleteFoodFromDatabase = async (foodId) => {
    try {
        await macrooDatabase.deleteFood(foodId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting food:', error);
        throw error;
    }
};

// ==================== MEAL TRACKING FUNCTIONS ====================

export const saveMeal = async (mealEntry) => {
    try {
        // Convert meal entry format for Supabase
        const supabaseMeal = {
            user_id: DEMO_USER_ID,
            food_id: mealEntry.foodId, // Assumes food is already in Supabase with ID
            meal_type: mealEntry.mealType || 'snack',
            quantity: mealEntry.quantity || 1,
            serving_size: mealEntry.servingSize,
            date: mealEntry.date,
            notes: mealEntry.notes,
        };

        const savedMeal = await macrooDatabase.addMealEntry(supabaseMeal);
        return savedMeal;
    } catch (error) {
        console.error('❌ Error saving meal:', error);
        throw error;
    }
};

export const getMeals = async (date = null) => {
    try {
        let meals;
        if (date) {
            meals = await macrooDatabase.getMealsForDate(date, DEMO_USER_ID);
        } else {
            meals = await macrooDatabase.getAllMeals(DEMO_USER_ID);
        }

        // Convert Supabase meal format to app format
        const convertedMeals = meals.map(meal => ({
            id: meal.id,
            foodId: meal.food_id,
            foodName: meal.foods?.name || 'Unknown Food',
            mealType: meal.meal_type,
            quantity: meal.quantity,
            servingSize: meal.serving_size,
            date: meal.date,
            notes: meal.notes,
            calories: Math.round((meal.foods?.calories || 0) * meal.quantity / 100),
            protein: Math.round(((meal.foods?.protein || 0) * meal.quantity / 100) * 10) / 10,
            carbs: Math.round(((meal.foods?.carbs || 0) * meal.quantity / 100) * 10) / 10,
            fat: Math.round(((meal.foods?.fat || 0) * meal.quantity / 100) * 10) / 10,
        }));

        return convertedMeals;
    } catch (error) {
        console.error('❌ Error loading meals:', error);
        return [];
    }
};

export const deleteMeal = async (mealId) => {
    try {
        await macrooDatabase.deleteMealEntry(mealId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting meal:', error);
        throw error;
    }
};

// ==================== WATER TRACKING FUNCTIONS ====================

export const saveWaterEntry = async (waterEntry) => {
    try {
        // Validate required fields
        if (!waterEntry.amount || isNaN(waterEntry.amount) || waterEntry.amount <= 0) {
            throw new Error('Invalid water amount. Must be a positive number.');
        }

        const supabaseWater = {
            user_id: DEMO_USER_ID,
            amount: parseInt(waterEntry.amount), // Ensure it's an integer
            date: waterEntry.date || new Date().toISOString().split('T')[0], // Default to today if not provided
            time: waterEntry.time || new Date().toTimeString().split(' ')[0],
        };

        const saved = await macrooDatabase.addWaterEntry(supabaseWater);
        return saved;
    } catch (error) {
        console.error('❌ Error saving water entry:', error);
        throw error;
    }
};

export const getWaterEntries = async (date = null) => {
    try {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const entries = await macrooDatabase.getWaterEntriesForDate(targetDate, DEMO_USER_ID);
        console.log(`✅ Loaded ${entries.length} water entries from Supabase`);

        return entries;
    } catch (error) {
        console.error('❌ Error loading water entries:', error);
        return [];
    }
};

// ==================== PROFILE FUNCTIONS ====================

export const saveProfile = async (profileData) => {
    try {
        const saved = await macrooDatabase.saveUserProfile(DEMO_USER_ID, profileData);
        return saved;
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        throw error;
    }
};

export const getProfile = async () => {
    try {
        const profile = await macrooDatabase.getUserProfile(DEMO_USER_ID);
        return profile;
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        return null;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Find food by name in Supabase and return its ID
 * This is needed when adding meals since we need food IDs
 */
export const findFoodByName = async (foodName) => {
    try {
        const foods = await getFoodDatabase();
        const food = foods.find(f => f.name.toLowerCase() === foodName.toLowerCase());
        return food;
    } catch (error) {
        console.error('❌ Error finding food by name:', error);
        return null;
    }
};

/**
 * Get nutrition summary for a date range
 */
export const getNutritionSummary = async (startDate, endDate) => {
    try {
        console.log('📊 Loading nutrition summary from Supabase');

        const summary = await macrooDatabase.getNutritionSummary(startDate, endDate, DEMO_USER_ID);
        return summary;
    } catch (error) {
        console.error('❌ Error loading nutrition summary:', error);
        return [];
    }
};

/**
 * Search foods by query string
 */
export const searchFoods = async (query) => {
    try {
        const foods = await getFoodDatabase();
        return foods.filter(food =>
            food.name.toLowerCase().includes(query.toLowerCase())
        );
    } catch (error) {
        console.error('❌ Error searching foods:', error);
        return [];
    }
};

/**
 * Update meal entry
 */
export const updateMeal = async (mealId, updatedMeal) => {
    try {
        console.log('🔄 Updating meal in Supabase:', mealId);
        const updated = await macrooDatabase.updateMealEntry(mealId, updatedMeal);
        return updated;
    } catch (error) {
        console.error('❌ Error updating meal:', error);
        throw error;
    }
};

/**
 * Save meal template
 */
export const saveMealTemplate = async (template) => {
    try {
        console.log('💾 Saving meal template to Supabase:', template);
        const saved = await macrooDatabase.saveMealTemplate({
            ...template,
            user_id: DEMO_USER_ID
        });
        return saved;
    } catch (error) {
        console.error('❌ Error saving meal template:', error);
        throw error;
    }
};

/**
 * Get meal templates
 */
export const getMealTemplates = async () => {
    try {
        console.log('📋 Loading meal templates from Supabase');
        const templates = await macrooDatabase.getMealTemplates(DEMO_USER_ID);
        console.log('✅ Meal templates loaded:', templates.length);
        return templates;
    } catch (error) {
        console.error('❌ Error loading meal templates:', error);
        return [];
    }
};

/**
 * Delete meal template
 */
export const deleteMealTemplate = async (templateId) => {
    try {
        await macrooDatabase.deleteMealTemplate(templateId);
    } catch (error) {
        console.error('❌ Error deleting meal template:', error);
        throw error;
    }
};

/**
 * Get custom macro targets
 */
export const getCustomMacroTargets = async () => {
    try {
        console.log('🎯 Loading custom macro targets from Supabase');
        const profile = await getProfile();
        if (profile && profile.dailyCaloriesTarget) {
            return {
                calories: profile.dailyCaloriesTarget,
                protein: profile.dailyProteinTarget || 0,
                carbs: profile.dailyCarbsTarget || 0,
                fat: profile.dailyFatTarget || 0
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Error loading custom macro targets:', error);
        return null;
    }
};

/**
 * Suggest calories based on profile
 */
export const suggestCalories = (profile) => {
    if (!profile) return 2000;

    // Basic BMR calculation using Mifflin-St Jeor Equation
    let bmr;
    if (profile.gender === 'male') {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extremely_active: 1.9
    };

    const multiplier = activityMultipliers[profile.activity_level] || 1.55;
    let calories = bmr * multiplier;

    // Adjust based on goal
    if (profile.goal === 'lose_weight') {
        calories *= 0.85; // 15% deficit
    } else if (profile.goal === 'gain_weight') {
        calories *= 1.15; // 15% surplus
    }

    return Math.round(calories);
};

// Export demo user ID for other components that might need it
export { DEMO_USER_ID };



