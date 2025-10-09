// Weekly challenges system to engage users with nutrition and hydration goals
import { getWeeklyChallenges, updateChallengeProgress } from '../storage';

// Default weekly challenges that rotate
export const DEFAULT_WEEKLY_CHALLENGES = [
    // Hydration challenges
    {
        id: 'hydration_champion',
        name: 'Hydration Champion',
        description: 'Drink at least 2L of water every day this week',
        type: 'hydration',
        target: 7, // 7 days
        progress: 0,
        reward: 'Unlock special hydration tracking features',
        icon: 'water-outline',
    },
    {
        id: 'early_hydration',
        name: 'Morning Boost',
        description: 'Drink 500ml of water within 1 hour of waking up for 5 days',
        type: 'hydration',
        target: 5,
        progress: 0,
        reward: 'Energy booster badge',
        icon: 'sunny-outline',
    },

    // Nutrition challenges
    {
        id: 'protein_power',
        name: 'Protein Power Week',
        description: 'Meet your daily protein goal for 6 out of 7 days',
        type: 'nutrition',
        target: 6,
        progress: 0,
        reward: 'Muscle builder achievement',
        icon: 'barbell-outline',
    },
    {
        id: 'veggie_lover',
        name: 'Veggie Lover',
        description: 'Include vegetables in at least 2 meals per day for a week',
        type: 'nutrition',
        target: 14, // 2 meals × 7 days
        progress: 0,
        reward: 'Health guru badge',
        icon: 'leaf-outline',
    },
    {
        id: 'balanced_warrior',
        name: 'Balanced Warrior',
        description: 'Keep all macros within 10% of targets for 4 days',
        type: 'nutrition',
        target: 4,
        progress: 0,
        reward: 'Balance master achievement',
        icon: 'scale-outline',
    },

    // Consistency challenges
    {
        id: 'consistent_logger',
        name: 'Consistent Logger',
        description: 'Log at least 3 meals every day for a week',
        type: 'consistency',
        target: 7,
        progress: 0,
        reward: 'Tracking master badge',
        icon: 'checkmark-circle-outline',
    },
    {
        id: 'early_breakfast',
        name: 'Early Bird Special',
        description: 'Eat breakfast before 9 AM for 6 out of 7 days',
        type: 'consistency',
        target: 6,
        progress: 0,
        reward: 'Morning person achievement',
        icon: 'alarm-outline',
    },
];

// Initialize weekly challenges
export const initializeWeeklyChallenges = async () => {
    try {
        const existingChallenges = await getWeeklyChallenges();
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Check if we need to generate new challenges (new week or no challenges)
        const needsNewChallenges = existingChallenges.length === 0 ||
            existingChallenges.every(challenge => new Date(challenge.endDate) < startOfWeek);

        if (needsNewChallenges) {
            // Generate 3 random challenges for this week
            const shuffled = [...DEFAULT_WEEKLY_CHALLENGES].sort(() => 0.5 - Math.random());
            const selectedChallenges = shuffled.slice(0, 3).map(challenge => ({
                ...challenge,
                id: `${challenge.id}_${startOfWeek.getTime()}`,
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
                progress: 0,
            }));

            const { AsyncStorage } = require('@react-native-async-storage/async-storage');
            await AsyncStorage.setItem('weekly_challenges', JSON.stringify(selectedChallenges));
            return selectedChallenges;
        }

        return existingChallenges;
    } catch (error) {
        console.error('Failed to initialize weekly challenges:', error);
        return [];
    }
};

// Check and update challenge progress based on user activities
export const checkHydrationChallenges = async (waterEntries, dailyGoal = 2000) => {
    try {
        const challenges = await getWeeklyChallenges();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        for (const challenge of challenges) {
            if (challenge.type !== 'hydration' || new Date(challenge.endDate) < now) continue;

            switch (challenge.id.split('_')[0] + '_' + challenge.id.split('_')[1]) {
                case 'hydration_champion':
                    // Check if user met daily goal today
                    const todayWater = waterEntries
                        .filter(w => w.timestamp?.startsWith(today))
                        .reduce((sum, w) => sum + (w.amount || 0), 0);

                    if (todayWater >= dailyGoal) {
                        const newProgress = Math.min(challenge.progress + 1, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;

                case 'early_hydration':
                    // Check if user drank 500ml within first hour of waking (simplified: before 9 AM)
                    const morningWater = waterEntries
                        .filter(w => {
                            if (!w.timestamp?.startsWith(today)) return false;
                            const hour = new Date(w.timestamp).getHours();
                            return hour >= 6 && hour < 9;
                        })
                        .reduce((sum, w) => sum + (w.amount || 0), 0);

                    if (morningWater >= 500) {
                        const newProgress = Math.min(challenge.progress + 1, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('Failed to check hydration challenges:', error);
    }
};

export const checkNutritionChallenges = async (meals, customTargets) => {
    try {
        const challenges = await getWeeklyChallenges();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        for (const challenge of challenges) {
            if (challenge.type !== 'nutrition' || new Date(challenge.endDate) < now) continue;

            const todayMeals = meals.filter(m => m.timestamp?.startsWith(today));

            switch (challenge.id.split('_')[0] + '_' + challenge.id.split('_')[1]) {
                case 'protein_power':
                    if (!customTargets?.protein) break;

                    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.nutrients?.protein || 0), 0);
                    if (totalProtein >= customTargets.protein) {
                        const newProgress = Math.min(challenge.progress + 1, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;

                case 'veggie_lover':
                    // Count meals with vegetables (simplified: look for veggie keywords)
                    const veggieKeywords = ['salad', 'broccoli', 'spinach', 'carrot', 'tomato', 'cucumber', 'pepper', 'onion', 'lettuce'];
                    const veggieCount = todayMeals.filter(meal =>
                        veggieKeywords.some(keyword => meal.food.toLowerCase().includes(keyword))
                    ).length;

                    if (veggieCount >= 2) {
                        const newProgress = Math.min(challenge.progress + 2, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;

                case 'balanced_warrior':
                    if (!customTargets) break;

                    const todayTotals = todayMeals.reduce((totals, meal) => ({
                        protein: totals.protein + (meal.nutrients?.protein || 0),
                        carbs: totals.carbs + (meal.nutrients?.carbs || 0),
                        fat: totals.fat + (meal.nutrients?.fat || 0),
                    }), { protein: 0, carbs: 0, fat: 0 });

                    const proteinWithin = Math.abs(todayTotals.protein - customTargets.protein) <= (customTargets.protein * 0.1);
                    const carbsWithin = Math.abs(todayTotals.carbs - customTargets.carbs) <= (customTargets.carbs * 0.1);
                    const fatWithin = Math.abs(todayTotals.fat - customTargets.fat) <= (customTargets.fat * 0.1);

                    if (proteinWithin && carbsWithin && fatWithin) {
                        const newProgress = Math.min(challenge.progress + 1, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('Failed to check nutrition challenges:', error);
    }
};

export const checkConsistencyChallenges = async (meals) => {
    try {
        const challenges = await getWeeklyChallenges();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        for (const challenge of challenges) {
            if (challenge.type !== 'consistency' || new Date(challenge.endDate) < now) continue;

            const todayMeals = meals.filter(m => m.timestamp?.startsWith(today));

            switch (challenge.id.split('_')[0] + '_' + challenge.id.split('_')[1]) {
                case 'consistent_logger':
                    if (todayMeals.length >= 3) {
                        const newProgress = Math.min(challenge.progress + 1, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;

                case 'early_breakfast':
                    const breakfastMeals = todayMeals.filter(meal => {
                        const hour = new Date(meal.timestamp).getHours();
                        return meal.type === 'Breakfast' && hour < 9;
                    });

                    if (breakfastMeals.length > 0) {
                        const newProgress = Math.min(challenge.progress + 1, challenge.target);
                        if (newProgress > challenge.progress) {
                            await updateChallengeProgress(challenge.id, newProgress);
                        }
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('Failed to check consistency challenges:', error);
    }
};

// Get completed challenges this week
export const getCompletedChallenges = async () => {
    try {
        const challenges = await getWeeklyChallenges();
        return challenges.filter(challenge => challenge.progress >= challenge.target);
    } catch (error) {
        console.error('Failed to get completed challenges:', error);
        return [];
    }
};

// Get challenge progress summary
export const getChallengesSummary = async () => {
    try {
        const challenges = await getWeeklyChallenges();
        const now = new Date();

        const activeChallenges = challenges.filter(challenge => new Date(challenge.endDate) > now);
        const completedCount = activeChallenges.filter(challenge => challenge.progress >= challenge.target).length;

        return {
            total: activeChallenges.length,
            completed: completedCount,
            inProgress: activeChallenges.length - completedCount,
            challenges: activeChallenges,
        };
    } catch (error) {
        console.error('Failed to get challenges summary:', error);
        return { total: 0, completed: 0, inProgress: 0, challenges: [] };
    }
};

// Check if it's time for new weekly challenges
export const shouldRefreshChallenges = async () => {
    try {
        const challenges = await getWeeklyChallenges();
        if (challenges.length === 0) return true;

        const now = new Date();
        const latestEndDate = Math.max(...challenges.map(c => new Date(c.endDate).getTime()));

        return now.getTime() > latestEndDate;
    } catch (error) {
        console.error('Failed to check if challenges should refresh:', error);
        return false;
    }
};

// Reward calculation for completed challenges
export const calculateWeeklyRewards = async () => {
    try {
        const completedChallenges = await getCompletedChallenges();
        const rewards = {
            points: completedChallenges.length * 100,
            badges: completedChallenges.map(c => c.reward),
            streakBonus: completedChallenges.length >= 3 ? 200 : 0, // Bonus for completing all challenges
        };

        return rewards;
    } catch (error) {
        console.error('Failed to calculate weekly rewards:', error);
        return { points: 0, badges: [], streakBonus: 0 };
    }
};