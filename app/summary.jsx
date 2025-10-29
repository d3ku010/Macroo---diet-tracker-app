import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import DailyCalorieChart from '../components/charts/DailyCalorieChart';
import DailyNutritionSummary from '../components/DailyNutritionSummary';
import HydrationProgress from '../components/HydrationProgress';
import { useTheme } from '../components/ui/ThemeProvider';
import { getMeals, getProfile, getWaterEntries } from '../utils/supabaseStorage';

export default function Summary() {
    const { theme } = useTheme();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [summaryData, setSummaryData] = useState({
        calories: {
            consumed: 0,
            goal: 1950,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snacks: 0,
        },
        macroNutrients: {
            protein: { consumed: 0, goal: 122 }, // 25% of 1950 calories / 4 cal/g
            carbs: { consumed: 0, goal: 219 },   // 45% of 1950 calories / 4 cal/g
            fat: { consumed: 0, goal: 65 },     // 30% of 1950 calories / 9 cal/g
        },
        hydration: {
            current: 0,
            goal: 3000, // 12 glasses * 250ml
            maxRecommended: 4000
        }
    });

    useEffect(() => {
        loadSummaryData();
    }, []);

    // Refresh data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadSummaryData();
            setRefreshTrigger(prev => prev + 1);
        }, [])
    );

    const loadSummaryData = async () => {
        try {
            // Get today's date
            const today = new Date().toISOString().slice(0, 10);

            // getMeals() already filters by today's date by default
            const todaysMeals = await getMeals(today);
            const waterEntries = await getWaterEntries(today);
            const profile = await getProfile();

            // Calculate calories by meal type
            const mealCalories = {
                breakfast: 0,
                lunch: 0,
                dinner: 0,
                snacks: 0,
            };

            let totalCalories = 0;
            let totalProtein = 0;
            let totalCarbs = 0;
            let totalFat = 0;

            todaysMeals.forEach(meal => {
                const calories = meal.calories || 0;
                const protein = meal.protein || 0;
                const carbs = meal.carbs || 0;
                const fat = meal.fat || 0;

                totalCalories += calories;
                totalProtein += protein;
                totalCarbs += carbs;
                totalFat += fat;

                const mealType = meal.mealType?.toLowerCase() || 'snacks';
                if (mealType === 'breakfast') mealCalories.breakfast += calories;
                else if (mealType === 'lunch') mealCalories.lunch += calories;
                else if (mealType === 'dinner') mealCalories.dinner += calories;
                else mealCalories.snacks += calories;
            });

            // Calculate today's water intake (waterEntries already filtered by date)
            const totalWater = waterEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

            // Get calorie goal from profile
            const calorieGoal = profile?.dailyCaloriesTarget || 1950;

            setSummaryData({
                calories: {
                    consumed: Math.round(totalCalories),
                    goal: calorieGoal,
                    breakfast: Math.round(mealCalories.breakfast),
                    lunch: Math.round(mealCalories.lunch),
                    dinner: Math.round(mealCalories.dinner),
                    snacks: Math.round(mealCalories.snacks),
                },
                macroNutrients: {
                    protein: { consumed: Math.round(totalProtein), goal: Math.round(calorieGoal * 0.25 / 4) },
                    carbs: { consumed: Math.round(totalCarbs), goal: Math.round(calorieGoal * 0.45 / 4) },
                    fat: { consumed: Math.round(totalFat), goal: Math.round(calorieGoal * 0.30 / 9) },
                },
                hydration: {
                    current: Math.round(totalWater),
                    goal: (profile?.dailyWaterTarget || 12) * 250, // Convert glasses to ml (default 3000ml)
                    maxRecommended: 4000,
                },
            });
        } catch (error) {
            console.error('Failed to load summary data:', error);
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Daily Summary</Text>

                {/* Daily Nutrition Summary */}
                <DailyNutritionSummary
                    userId="current_user"
                    date={new Date().toISOString().slice(0, 10)}
                />
                <View style={{ marginBottom: 24 }} />

                {/* Daily Calorie Chart */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Calorie Distribution</Text>
                    <DailyCalorieChart
                        data={[
                            { meal: 'Breakfast', calories: summaryData.calories.breakfast },
                            { meal: 'Lunch', calories: summaryData.calories.lunch },
                            { meal: 'Dinner', calories: summaryData.calories.dinner },
                            { meal: 'Snacks', calories: summaryData.calories.snacks },
                        ]}
                    />
                </View>

                {/* Hydration Progress */}
                <View style={styles.section}>
                    <HydrationProgress
                        currentMl={summaryData.hydration.current}
                        goalMl={summaryData.hydration.goal}
                        maxRecommendedMl={summaryData.hydration.maxRecommended}
                    />
                </View>

                {/* Additional Stats */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Progress</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.statNumber, { color: theme.primary }]}>
                                {Math.round((summaryData.calories.consumed / summaryData.calories.goal) * 100)}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.subText }]}>Calorie Goal</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.statNumber, { color: theme.success }]}>
                                {Math.round((summaryData.macroNutrients.protein.consumed / summaryData.macroNutrients.protein.goal) * 100)}%
                            </Text>
                            <Text style={[styles.statLabel, { color: theme.subText }]}>Protein Goal</Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
});