import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { getMeals, getProfile } from '../utils/supabaseStorage';
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

    const ProgressRing = ({ consumed, goal, size = 60, strokeWidth = 6 }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const percentage = Math.min((consumed / goal) * 100, 100);
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size} style={{ position: 'absolute' }}>
                    {/* Background circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={theme.muted}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={getProgressColor(consumed, goal)}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                </Svg>
                <View style={[styles.ringCenter, { width: size, height: size }]}>
                    <Text style={[styles.ringText, { color: theme.text }]}>
                        {consumed}
                    </Text>
                    <Text style={[styles.ringSubtext, { color: theme.subText }]}>
                        /{goal}
                    </Text>
                </View>
            </View>
        );
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
        <View style={[styles.container, { backgroundColor: theme.card }]}>
            {/* Calorie Summary - Main Focus */}
            <LinearGradient
                colors={[theme.primary + '20', theme.primary + '10']}
                style={styles.calorieSection}
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
                        consumed={nutrition.calories.consumed}
                        goal={nutrition.calories.goal}
                        size={80}
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
            <View style={styles.macrosSection}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    calorieSection: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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
        marginBottom: 16,
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