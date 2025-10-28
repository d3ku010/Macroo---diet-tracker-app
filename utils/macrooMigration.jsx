// Macroo Diet Tracker - Migration from AsyncStorage to Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';
import macrooDatabase from './macrooDatabase';

const STORAGE_KEYS = {
    FOOD_DB_KEY: 'food_database',
    MEAL_DB_KEY: 'meal_entries',
    WATER_DB_KEY: 'water_entries',
    PROFILE_KEY: 'user_profile',
    MEAL_TEMPLATES_KEY: 'meal_templates',
    ACHIEVEMENTS_KEY: 'achievements',
    CHALLENGES_KEY: 'weekly_challenges',
};

class MacrooMigration {
    /**
     * Migrate all data from AsyncStorage to Supabase
     * @param {string} userId - User ID for Supabase records
     */
    async migrateAllData(userId) {
        console.log('🚀 Starting Macroo data migration to Supabase...');

        try {
            // Ensure user exists in users table first
            await this.ensureUserExists(userId);

            // Migrate foods first (needed for meal entries)
            await this.migrateFoods(userId);

            // Then migrate meals (depends on foods)
            await this.migrateMeals(userId);

            // Migrate water entries
            await this.migrateWaterEntries(userId);

            // Migrate user profile
            await this.migrateUserProfile(userId);

            console.log('✅ Migration completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    /**
     * Ensure user exists in users table
     * @param {string} userId - User ID
     */
    async ensureUserExists(userId) {
        try {
            const { data: existingUser } = await macrooDatabase.supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .single();

            if (!existingUser) {
                console.log('Creating user record...');
                const { error } = await macrooDatabase.supabase
                    .from('users')
                    .insert([{
                        id: userId,
                        name: 'Migration User',
                        email: null
                    }]);

                if (error && !error.message.includes('duplicate')) {
                    throw error;
                }
            }
        } catch (error) {
            if (!error.message.includes('Row not found') && !error.message.includes('duplicate')) {
                throw error;
            }
        }
    }

    /**
     * Migrate food database
     */
    async migrateFoods(userId) {
        try {
            console.log('📦 Migrating food database...');

            const foodsData = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_DB_KEY);
            if (!foodsData) {
                console.log('No food data found in AsyncStorage');
                return;
            }

            const foods = JSON.parse(foodsData);
            console.log(`Found ${foods.length} foods to migrate`);

            for (const food of foods) {
                try {
                    // Validate and clean food data
                    const cleanFood = {
                        name: food.name || 'Unknown Food',
                        calories: parseInt(food.calories) || 0,
                        protein: parseFloat(food.protein) || 0,
                        carbs: parseFloat(food.carbs) || 0,
                        fat: parseFloat(food.fat) || 0,
                        fiber: parseFloat(food.fiber) || 0,
                        sugar: parseFloat(food.sugar) || 0,
                        sodium: parseFloat(food.sodium) || 0,
                        serving_size: food.serving_size || '100g',
                        category: food.category || 'other',
                        brand: food.brand || null,
                        barcode: food.barcode || null,
                    };

                    await macrooDatabase.addFood(cleanFood, userId);
                    console.log(`✓ Migrated food: ${cleanFood.name}`);
                } catch (error) {
                    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
                        console.log(`⚠️ Food already exists: ${food.name}`);
                    } else {
                        console.error(`❌ Failed to migrate food: ${food.name}`, error.message);
                    }
                }
            }

            console.log('✅ Food database migration completed');
        } catch (error) {
            console.error('Error migrating foods:', error);
            throw error;
        }
    }

    /**
     * Migrate meal entries
     */
    async migrateMeals(userId) {
        try {
            console.log('🍽️ Migrating meal entries...');

            const mealsData = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_DB_KEY);
            if (!mealsData) {
                console.log('No meal data found in AsyncStorage');
                return;
            }

            const meals = JSON.parse(mealsData);
            console.log(`Found ${meals.length} meal entries to migrate`);

            // Get all foods from Supabase to map meal entries
            const supabaseFoods = await macrooDatabase.getAllFoods(userId);
            const foodMap = {};
            supabaseFoods.forEach(food => {
                foodMap[food.name.toLowerCase()] = food.id;
            });

            for (const meal of meals) {
                try {
                    console.log('Processing meal entry:', meal);
                    const foodName = meal.foodName || meal.food_name || meal.name || meal.food || meal.item;
                    if (!foodName) {
                        console.log(`⚠️ Meal entry missing food name, skipping:`, meal);
                        continue;
                    }

                    const foodId = foodMap[foodName.toLowerCase()];
                    if (!foodId) {
                        console.log(`⚠️ Food not found for meal: ${foodName}`);
                        continue;
                    }

                    // Validate meal type against database constraints
                    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
                    let mealType = meal.mealType || meal.meal_type || 'snack';
                    if (!validMealTypes.includes(mealType)) {
                        mealType = 'snack';
                    }

                    // Ensure date is in proper format
                    let mealDate = meal.date;
                    if (mealDate && typeof mealDate === 'string') {
                        // Convert various date formats to YYYY-MM-DD
                        const dateObj = new Date(mealDate);
                        if (!isNaN(dateObj.getTime())) {
                            mealDate = dateObj.toISOString().split('T')[0];
                        } else {
                            mealDate = new Date().toISOString().split('T')[0];
                        }
                    } else {
                        mealDate = new Date().toISOString().split('T')[0];
                    }

                    const mealEntry = {
                        user_id: userId,
                        food_id: foodId,
                        meal_type: mealType,
                        quantity: parseFloat(meal.quantity) || 1,
                        serving_size: meal.servingSize || meal.serving_size || '100g',
                        date: mealDate,
                        notes: meal.notes || null,
                    };

                    await macrooDatabase.addMealEntry(mealEntry);
                    console.log(`✓ Migrated meal: ${foodName} (${mealDate})`);
                } catch (error) {
                    console.error(`❌ Failed to migrate meal: ${meal.foodName || 'unknown'}`, error.message);
                }
            }

            console.log('✅ Meal entries migration completed');
        } catch (error) {
            console.error('Error migrating meals:', error);
            throw error;
        }
    }

    /**
     * Migrate water entries
     */
    async migrateWaterEntries(userId) {
        try {
            console.log('💧 Migrating water entries...');

            const waterData = await AsyncStorage.getItem(STORAGE_KEYS.WATER_DB_KEY);
            if (!waterData) {
                console.log('No water data found in AsyncStorage');
                return;
            }

            const waterEntries = JSON.parse(waterData);
            console.log(`Found ${waterEntries.length} water entries to migrate`);

            for (const entry of waterEntries) {
                try {
                    // Validate and clean water entry data
                    let entryDate = entry.date;
                    if (entryDate && typeof entryDate === 'string') {
                        const dateObj = new Date(entryDate);
                        if (!isNaN(dateObj.getTime())) {
                            entryDate = dateObj.toISOString().split('T')[0];
                        } else {
                            entryDate = new Date().toISOString().split('T')[0];
                        }
                    } else {
                        entryDate = new Date().toISOString().split('T')[0];
                    }

                    let entryTime = entry.time;
                    if (entryTime && typeof entryTime === 'string') {
                        // Validate time format (HH:MM:SS or HH:MM)
                        if (!/^\d{2}:\d{2}(:\d{2})?$/.test(entryTime)) {
                            entryTime = new Date().toTimeString().split(' ')[0];
                        } else if (entryTime.length === 5) {
                            entryTime += ':00'; // Add seconds if missing
                        }
                    } else {
                        entryTime = new Date().toTimeString().split(' ')[0];
                    }

                    const waterEntry = {
                        user_id: userId,
                        amount: parseInt(entry.amount) || 250, // Default to 250ml if invalid
                        date: entryDate,
                        time: entryTime,
                    };

                    await macrooDatabase.addWaterEntry(waterEntry);
                    console.log(`✓ Migrated water entry: ${waterEntry.amount}ml (${entryDate})`);
                } catch (error) {
                    console.error(`❌ Failed to migrate water entry:`, error.message);
                }
            }

            console.log('✅ Water entries migration completed');
        } catch (error) {
            console.error('Error migrating water entries:', error);
            throw error;
        }
    }

    /**
     * Migrate user profile
     */
    async migrateUserProfile(userId) {
        try {
            console.log('👤 Migrating user profile...');

            const profileData = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_KEY);
            if (!profileData) {
                console.log('No profile data found in AsyncStorage');
                return;
            }

            const profile = JSON.parse(profileData);
            console.log('Profile data from AsyncStorage:', profile);

            // Clean and map profile data to match database schema
            const cleanProfile = {
                name: profile.name || null,
                height: parseInt(profile.height) || null,
                weight: parseFloat(profile.weight) || null,
                age: parseInt(profile.age) || null,
                gender: profile.gender || null,
                activity_level: profile.activityLevel || profile.activity_level || null,
                goal: profile.goal || null,
                daily_calorie_target: parseInt(profile.dailyCalorieTarget) || parseInt(profile.daily_calorie_target) || null,
                daily_protein_target: parseFloat(profile.dailyProteinTarget) || parseFloat(profile.daily_protein_target) || null,
                daily_carbs_target: parseFloat(profile.dailyCarbsTarget) || parseFloat(profile.daily_carbs_target) || null,
                daily_fat_target: parseFloat(profile.dailyFatTarget) || parseFloat(profile.daily_fat_target) || null,
                daily_water_target: parseInt(profile.dailyWaterGoalMl) || parseInt(profile.dailyWaterTarget) || parseInt(profile.daily_water_target) || 2000,
            };

            await macrooDatabase.saveUserProfile(userId, cleanProfile);

            console.log('✅ User profile migration completed');
        } catch (error) {
            console.error('Error migrating user profile:', error);
            throw error;
        }
    }

    /**
     * Clear AsyncStorage after successful migration
     */
    async clearAsyncStorageData() {
        try {
            console.log('🧹 Clearing old AsyncStorage data...');

            await AsyncStorage.multiRemove([
                STORAGE_KEYS.FOOD_DB_KEY,
                STORAGE_KEYS.MEAL_DB_KEY,
                STORAGE_KEYS.WATER_DB_KEY,
                STORAGE_KEYS.PROFILE_KEY,
                STORAGE_KEYS.MEAL_TEMPLATES_KEY,
                STORAGE_KEYS.ACHIEVEMENTS_KEY,
                STORAGE_KEYS.CHALLENGES_KEY,
            ]);

            console.log('✅ AsyncStorage data cleared');
        } catch (error) {
            console.error('Error clearing AsyncStorage:', error);
            throw error;
        }
    }

    /**
     * Check if migration is needed
     */
    async isMigrationNeeded() {
        try {
            const foodsData = await AsyncStorage.getItem(STORAGE_KEYS.FOOD_DB_KEY);
            const mealsData = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_DB_KEY);

            return !!(foodsData || mealsData);
        } catch (error) {
            console.error('Error checking migration status:', error);
            return false;
        }
    }
}

export default new MacrooMigration();