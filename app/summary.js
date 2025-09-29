import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import DailyCalorieChart from '../components/DailyCalorieChart';
import { getFoodList, getMeals } from '../utils/storage';

export default function SummaryScreen() {
    const [meals, setMeals] = useState([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [chartData, setChartData] = useState([]);
    const [foodList, setFoodList] = useState([]);

    useEffect(() => {
        loadFoodsAndMeals();
    }, []);

    const loadFoodsAndMeals = async () => {
        const foods = await getFoodList();
        setFoodList(foods);

        const allMeals = await getMeals();
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = allMeals.filter((m) =>
            m.timestamp.startsWith(today)
        );

        let total = 0;
        const chart = todayMeals.map((m, i) => {
            const food = foods.find((f) => f.name === m.food);
            const caloriesPerUnit = food?.calories || 0;
            const cal = m.quantity * caloriesPerUnit / 100;
            total += cal;
            return { meal: `${m.food} #${i + 1}`, calories: cal };
        });

        setMeals(todayMeals);
        setTotalCalories(Math.round(total));
        setChartData(chart);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Today's Summary</Text>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>
                Total Calories: {totalCalories} kcal
            </Text>

            {chartData.length > 0 ? (
                <DailyCalorieChart data={chartData} />
            ) : (
                <Text style={{ color: '#777' }}>No meals logged today.</Text>
            )}

            <View style={{ marginTop: 30 }}>
                <Text style={[styles.label, { marginBottom: 10 }]}>Meal History:</Text>
                {meals.map((m, i) => (
                    <View key={i} style={styles.mealCard}>
                        <Text style={styles.mealText}>
                            {m.quantity} × {m.food}
                        </Text>
                        <Text style={{ color: '#999', fontSize: 12 }}>
                            {new Date(m.timestamp).toLocaleTimeString()}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 40,
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
    },
    mealCard: {
        backgroundColor: '#f2f2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    mealText: {
        fontSize: 16,
    },
});
