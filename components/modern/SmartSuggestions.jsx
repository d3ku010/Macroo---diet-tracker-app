import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../ui/ThemeProvider';

export default function SmartSuggestions({ userGoals, currentNutrition, onFoodSelect }) {
    const { theme } = useTheme();
    const [suggestions, setSuggestions] = useState([]);
    const fadeAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        generateSmartSuggestions();

        Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [currentNutrition, userGoals]);

    const generateSmartSuggestions = () => {
        // Smart AI-like suggestions based on current nutrition gaps
        const protein = currentNutrition?.protein || 0;
        const carbs = currentNutrition?.carbs || 0;
        const fat = currentNutrition?.fat || 0;
        const calories = currentNutrition?.calories || 0;

        const proteinTarget = userGoals?.protein || 120;
        const carbTarget = userGoals?.carbs || 200;
        const fatTarget = userGoals?.fat || 60;
        const calorieTarget = userGoals?.calories || 2000;

        const smartSuggestions = [];

        // Protein suggestions
        if (protein < proteinTarget * 0.7) {
            smartSuggestions.push({
                id: 1,
                name: 'Grilled Chicken Breast',
                calories: 165,
                protein: 31,
                carbs: 0,
                fat: 3.6,
                reason: 'High protein, low calories',
                category: 'Protein',
                icon: 'restaurant',
                color: '#00B894',
                benefits: ['Muscle building', 'Satiety']
            });

            smartSuggestions.push({
                id: 2,
                name: 'Greek Yogurt',
                calories: 100,
                protein: 17,
                carbs: 6,
                fat: 0,
                reason: 'Complete protein source',
                category: 'Protein',
                icon: 'nutrition',
                color: '#00B894',
                benefits: ['Probiotics', 'Calcium']
            });
        }

        // Carb suggestions
        if (carbs < carbTarget * 0.6) {
            smartSuggestions.push({
                id: 3,
                name: 'Quinoa Bowl',
                calories: 222,
                protein: 8,
                carbs: 39,
                fat: 4,
                reason: 'Complex carbs for energy',
                category: 'Energy',
                icon: 'leaf',
                color: '#FDCB6E',
                benefits: ['Sustained energy', 'Fiber']
            });
        }

        // Healthy fat suggestions
        if (fat < fatTarget * 0.5) {
            smartSuggestions.push({
                id: 4,
                name: 'Avocado Toast',
                calories: 234,
                protein: 6,
                carbs: 12,
                fat: 21,
                reason: 'Healthy fats for brain',
                category: 'Healthy Fats',
                icon: 'heart',
                color: '#E17055',
                benefits: ['Heart health', 'Absorption']
            });
        }

        // Low calorie suggestions if over target
        if (calories > calorieTarget * 0.8) {
            smartSuggestions.push({
                id: 5,
                name: 'Mixed Green Salad',
                calories: 65,
                protein: 3,
                carbs: 7,
                fat: 4,
                reason: 'Low calorie, high nutrients',
                category: 'Light',
                icon: 'leaf-outline',
                color: '#74B9FF',
                benefits: ['Vitamins', 'Minerals']
            });
        }

        // Energy boost suggestions for low calories
        if (calories < calorieTarget * 0.4) {
            smartSuggestions.push({
                id: 6,
                name: 'Banana & Almond Butter',
                calories: 267,
                protein: 7,
                carbs: 27,
                fat: 16,
                reason: 'Quick energy boost',
                category: 'Energy',
                icon: 'flash',
                color: '#6C5CE7',
                benefits: ['Quick energy', 'Potassium']
            });
        }

        setSuggestions(smartSuggestions.slice(0, 4)); // Limit to 4 suggestions
    };

    const SuggestionCard = ({ suggestion, index }) => {
        const cardAnimation = useRef(new Animated.Value(0)).current;
        const pressAnimation = useRef(new Animated.Value(1)).current;

        useEffect(() => {
            Animated.spring(cardAnimation, {
                toValue: 1,
                useNativeDriver: true,
                delay: index * 150,
                tension: 50,
                friction: 7,
            }).start();
        }, []);

        const handlePressIn = () => {
            Animated.spring(pressAnimation, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        };

        const handlePressOut = () => {
            Animated.spring(pressAnimation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }).start();
        };

        const translateX = cardAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
        });

        const opacity = cardAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        return (
            <Animated.View
                style={[
                    styles.suggestionCard,
                    {
                        transform: [
                            { translateX },
                            { scale: pressAnimation }
                        ],
                        opacity,
                    }
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.cardContent,
                        {
                            backgroundColor: theme.background,
                            borderColor: suggestion.color + '30'
                        }
                    ]}
                    onPress={() => onFoodSelect?.(suggestion)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.8}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: suggestion.color }]}>
                            <Ionicons name={suggestion.icon} size={20} color="white" />
                        </View>
                        <View style={styles.categoryBadge}>
                            <Text style={[styles.categoryText, { color: suggestion.color }]}>
                                {suggestion.category}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.foodName, { color: theme.text }]}>
                        {suggestion.name}
                    </Text>

                    <Text style={[styles.reason, { color: theme.subText }]}>
                        {suggestion.reason}
                    </Text>

                    <View style={styles.nutritionRow}>
                        <View style={styles.nutritionItem}>
                            <Text style={[styles.nutritionValue, { color: theme.text }]}>
                                {suggestion.calories}
                            </Text>
                            <Text style={[styles.nutritionLabel, { color: theme.subText }]}>
                                cal
                            </Text>
                        </View>
                        <View style={styles.nutritionItem}>
                            <Text style={[styles.nutritionValue, { color: theme.text }]}>
                                {suggestion.protein}g
                            </Text>
                            <Text style={[styles.nutritionLabel, { color: theme.subText }]}>
                                protein
                            </Text>
                        </View>
                    </View>

                    <View style={styles.benefitsRow}>
                        {suggestion.benefits.slice(0, 2).map((benefit, idx) => (
                            <View
                                key={idx}
                                style={[styles.benefitChip, { backgroundColor: suggestion.color + '15' }]}
                            >
                                <Text style={[styles.benefitText, { color: suggestion.color }]}>
                                    {benefit}
                                </Text>
                            </View>
                        ))}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: theme.card,
                    opacity: fadeAnimation
                }
            ]}
        >
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Ionicons name="bulb" size={20} color="#6C5CE7" />
                    <Text style={[styles.title, { color: theme.text }]}>
                        Smart Suggestions
                    </Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.subText }]}>
                    Based on your goals and current intake
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                    />
                ))}
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    header: {
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        paddingRight: 16,
    },
    suggestionCard: {
        marginRight: 12,
    },
    cardContent: {
        width: 200,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(108, 92, 231, 0.1)',
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
    },
    foodName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    reason: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 12,
        lineHeight: 16,
    },
    nutritionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    nutritionItem: {
        alignItems: 'center',
    },
    nutritionValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    nutritionLabel: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    benefitsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    benefitChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    benefitText: {
        fontSize: 10,
        fontWeight: '600',
    },
});