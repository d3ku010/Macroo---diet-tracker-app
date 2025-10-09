// Achievement system for the diet tracker app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAchievements, updateAchievement } from '../storage';

// Default achievements that get initialized when the app first runs
export const DEFAULT_ACHIEVEMENTS = [
    // Consistency achievements
    {
        id: 'first_meal',
        name: 'First Steps',
        description: 'Log your first meal',
        icon: 'restaurant-outline',
        target: 1,
        progress: 0,
        category: 'consistency',
        unlockedAt: null,
    },
    {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Log meals for 7 consecutive days',
        icon: 'calendar-outline',
        target: 7,
        progress: 0,
        category: 'consistency',
        unlockedAt: null,
    },
    {
        id: 'month_streak',
        name: 'Monthly Master',
        description: 'Log meals for 30 consecutive days',
        icon: 'trophy-outline',
        target: 30,
        progress: 0,
        category: 'consistency',
        unlockedAt: null,
    },

    // Hydration achievements
    {
        id: 'hydration_goal',
        name: 'Well Hydrated',
        description: 'Meet your daily water goal',
        icon: 'water-outline',
        target: 1,
        progress: 0,
        category: 'hydration',
        unlockedAt: null,
    },
    {
        id: 'hydration_week',
        name: 'Hydration Hero',
        description: 'Meet your water goal for 7 consecutive days',
        icon: 'fitness-outline',
        target: 7,
        progress: 0,
        category: 'hydration',
        unlockedAt: null,
    },

    // Nutrition achievements
    {
        id: 'protein_goal',
        name: 'Protein Power',
        description: 'Meet your daily protein goal',
        icon: 'barbell-outline',
        target: 1,
        progress: 0,
        category: 'nutrition',
        unlockedAt: null,
    },
    {
        id: 'balanced_day',
        name: 'Balanced Life',
        description: 'Have a perfectly balanced macro day',
        icon: 'scale-outline',
        target: 1,
        progress: 0,
        category: 'nutrition',
        unlockedAt: null,
    },
    {
        id: 'calorie_goal',
        name: 'Calorie Champion',
        description: 'Stay within 50 calories of your daily goal',
        icon: 'flame-outline',
        target: 1,
        progress: 0,
        category: 'nutrition',
        unlockedAt: null,
    },

    // Goal achievements
    {
        id: 'weight_milestone',
        name: 'Goal Getter',
        description: 'Update your weight after 2 weeks',
        icon: 'trending-down-outline',
        target: 1,
        progress: 0,
        category: 'goals',
        unlockedAt: null,
    },
    {
        id: 'food_explorer',
        name: 'Food Explorer',
        description: 'Add 10 custom foods to your database',
        icon: 'restaurant-outline',
        target: 10,
        progress: 0,
        category: 'goals',
        unlockedAt: null,
    },
];

// Initialize achievements if they don't exist
export const initializeAchievements = async () => {
    try {
        const existingAchievements = await getAchievements();

        if (existingAchievements.length === 0) {
            // First time setup - save default achievements
            await AsyncStorage.setItem('achievements', JSON.stringify(DEFAULT_ACHIEVEMENTS));
            return DEFAULT_ACHIEVEMENTS;
        }

        // Check if we need to add any new achievements
        const existingIds = existingAchievements.map(a => a.id);
        const newAchievements = DEFAULT_ACHIEVEMENTS.filter(a => !existingIds.includes(a.id));

        if (newAchievements.length > 0) {
            const updatedAchievements = [...existingAchievements, ...newAchievements];
            await AsyncStorage.setItem('achievements', JSON.stringify(updatedAchievements));
            return updatedAchievements;
        }

        return existingAchievements;
    } catch (error) {
        console.error('Failed to initialize achievements:', error);
        return DEFAULT_ACHIEVEMENTS;
    }
};

// Check and update achievements based on user actions
export const checkMealAchievements = async (meals) => {
    try {
        const achievements = await getAchievements();
        let updatedAny = false;

        // First meal achievement
        const firstMealAchievement = achievements.find(a => a.id === 'first_meal');
        if (firstMealAchievement && meals.length >= 1 && firstMealAchievement.progress === 0) {
            await updateAchievement('first_meal', 1);
            updatedAny = true;
        }

        // Streak calculations
        const today = new Date().toISOString().split('T')[0];
        let streakCount = 0;
        let currentDate = new Date();

        // Calculate consecutive days with meals
        while (streakCount < 31) { // Max 31 days to check
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayMeals = meals.filter(m => m.date === dateStr);

            if (dayMeals.length === 0) break;

            streakCount++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Week streak achievement
        const weekStreakAchievement = achievements.find(a => a.id === 'week_streak');
        if (weekStreakAchievement && streakCount >= 7) {
            await updateAchievement('week_streak', Math.min(streakCount, 7));
            updatedAny = true;
        }

        // Month streak achievement
        const monthStreakAchievement = achievements.find(a => a.id === 'month_streak');
        if (monthStreakAchievement && streakCount >= 30) {
            await updateAchievement('month_streak', Math.min(streakCount, 30));
            updatedAny = true;
        }

        return updatedAny;
    } catch (error) {
        console.error('Failed to check meal achievements:', error);
        return false;
    }
};

export const checkHydrationAchievements = async (waterEntries, dailyGoal = 2000) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayWater = waterEntries
            .filter(w => w.date === today)
            .reduce((sum, w) => sum + (w.amount || 0), 0);

        let updatedAny = false;

        // Daily hydration goal
        if (todayWater >= dailyGoal) {
            await updateAchievement('hydration_goal', 1);
            updatedAny = true;
        }

        // Calculate hydration streak
        let streakCount = 0;
        let currentDate = new Date();

        while (streakCount < 8) { // Check up to 8 days
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayWater = waterEntries
                .filter(w => w.date === dateStr)
                .reduce((sum, w) => sum + (w.amount || 0), 0);

            if (dayWater < dailyGoal) break;

            streakCount++;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Week hydration streak
        if (streakCount >= 7) {
            await updateAchievement('hydration_week', Math.min(streakCount, 7));
            updatedAny = true;
        }

        return updatedAny;
    } catch (error) {
        console.error('Failed to check hydration achievements:', error);
        return false;
    }
};

export const checkNutritionAchievements = async (meals, targets) => {
    try {
        if (!targets) return false;

        const today = new Date().toISOString().split('T')[0];
        const todayMeals = meals.filter(m => m.date === today);

        const todayTotals = todayMeals.reduce((totals, meal) => ({
            calories: totals.calories + (meal.calories || 0),
            protein: totals.protein + (meal.protein || 0),
            carbs: totals.carbs + (meal.carbs || 0),
            fat: totals.fat + (meal.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        let updatedAny = false;

        // Protein goal achievement
        if (todayTotals.protein >= targets.protein) {
            await updateAchievement('protein_goal', 1);
            updatedAny = true;
        }

        // Calorie goal achievement (within 50 calories)
        const calorieTarget = targets.calories || 2000;
        if (Math.abs(todayTotals.calories - calorieTarget) <= 50) {
            await updateAchievement('calorie_goal', 1);
            updatedAny = true;
        }

        // Balanced day achievement (macros within 5% of targets)
        const proteinTarget = targets.protein || 0;
        const carbsTarget = targets.carbs || 0;
        const fatTarget = targets.fat || 0;

        const proteinWithin = Math.abs(todayTotals.protein - proteinTarget) <= (proteinTarget * 0.05);
        const carbsWithin = Math.abs(todayTotals.carbs - carbsTarget) <= (carbsTarget * 0.05);
        const fatWithin = Math.abs(todayTotals.fat - fatTarget) <= (fatTarget * 0.05);

        if (proteinWithin && carbsWithin && fatWithin) {
            await updateAchievement('balanced_day', 1);
            updatedAny = true;
        }

        return updatedAny;
    } catch (error) {
        console.error('Failed to check nutrition achievements:', error);
        return false;
    }
};

export const checkGoalAchievements = async (foods) => {
    try {
        let updatedAny = false;

        // Food explorer achievement
        if (foods.length >= 10) {
            await updateAchievement('food_explorer', foods.length);
            updatedAny = true;
        }

        return updatedAny;
    } catch (error) {
        console.error('Failed to check goal achievements:', error);
        return false;
    }
};

// Get recently unlocked achievements
export const getRecentlyUnlockedAchievements = async () => {
    try {
        const achievements = await getAchievements();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        return achievements.filter(achievement =>
            achievement.unlockedAt &&
            new Date(achievement.unlockedAt) > oneDayAgo
        );
    } catch (error) {
        console.error('Failed to get recently unlocked achievements:', error);
        return [];
    }
};

// Get achievement progress summary
export const getAchievementSummary = async () => {
    try {
        const achievements = await getAchievements();

        const summary = {
            total: achievements.length,
            unlocked: achievements.filter(a => a.unlockedAt).length,
            inProgress: achievements.filter(a => a.progress > 0 && !a.unlockedAt).length,
            byCategory: {},
        };

        // Group by category
        achievements.forEach(achievement => {
            const category = achievement.category || 'other';
            if (!summary.byCategory[category]) {
                summary.byCategory[category] = {
                    total: 0,
                    unlocked: 0,
                };
            }

            summary.byCategory[category].total += 1;
            if (achievement.unlockedAt) {
                summary.byCategory[category].unlocked += 1;
            }
        });

        return summary;
    } catch (error) {
        console.error('Failed to get achievement summary:', error);
        return { total: 0, unlocked: 0, inProgress: 0, byCategory: {} };
    }
};