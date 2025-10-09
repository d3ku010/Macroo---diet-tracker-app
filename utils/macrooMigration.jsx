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
                    await macrooDatabase.addFood(food, userId);
                    console.log(`✓ Migrated food: ${food.name}`);
                } catch (error) {
                    if (error.message?.includes('duplicate')) {
                        console.log(`⚠️ Food already exists: ${food.name}`);
                    } else {
                        console.error(`❌ Failed to migrate food: ${food.name}`, error);
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
                    const foodId = foodMap[meal.foodName?.toLowerCase()];
                    if (!foodId) {
                        console.log(`⚠️ Food not found for meal: ${meal.foodName}`);
                        continue;
                    }

                    const mealEntry = {
                        user_id: userId,
                        food_id: foodId,
                        meal_type: meal.mealType || 'snack',
                        quantity: meal.quantity || 1,
                        serving_size: meal.servingSize,
                        date: meal.date,
                        notes: meal.notes,
                    };

                    await macrooDatabase.addMealEntry(mealEntry);
                    console.log(`✓ Migrated meal: ${meal.foodName} (${meal.date})`);
                } catch (error) {
                    console.error(`❌ Failed to migrate meal: ${meal.foodName}`, error);
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
                    const waterEntry = {
                        user_id: userId,
                        amount: entry.amount,
                        date: entry.date,
                        time: entry.time,
                    };

                    await macrooDatabase.addWaterEntry(waterEntry);
                    console.log(`✓ Migrated water entry: ${entry.amount}ml (${entry.date})`);
                } catch (error) {
                    console.error(`❌ Failed to migrate water entry:`, error);
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
            await macrooDatabase.saveUserProfile(userId, profile);

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