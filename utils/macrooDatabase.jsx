// Macroo Diet Tracker - Database Service using Supabase
import { TABLES } from '../config/supabase';
import supabase from './supabaseClient';

class MacrooDatabase {
    // ==================== FOOD DATABASE OPERATIONS ====================

    /**
     * Get all foods from database
     * @param {string} userId - Optional user ID to filter custom foods
     * @returns {Array} List of food items
     */
    async getAllFoods(userId = null) {
        try {
            let query = supabase
                .from(TABLES.FOODS)
                .select('*')
                .order('name');

            if (userId) {
                query = query.or(`user_id.eq.${userId},is_custom.eq.false`);
            } else {
                query = query.eq('is_custom', false);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching foods:', error);
            throw error;
        }
    }

    /**
     * Add new food to database
     * @param {Object} foodItem - Food item data
     * @param {string} userId - User ID for custom foods
     */
    async addFood(foodItem, userId = null) {
        try {
            const foodData = {
                name: foodItem.name,
                calories: foodItem.calories,
                protein: foodItem.protein,
                carbs: foodItem.carbs,
                fat: foodItem.fat,
                fiber: foodItem.fiber || 0,
                sugar: foodItem.sugar || 0,
                sodium: foodItem.sodium || 0,
                serving_size: foodItem.serving_size || '100g',
                category: foodItem.category,
                brand: foodItem.brand,
                barcode: foodItem.barcode,
                user_id: userId,
                is_custom: true,
            };

            const { data, error } = await supabase
                .from(TABLES.FOODS)
                .insert([foodData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding food:', error);
            throw error;
        }
    }

    /**
     * Update existing food
     * @param {string} foodId - Food ID to update
     * @param {Object} updates - Updated food data
     */
    async updateFood(foodId, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLES.FOODS)
                .update(updates)
                .eq('id', foodId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating food:', error);
            throw error;
        }
    }

    /**
     * Delete food from database
     * @param {string} foodId - Food ID to delete
     */
    async deleteFood(foodId) {
        try {
            const { error } = await supabase
                .from(TABLES.FOODS)
                .delete()
                .eq('id', foodId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting food:', error);
            throw error;
        }
    }

    // ==================== MEAL TRACKING OPERATIONS ====================

    /**
     * Get all meals for user (no date filter)
     * @param {string} userId - User ID
     */
    async getAllMeals(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_ENTRIES)
                .select(`
          *,
          foods (
            name,
            calories,
            protein,
            carbs,
            fat,
            serving_size
          )
        `)
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all meals:', error);
            throw error;
        }
    }

    /**
     * Get meals for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} userId - User ID
     */
    async getMealsForDate(date, userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_ENTRIES)
                .select(`
          *,
          foods (
            name,
            calories,
            protein,
            carbs,
            fat,
            serving_size
          )
        `)
                .eq('date', date)
                .eq('user_id', userId)
                .order('created_at');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching meals:', error);
            throw error;
        }
    }

    /**
     * Add meal entry
     * @param {Object} mealEntry - Meal entry data
     */
    async addMealEntry(mealEntry) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_ENTRIES)
                .insert([mealEntry])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding meal entry:', error);
            throw error;
        }
    }

    /**
     * Update meal entry
     * @param {string} mealId - Meal entry ID
     * @param {Object} updates - Updated meal data
     */
    async updateMealEntry(mealId, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_ENTRIES)
                .update(updates)
                .eq('id', mealId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating meal entry:', error);
            throw error;
        }
    }

    /**
     * Delete meal entry
     * @param {string} mealId - Meal entry ID to delete
     */
    async deleteMealEntry(mealId) {
        try {
            const { error } = await supabase
                .from(TABLES.MEAL_ENTRIES)
                .delete()
                .eq('id', mealId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting meal entry:', error);
            throw error;
        }
    }

    // ==================== WATER TRACKING OPERATIONS ====================

    /**
     * Get water entries for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} userId - User ID
     */
    async getWaterEntriesForDate(date, userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.WATER_ENTRIES)
                .select('*')
                .eq('date', date)
                .eq('user_id', userId)
                .order('time');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching water entries:', error);
            throw error;
        }
    }

    /**
     * Add water entry
     * @param {Object} waterEntry - Water entry data
     */
    async addWaterEntry(waterEntry) {
        try {
            const { data, error } = await supabase
                .from(TABLES.WATER_ENTRIES)
                .insert([waterEntry])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding water entry:', error);
            throw error;
        }
    }

    // ==================== USER PROFILE OPERATIONS ====================

    /**
     * Get user profile
     * @param {string} userId - User ID
     */
    async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.USER_PROFILES)
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

            // Convert snake_case fields to camelCase for app
            if (data) {
                if (data.activity_level) {
                    data.activityLevel = data.activity_level;
                    delete data.activity_level;
                }
                if (data.daily_calorie_target) {
                    data.dailyCaloriesTarget = data.daily_calorie_target;
                    delete data.daily_calorie_target;
                }
                if (data.daily_protein_target) {
                    data.dailyProteinTarget = data.daily_protein_target;
                    delete data.daily_protein_target;
                }
                if (data.daily_carbs_target) {
                    data.dailyCarbsTarget = data.daily_carbs_target;
                    delete data.daily_carbs_target;
                }
                if (data.daily_fat_target) {
                    data.dailyFatTarget = data.daily_fat_target;
                    delete data.daily_fat_target;
                }
                if (data.daily_water_target) {
                    data.dailyWaterTarget = data.daily_water_target;
                    delete data.daily_water_target;
                }
            }

            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Create or update user profile
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile data
     */
    async saveUserProfile(userId, profileData) {
        try {
            // Convert camelCase fields to snake_case for database
            const dbProfileData = {
                user_id: userId,
                ...profileData
            };

            // Handle camelCase to snake_case conversion
            if (profileData.activityLevel) {
                dbProfileData.activity_level = profileData.activityLevel;
                delete dbProfileData.activityLevel;
            }
            if (profileData.dailyCaloriesTarget) {
                dbProfileData.daily_calorie_target = profileData.dailyCaloriesTarget;
                delete dbProfileData.dailyCaloriesTarget;
            }
            if (profileData.dailyProteinTarget) {
                dbProfileData.daily_protein_target = profileData.dailyProteinTarget;
                delete dbProfileData.dailyProteinTarget;
            }
            if (profileData.dailyCarbsTarget) {
                dbProfileData.daily_carbs_target = profileData.dailyCarbsTarget;
                delete dbProfileData.dailyCarbsTarget;
            }
            if (profileData.dailyFatTarget) {
                dbProfileData.daily_fat_target = profileData.dailyFatTarget;
                delete dbProfileData.dailyFatTarget;
            }
            if (profileData.dailyWaterTarget) {
                dbProfileData.daily_water_target = profileData.dailyWaterTarget;
                delete dbProfileData.dailyWaterTarget;
            }

            const { data, error } = await supabase
                .from(TABLES.USER_PROFILES)
                .upsert(dbProfileData)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error saving user profile:', error);
            throw error;
        }
    }

    // ==================== ANALYTICS OPERATIONS ====================

    /**
     * Get nutrition summary for date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {string} userId - User ID
     */
    async getNutritionSummary(startDate, endDate, userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_ENTRIES)
                .select(`
          date,
          meal_type,
          quantity,
          foods (
            calories,
            protein,
            carbs,
            fat
          )
        `)
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching nutrition summary:', error);
            throw error;
        }
    }

    // ==================== MEAL TEMPLATE OPERATIONS ====================

    /**
     * Save meal template
     */
    async saveMealTemplate(template) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_TEMPLATES)
                .insert([{
                    user_id: template.user_id,
                    name: template.name,
                    meal_type: template.meal_type || 'breakfast',
                    foods: template.foods || [],
                    total_calories: template.total_calories || 0,
                    total_protein: template.total_protein || 0,
                    total_carbs: template.total_carbs || 0,
                    total_fat: template.total_fat || 0,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error saving meal template:', error);
            throw error;
        }
    }

    /**
     * Get meal templates for user
     */
    async getMealTemplates(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.MEAL_TEMPLATES)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching meal templates:', error);
            throw error;
        }
    }

    /**
     * Delete meal template
     */
    async deleteMealTemplate(templateId) {
        try {
            const { error } = await supabase
                .from(TABLES.MEAL_TEMPLATES)
                .delete()
                .eq('id', templateId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting meal template:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new MacrooDatabase();