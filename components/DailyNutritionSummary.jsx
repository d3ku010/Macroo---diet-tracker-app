import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMeals, getProfile } from '../utils/supabaseStorage';
import { ProgressRing } from './charts/ProgressRing';
import { useTheme } from './ui/ThemeProvider';

const { width } = Dimensions.get('window');

// MyFitnessPal-inspired daily nutrition summary
const DailyNutritionSummary = ({ userId, date }) => {
    const { theme } = useTheme();
    const [nutrition, setNutrition] = useState({
        calories: { consumed: 0, goal: 2000, remaining: 2000 },
        protein: { consumed: 0, goal: 150 },
        carbs: { consumed: 0, goal: 250 },
        fat: { consumed: 0, goal: 67 },
        fiber: { consumed: 0, goal: 25 },
        sugar: { consumed: 0, goal: 50 },
        sodium: { consumed: 0, goal: 2300 },
    });
    const [waterIntake, setWaterIntake] = useState({ consumed: 0, goal: 2000 });

    useEffect(() => {
        loadDailyNutrition();
    }, [userId, date]);

    const loadDailyNutrition = async () => {
        // Implementation to calculate daily nutrition from meals
        try {
            const meals = await getMeals(date); // Pass date to get only meals for that date
            const profile = await getProfile();

            // Use all meals since we already filtered by date
            const todaysMeals = meals;

            // Calculate totals (nutrition is already calculated per meal in Supabase format)
            const totals = todaysMeals.reduce((acc, meal) => {
                acc.calories += meal.calories || 0;
                acc.protein += meal.protein || 0;
                acc.carbs += meal.carbs || 0;
                acc.fat += meal.fat || 0;
                return acc;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

            setNutrition({
                calories: {
                    consumed: Math.round(totals.calories),
                    goal: profile?.dailyCaloriesTarget || 2000,
                    remaining: Math.max(0, (profile?.dailyCaloriesTarget || 2000) - totals.calories)
                },
                protein: {
                    consumed: Math.round(totals.protein),
                    goal: profile?.dailyProteinTarget || 150
                },
                carbs: {
                    consumed: Math.round(totals.carbs),
                    goal: profile?.dailyCarbsTarget || 250
                },
                fat: {
                    consumed: Math.round(totals.fat),
                    goal: profile?.dailyFatTarget || 67
                },
            });
        } catch (error) {
            console.error('Failed to load daily nutrition:', error);
        }
    };

    const getProgressColor = (consumed, goal) => {
        const percentage = (consumed / goal) * 100;
        if (percentage < 50) return theme.warning;
        if (percentage < 80) return theme.primary;
        if (percentage <= 100) return theme.success;
        return theme.danger;
    };



    const MacroProgressBar = ({ label, consumed, goal, unit, color }) => {
        const percentage = Math.min((consumed / goal) * 100, 100);

        return (
            <View style={styles.macroContainer}>
                <View style={styles.macroHeader}>
                    <Text style={[styles.macroLabel, { color: theme.text }]}>{label}</Text>
                    <Text style={[styles.macroValue, { color: theme.text }]}>
                        {consumed}/{goal}{unit}
                    </Text>
                </View>
                <View style={[styles.progressBarBackground, { backgroundColor: theme.muted }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: color || getProgressColor(consumed, goal)
                            }
                        ]}
                    />
                </View>
                <Text style={[styles.percentageText, { color: theme.subText }]}>
                    {Math.round(percentage)}% of goal
                </Text>
            </View>
        );
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            style={styles.container}
        >
            {/* Calorie Summary - Main Focus */}
            <LinearGradient
                colors={[theme.primary + '20', theme.primary + '10']}
                style={[styles.calorieSection, { backgroundColor: theme.card }]}
            >
                <View style={styles.calorieHeader}>
                    <View style={styles.calorieInfo}>
                        <Text style={[styles.remainingCalories, { color: theme.text }]}>
                            {nutrition.calories.remaining}
                        </Text>
                        <Text style={[styles.remainingLabel, { color: theme.subText }]}>
                            Calories Remaining
                        </Text>
                    </View>
                    <ProgressRing
                        current={nutrition.calories.consumed}
                        target={nutrition.calories.goal}
                        size={60}
                        strokeWidth={6}
                        animated={true}
                    />
                </View>

                <View style={styles.calorieBreakdown}>
                    <View style={styles.calorieItem}>
                        <Text style={[styles.calorieNumber, { color: theme.success }]}>
                            {nutrition.calories.goal}
                        </Text>
                        <Text style={[styles.calorieSubtext, { color: theme.subText }]}>
                            Goal
                        </Text>
                    </View>
                    <Ionicons name="remove" size={20} color={theme.subText} />
                    <View style={styles.calorieItem}>
                        <Text style={[styles.calorieNumber, { color: theme.primary }]}>
                            {nutrition.calories.consumed}
                        </Text>
                        <Text style={[styles.calorieSubtext, { color: theme.subText }]}>
                            Food
                        </Text>
                    </View>
                    <Ionicons name="add" size={20} color={theme.subText} />
                    <View style={styles.calorieItem}>
                        <Text style={[styles.calorieNumber, { color: theme.warning }]}>
                            0
                        </Text>
                        <Text style={[styles.calorieSubtext, { color: theme.subText }]}>
                            Exercise
                        </Text>
                    </View>
                    <Ionicons name="trending-up" size={20} color={theme.subText} />
                    <View style={styles.calorieItem}>
                        <Text style={[styles.calorieNumber, { color: theme.text }]}>
                            {nutrition.calories.remaining}
                        </Text>
                        <Text style={[styles.calorieSubtext, { color: theme.subText }]}>
                            Net
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Macronutrients */}
            <View style={[styles.macrosSection, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Macronutrients
                </Text>

                <MacroProgressBar
                    label="Protein"
                    consumed={nutrition.protein.consumed}
                    goal={nutrition.protein.goal}
                    unit="g"
                    color={theme.success}
                />

                <MacroProgressBar
                    label="Carbs"
                    consumed={nutrition.carbs.consumed}
                    goal={nutrition.carbs.goal}
                    unit="g"
                    color={theme.warning}
                />

                <MacroProgressBar
                    label="Fat"
                    consumed={nutrition.fat.consumed}
                    goal={nutrition.fat.goal}
                    unit="g"
                    color={theme.danger}
                />
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
                <View style={styles.statItem}>
                    <Ionicons name="water" size={20} color={theme.primary} />
                    <Text style={[styles.statText, { color: theme.text }]}>
                        {waterIntake.consumed}ml
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="flame" size={20} color={theme.warning} />
                    <Text style={[styles.statText, { color: theme.text }]}>
                        {Math.round(nutrition.calories.consumed / 4)} meals
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="trophy" size={20} color={theme.success} />
                    <Text style={[styles.statText, { color: theme.text }]}>
                        {Math.round((nutrition.calories.consumed / nutrition.calories.goal) * 100)}%
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    scrollContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    calorieSection: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        width: width * 0.85, // Make cards smaller and scrollable
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    calorieHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calorieInfo: {
        flex: 1,
    },
    remainingCalories: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    remainingLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    ringCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    ringSubtext: {
        fontSize: 12,
    },
    calorieBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    calorieItem: {
        alignItems: 'center',
    },
    calorieNumber: {
        fontSize: 16,
        fontWeight: '600',
    },
    calorieSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    macrosSection: {
        marginBottom: 8,
        width: width * 0.75, // Make macro section smaller
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    macroContainer: {
        marginBottom: 12,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    macroLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    macroValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarBackground: {
        height: 8,
        borderRadius: 4,
        marginBottom: 2,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    percentageText: {
        fontSize: 12,
        textAlign: 'right',
    },
    quickStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#00000010',
        width: width * 0.75, // Match macrosSection width for consistency
    },
    statItem: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    statText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default DailyNutritionSummary;