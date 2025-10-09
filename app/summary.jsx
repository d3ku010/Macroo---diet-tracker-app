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
            goal: 2200,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snacks: 0,
        },
        macroNutrients: {
            protein: { consumed: 0, goal: 150 },
            carbs: { consumed: 0, goal: 250 },
            fat: { consumed: 0, goal: 80 },
        },
        hydration: {
            current: 0,
            goal: 2000,
            maxRecommended: 4000
        }
    });

    useEffect(() => {
        loadSummaryData();
    }, []);

    // Refresh data when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('Summary screen focused, refreshing data...');
            loadSummaryData();
            setRefreshTrigger(prev => prev + 1);
        }, [])
    );

    const loadSummaryData = async () => {
        try {
            console.log('Loading summary data...');
            // Get today's date
            const today = new Date().toISOString().slice(0, 10);
            console.log('Today\'s date:', today);

            // getMeals() already filters by today's date by default
            const todaysMeals = await getMeals(today);
            const waterEntries = await getWaterEntries(today);
            const profile = await getProfile();

            console.log('Loaded today\'s meals:', todaysMeals.length);
            console.log('Loaded water entries:', waterEntries.length);
            console.log('Sample meal data:', todaysMeals[0]);
            console.log('Today\'s meal details:', todaysMeals.map(m => ({
                id: m.id,
                mealType: m.mealType,
                date: m.date,
                calories: m.calories,
                foodName: m.foodName
            })));

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
            const calorieGoal = profile?.dailyCaloriesTarget || 2200;

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
                    protein: { consumed: Math.round(totalProtein), goal: profile?.dailyProteinTarget || 150 },
                    carbs: { consumed: Math.round(totalCarbs), goal: profile?.dailyCarbsTarget || 250 },
                    fat: { consumed: Math.round(totalFat), goal: profile?.dailyFatTarget || 80 },
                },
                hydration: {
                    current: Math.round(totalWater),
                    goal: profile?.dailyWaterTarget || 2000,
                    maxRecommended: 4000,
                },
            });

            console.log('Final summary data:', {
                totalCalories,
                mealCalories,
                totalProtein,
                totalCarbs,
                totalFat,
                totalWater
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
                <View style={styles.section}>
                    <DailyNutritionSummary
                        calories={summaryData.calories}
                        macroNutrients={summaryData.macroNutrients}
                    />
                </View>

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