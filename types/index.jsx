// Type definitions and interfaces for the diet tracker app
import PropTypes from 'prop-types';

// Food item structure
export const FoodType = PropTypes.shape({
    name: PropTypes.string.isRequired,
    calories: PropTypes.number.isRequired,
    protein: PropTypes.number.isRequired,
    carbs: PropTypes.number.isRequired,
    fat: PropTypes.number.isRequired,
    category: PropTypes.string,
    barcode: PropTypes.string,
    image: PropTypes.string,
    micronutrients: PropTypes.object,
});

// Meal entry structure
export const MealType = PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other']).isRequired,
    food: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    nutrients: PropTypes.shape({
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number,
    }),
    image: PropTypes.string,
    notes: PropTypes.string,
});

// Profile structure
export const ProfileType = PropTypes.shape({
    name: PropTypes.string.isRequired,
    age: PropTypes.number,
    gender: PropTypes.oneOf(['male', 'female']).isRequired,
    heightCm: PropTypes.number,
    weightKg: PropTypes.number,
    activityLevel: PropTypes.oneOf(['sedentary', 'light', 'moderate', 'active']).isRequired,
    goal: PropTypes.oneOf(['lose', 'maintain', 'gain']).isRequired,
    dailyWaterGoalMl: PropTypes.number,
    customMacroTargets: PropTypes.shape({
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number,
    }),
    preferences: PropTypes.shape({
        dietaryRestrictions: PropTypes.arrayOf(PropTypes.string),
        allergies: PropTypes.arrayOf(PropTypes.string),
        preferredMealTimes: PropTypes.object,
    }),
});

// Water entry structure
export const WaterEntryType = PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
});

// Achievement structure
export const AchievementType = PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    unlockedAt: PropTypes.string,
    progress: PropTypes.number,
    target: PropTypes.number,
    category: PropTypes.oneOf(['nutrition', 'hydration', 'consistency', 'goals']),
});

// Meal template structure
export const MealTemplateType = PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    foods: PropTypes.arrayOf(PropTypes.shape({
        food: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
    })),
    category: PropTypes.string,
    isFavorite: PropTypes.bool,
});

// Weekly challenge structure
export const WeeklyChallengeType = PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['hydration', 'nutrition', 'consistency']).isRequired,
    target: PropTypes.number.isRequired,
    progress: PropTypes.number,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    reward: PropTypes.string,
});

// Validation functions
export const validateFood = (food) => {
    const errors = [];

    if (!food?.name || typeof food.name !== 'string' || food.name.trim().length < 2) {
        errors.push('Food name must be at least 2 characters');
    }

    if (typeof food?.calories !== 'number' || food.calories < 0 || food.calories > 9000) {
        errors.push('Calories must be a number between 0 and 9000');
    }

    if (typeof food?.protein !== 'number' || food.protein < 0 || food.protein > 100) {
        errors.push('Protein must be a number between 0 and 100');
    }

    if (typeof food?.carbs !== 'number' || food.carbs < 0 || food.carbs > 100) {
        errors.push('Carbs must be a number between 0 and 100');
    }

    if (typeof food?.fat !== 'number' || food.fat < 0 || food.fat > 100) {
        errors.push('Fat must be a number between 0 and 100');
    }

    return { isValid: errors.length === 0, errors };
};

export const validateMeal = (meal) => {
    const errors = [];

    if (!meal?.food || typeof meal.food !== 'string') {
        errors.push('Food selection is required');
    }

    if (typeof meal?.quantity !== 'number' || meal.quantity <= 0 || meal.quantity > 10000) {
        errors.push('Quantity must be a positive number less than 10000');
    }

    if (!meal?.type || !['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'].includes(meal.type)) {
        errors.push('Valid meal type is required');
    }

    return { isValid: errors.length === 0, errors };
};

export const validateProfile = (profile) => {
    const errors = [];

    if (!profile?.name || typeof profile.name !== 'string' || profile.name.trim().length < 1) {
        errors.push('Name is required');
    }

    if (profile?.age && (typeof profile.age !== 'number' || profile.age < 1 || profile.age > 120)) {
        errors.push('Age must be between 1 and 120');
    }

    if (!profile?.gender || !['male', 'female'].includes(profile.gender)) {
        errors.push('Valid gender selection is required');
    }

    if (profile?.heightCm && (typeof profile.heightCm !== 'number' || profile.heightCm < 50 || profile.heightCm > 300)) {
        errors.push('Height must be between 50 and 300 cm');
    }

    if (profile?.weightKg && (typeof profile.weightKg !== 'number' || profile.weightKg < 20 || profile.weightKg > 500)) {
        errors.push('Weight must be between 20 and 500 kg');
    }

    return { isValid: errors.length === 0, errors };
};

// Constants for meal types, categories, etc.
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Other'];
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active'];
export const GOALS = ['lose', 'maintain', 'gain'];
export const FOOD_CATEGORIES = ['protein', 'carbs', 'fruits', 'vegetables', 'dairy', 'fats', 'beverages', 'other'];