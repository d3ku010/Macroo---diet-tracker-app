import AsyncStorage from '@react-native-async-storage/async-storage';

const FOOD_DB_KEY = 'food_database';
const MEAL_DB_KEY = 'meal_entries';
const WATER_DB_KEY = 'water_entries';
const PROFILE_KEY = 'user_profile';

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
