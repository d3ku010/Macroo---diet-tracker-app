import { useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { getMeals } from '../../utils/storage';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [todayMeals, setTodayMeals] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const loadMeals = async () => {
    const data = await getMeals();
    const today = new Date().toISOString().slice(0, 10);
    const filtered = data.filter(m => m.timestamp?.startsWith(today));

    const sum = filtered.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.nutrients?.calories || 0),
        protein: acc.protein + (m.nutrients?.protein || 0),
        carbs: acc.carbs + (m.nutrients?.carbs || 0),
        fat: acc.fat + (m.nutrients?.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    setTodayMeals(filtered);
    setTotals(sum);
  };

  useFocusEffect(() => {
    loadMeals();
  });

  const chartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{ data: [totals.protein, totals.carbs, totals.fat] }],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Today's Summary</Text>

      <View style={styles.graphBox}>
        <Text>Calories: {totals.calories.toFixed(1)} kcal</Text>
        <Text>Protein: {totals.protein.toFixed(1)} g</Text>
        <Text>Carbs: {totals.carbs.toFixed(1)} g</Text>
        <Text>Fat: {totals.fat.toFixed(1)} g</Text>
      </View>

      <Text style={styles.heading}>Nutrient Chart</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix=""
        chartConfig={{
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: () => '#333',
          decimalPlaces: 1,
        }}
        style={{
          borderRadius: 12,
          marginBottom: 24,
        }}
        fromZero
      />

      <Text style={styles.heading}>Meals Logged Today</Text>
      {todayMeals.length === 0 ? (
        <Text style={{ color: '#777' }}>No meals logged today.</Text>
      ) : (
        todayMeals.map((meal, index) => (
          <View key={index} style={styles.mealItem}>
            <Text>{meal.type}: {meal.food} ({meal.quantity}g)</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  graphBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#e0f0ff',
  },
  mealItem: {
    backgroundColor: '#f3f3f3',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
});
