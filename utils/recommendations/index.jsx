// Food recommendation engine based on nutrition gaps and goals
import { getCustomMacroTargets, suggestCalories } from '../storage';
import { getFoodDatabase, getMeals, getProfile } from '../supabaseStorage';

// Calculate nutritional gaps for today
export const calculateNutritionGaps = async () => {
    try {
        const [meals, profile, customTargets] = await Promise.all([
            getMeals(),
            getProfile(),
            getCustomMacroTargets(),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const todayMeals = meals.filter(m => m.date === today);

        // Calculate today's totals
        const consumed = todayMeals.reduce((totals, meal) => ({
            calories: totals.calories + (meal.calories || 0),
            protein: totals.protein + (meal.protein || 0),
            carbs: totals.carbs + (meal.carbs || 0),
            fat: totals.fat + (meal.fat || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        // Get targets (custom or calculated)
        let targets;
        if (customTargets) {
            targets = customTargets;
        } else if (profile) {
            const suggestedCalories = suggestCalories(profile);
            targets = {
                calories: suggestedCalories || 2000,
                protein: Math.round((suggestedCalories || 2000) * 0.25 / 4), // 25% of calories from protein
                carbs: Math.round((suggestedCalories || 2000) * 0.45 / 4), // 45% from carbs
                fat: Math.round((suggestedCalories || 2000) * 0.30 / 9), // 30% from fat
            };
        } else {
            targets = { calories: 2000, protein: 125, carbs: 225, fat: 67 };
        }

        // Calculate gaps
        const gaps = {
            calories: Math.max(0, targets.calories - consumed.calories),
            protein: Math.max(0, targets.protein - consumed.protein),
            carbs: Math.max(0, targets.carbs - consumed.carbs),
            fat: Math.max(0, targets.fat - consumed.fat),
        };

        return {
            consumed,
            targets,
            gaps,
            percentageConsumed: {
                calories: targets.calories > 0 ? (consumed.calories / targets.calories) * 100 : 0,
                protein: targets.protein > 0 ? (consumed.protein / targets.protein) * 100 : 0,
                carbs: targets.carbs > 0 ? (consumed.carbs / targets.carbs) * 100 : 0,
                fat: targets.fat > 0 ? (consumed.fat / targets.fat) * 100 : 0,
            },
        };
    } catch (error) {
        console.error('Failed to calculate nutrition gaps:', error);
        return null;
    }
};

// Recommend foods based on nutrition gaps
export const recommendFoods = async (maxRecommendations = 5) => {
    try {
        const nutritionAnalysis = await calculateNutritionGaps();
        if (!nutritionAnalysis) return [];

        const { gaps } = nutritionAnalysis;
        const foods = await getFoodDatabase();

        if (foods.length === 0) return [];

        // Score foods based on how well they fill nutrition gaps
        const scoredFoods = foods.map(food => {
            let score = 0;
            let reasons = [];

            // Score based on protein needs
            if (gaps.protein > 0 && food.protein > 10) {
                score += (food.protein / 25) * 30; // High protein foods get bonus
                reasons.push(`High protein (${food.protein}g per 100g)`);
            }

            // Score based on healthy carbs (lower score for high sugar)
            if (gaps.carbs > 0 && food.carbs > 10) {
                score += (food.carbs / 30) * 20;
                reasons.push(`Good carbs source (${food.carbs}g per 100g)`);
            }

            // Score based on healthy fats
            if (gaps.fat > 0 && food.fat > 5 && food.fat < 30) {
                score += (food.fat / 15) * 25;
                reasons.push(`Healthy fats (${food.fat}g per 100g)`);
            }

            // Bonus for balanced foods
            const macroBalance = Math.abs(food.protein - 15) + Math.abs(food.carbs - 20) + Math.abs(food.fat - 10);
            if (macroBalance < 20) {
                score += 15;
                reasons.push('Well-balanced nutrition');
            }

            // Bonus for moderate calorie density
            if (food.calories > 50 && food.calories < 300) {
                score += 10;
                reasons.push('Appropriate calorie density');
            }

            // Penalty for very high calorie foods if trying to lose weight
            const profile = nutritionAnalysis.profile;
            if (profile?.goal === 'lose' && food.calories > 400) {
                score -= 15;
            }

            return {
                ...food,
                recommendationScore: score,
                reasons: reasons.slice(0, 2), // Keep top 2 reasons
            };
        });

        // Sort by score and return top recommendations
        const recommendations = scoredFoods
            .filter(food => food.recommendationScore > 10)
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, maxRecommendations);

        return recommendations;
    } catch (error) {
        console.error('Failed to recommend foods:', error);
        return [];
    }
};

// Get recommendations for specific meal types
export const getMealTypeRecommendations = async (mealType) => {
    try {
        const foods = await getFoodDatabase();
        const nutritionAnalysis = await calculateNutritionGaps();

        if (!nutritionAnalysis || foods.length === 0) return [];

        // Meal type specific recommendations
        const mealPreferences = {
            'Breakfast': {
                preferredMacros: { protein: 0.3, carbs: 0.5, fat: 0.2 },
                calorieRange: [200, 500],
                keywords: ['egg', 'oats', 'yogurt', 'banana', 'milk'],
            },
            'Lunch': {
                preferredMacros: { protein: 0.35, carbs: 0.45, fat: 0.2 },
                calorieRange: [300, 700],
                keywords: ['chicken', 'rice', 'salad', 'vegetables'],
            },
            'Dinner': {
                preferredMacros: { protein: 0.4, carbs: 0.3, fat: 0.3 },
                calorieRange: [400, 800],
                keywords: ['fish', 'meat', 'vegetables', 'quinoa'],
            },
            'Snack': {
                preferredMacros: { protein: 0.25, carbs: 0.4, fat: 0.35 },
                calorieRange: [100, 300],
                keywords: ['nuts', 'fruit', 'yogurt'],
            },
        };

        const preferences = mealPreferences[mealType] || mealPreferences['Snack'];

        const recommendations = foods
            .filter(food => {
                // Filter by calorie range
                const inRange = food.calories >= preferences.calorieRange[0] &&
                    food.calories <= preferences.calorieRange[1];

                // Check if food name contains preferred keywords
                const hasKeyword = preferences.keywords.some(keyword =>
                    food.name.toLowerCase().includes(keyword.toLowerCase())
                );

                return inRange || hasKeyword;
            })
            .map(food => {
                let score = 0;

                // Score based on macro preferences for this meal type
                const totalMacros = food.protein + food.carbs + food.fat;
                if (totalMacros > 0) {
                    const proteinRatio = food.protein / totalMacros;
                    const carbsRatio = food.carbs / totalMacros;
                    const fatRatio = food.fat / totalMacros;

                    // How closely does this food match the preferred macro ratios?
                    const macroScore = 100 - (
                        Math.abs(proteinRatio - preferences.preferredMacros.protein) * 100 +
                        Math.abs(carbsRatio - preferences.preferredMacros.carbs) * 100 +
                        Math.abs(fatRatio - preferences.preferredMacros.fat) * 100
                    );

                    score += macroScore;
                }

                // Bonus for keyword matches
                preferences.keywords.forEach(keyword => {
                    if (food.name.toLowerCase().includes(keyword.toLowerCase())) {
                        score += 20;
                    }
                });

                return { ...food, recommendationScore: score };
            })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, 5);

        return recommendations;
    } catch (error) {
        console.error('Failed to get meal type recommendations:', error);
        return [];
    }
};

// Analyze meal timing patterns
export const analyzeMealTiming = async () => {
    try {
        const meals = await getMeals();

        if (meals.length === 0) {
            return {
                averageFirstMeal: null,
                averageLastMeal: null,
                mealFrequency: 0,
                timingPattern: 'insufficient_data',
                suggestions: ['Start logging meals to get timing insights'],
            };
        }

        // Group meals by day and analyze timing
        const mealsByDay = {};
        meals.forEach(meal => {
            const day = meal.date;
            if (!mealsByDay[day]) mealsByDay[day] = [];
            mealsByDay[day].push(meal);
        });

        const dailyStats = Object.values(mealsByDay).map(dayMeals => {
            // For Supabase meals, we need to create timestamps from date + time
            // For now, we'll use simplified timing (meals are already sorted by creation time)
            const timestamps = dayMeals.map((m, index) => {
                // Create approximate timestamps based on typical meal times
                const baseDate = new Date(m.date + 'T00:00:00');
                const mealHours = [8, 12, 15, 19]; // Breakfast, lunch, snack, dinner
                baseDate.setHours(mealHours[index % mealHours.length] || 12);
                return baseDate;
            });
            timestamps.sort((a, b) => a - b);

            return {
                firstMeal: timestamps[0],
                lastMeal: timestamps[timestamps.length - 1],
                mealCount: dayMeals.length,
                mealGaps: timestamps.slice(1).map((time, index) =>
                    (time - timestamps[index]) / (1000 * 60 * 60) // hours between meals
                ),
            };
        });

        // Calculate averages
        const avgFirstMealHour = dailyStats.reduce((sum, day) =>
            sum + day.firstMeal.getHours() + (day.firstMeal.getMinutes() / 60), 0
        ) / dailyStats.length;

        const avgLastMealHour = dailyStats.reduce((sum, day) =>
            sum + day.lastMeal.getHours() + (day.lastMeal.getMinutes() / 60), 0
        ) / dailyStats.length;

        const avgMealsPerDay = dailyStats.reduce((sum, day) => sum + day.mealCount, 0) / dailyStats.length;

        // Determine eating pattern
        let timingPattern = 'irregular';
        let suggestions = [];

        if (avgFirstMealHour < 8) {
            timingPattern = 'early_bird';
            suggestions.push('Great job eating breakfast early! This can boost metabolism.');
        } else if (avgFirstMealHour > 11) {
            timingPattern = 'late_starter';
            suggestions.push('Consider eating breakfast earlier to stabilize energy levels.');
        }

        if (avgLastMealHour > 21) {
            suggestions.push('Try to finish eating 2-3 hours before bedtime for better digestion.');
        }

        if (avgMealsPerDay < 3) {
            suggestions.push('Consider eating more regularly throughout the day.');
        } else if (avgMealsPerDay > 6) {
            suggestions.push('You eat frequently - make sure portion sizes are appropriate.');
        }

        // Analyze meal gaps
        const allGaps = dailyStats.flatMap(day => day.mealGaps);
        const avgGap = allGaps.length > 0 ? allGaps.reduce((a, b) => a + b, 0) / allGaps.length : 0;

        if (avgGap > 6) {
            suggestions.push('Long gaps between meals may lead to overeating. Consider healthy snacks.');
        } else if (avgGap < 2) {
            suggestions.push('Very frequent eating - ensure each meal has nutritional value.');
        }

        return {
            averageFirstMeal: `${Math.floor(avgFirstMealHour)}:${Math.round((avgFirstMealHour % 1) * 60).toString().padStart(2, '0')}`,
            averageLastMeal: `${Math.floor(avgLastMealHour)}:${Math.round((avgLastMealHour % 1) * 60).toString().padStart(2, '0')}`,
            mealFrequency: Math.round(avgMealsPerDay * 10) / 10,
            averageGapBetweenMeals: Math.round(avgGap * 10) / 10,
            timingPattern,
            suggestions: suggestions.slice(0, 3), // Keep top 3 suggestions
            daysAnalyzed: dailyStats.length,
        };
    } catch (error) {
        console.error('Failed to analyze meal timing:', error);
        return {
            averageFirstMeal: null,
            averageLastMeal: null,
            mealFrequency: 0,
            timingPattern: 'error',
            suggestions: ['Unable to analyze meal timing'],
        };
    }
};

// Generate personalized nutrition insights
export const generateNutritionInsights = async () => {
    try {
        const [nutritionAnalysis, mealTiming, profile] = await Promise.all([
            calculateNutritionGaps(),
            analyzeMealTiming(),
            getProfile(),
        ]);

        const insights = [];

        if (nutritionAnalysis) {
            const { percentageConsumed, gaps } = nutritionAnalysis;

            // Calorie insights
            if (percentageConsumed.calories < 80) {
                insights.push({
                    type: 'warning',
                    category: 'calories',
                    message: `You're ${Math.round(100 - percentageConsumed.calories)}% below your calorie goal. Consider adding a healthy snack.`,
                    priority: 'high',
                });
            } else if (percentageConsumed.calories > 120) {
                insights.push({
                    type: 'warning',
                    category: 'calories',
                    message: `You're ${Math.round(percentageConsumed.calories - 100)}% over your calorie goal. Consider lighter meals tomorrow.`,
                    priority: 'medium',
                });
            }

            // Protein insights
            if (percentageConsumed.protein < 70) {
                insights.push({
                    type: 'suggestion',
                    category: 'protein',
                    message: `Low protein intake today. Try adding eggs, lean meat, or legumes to your next meal.`,
                    priority: 'high',
                });
            }

            // Macro balance insights
            const proteinCals = nutritionAnalysis.consumed.protein * 4;
            const carbsCals = nutritionAnalysis.consumed.carbs * 4;
            const fatCals = nutritionAnalysis.consumed.fat * 9;
            const totalMacroCals = proteinCals + carbsCals + fatCals;

            if (totalMacroCals > 0) {
                const proteinPercent = (proteinCals / totalMacroCals) * 100;
                const carbsPercent = (carbsCals / totalMacroCals) * 100;
                const fatPercent = (fatCals / totalMacroCals) * 100;

                if (proteinPercent > 35) {
                    insights.push({
                        type: 'info',
                        category: 'balance',
                        message: 'High protein day! Great for muscle maintenance and satiety.',
                        priority: 'low',
                    });
                }

                if (carbsPercent < 30) {
                    insights.push({
                        type: 'suggestion',
                        category: 'balance',
                        message: 'Low carb intake may affect energy levels. Consider adding fruits or whole grains.',
                        priority: 'medium',
                    });
                }
            }
        }

        // Timing insights
        if (mealTiming.suggestions.length > 0) {
            insights.push({
                type: 'suggestion',
                category: 'timing',
                message: mealTiming.suggestions[0],
                priority: 'medium',
            });
        }

        // Goal-specific insights
        if (profile?.goal === 'lose' && nutritionAnalysis?.percentageConsumed.calories > 100) {
            insights.push({
                type: 'suggestion',
                category: 'goals',
                message: 'For weight loss, try to stay within your calorie goal. Focus on high-volume, low-calorie foods.',
                priority: 'high',
            });
        } else if (profile?.goal === 'gain' && nutritionAnalysis?.percentageConsumed.calories < 100) {
            insights.push({
                type: 'suggestion',
                category: 'goals',
                message: 'For weight gain, aim to consistently meet your calorie goals. Add healthy calorie-dense foods.',
                priority: 'high',
            });
        }

        // Sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        insights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        return insights.slice(0, 5); // Return top 5 insights
    } catch (error) {
        console.error('Failed to generate nutrition insights:', error);
        return [];
    }
};