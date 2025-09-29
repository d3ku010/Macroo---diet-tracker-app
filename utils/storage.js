import AsyncStorage from '@react-native-async-storage/async-storage';

const FOOD_DB_KEY = 'food_database';
const MEAL_DB_KEY = 'meal_entries';
const WATER_DB_KEY = 'water_entries';

// Save a new food item to the food database
export const saveFoodToDatabase = async (foodItem) => {
    try {
        const existingData = await AsyncStorage.getItem(FOOD_DB_KEY);
        let foods = existingData ? JSON.parse(existingData) : [];

        // Check for duplicates
        const alreadyExists = foods.some(f => f.name.toLowerCase() === foodItem.name.toLowerCase());
        if (alreadyExists) {
            console.warn('Food already exists.');
            return;
        }

        foods.push(foodItem);
        await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(foods));
    } catch (err) {
        console.error('Failed to save food to database:', err);
    }
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
