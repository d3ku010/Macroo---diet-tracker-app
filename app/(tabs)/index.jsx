import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { getMeals, getWaterEntries } from '../../utils/storage';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [todayMeals, setTodayMeals] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [monthlyData, setMonthlyData] = useState(null);
  const [todayWater, setTodayWater] = useState(0);

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
    // compute today's water total
    const waters = await getWaterEntries();
    const todayDate = new Date().toISOString().slice(0, 10);
    const todaySum = (waters || [])
      .filter(w => w.timestamp?.startsWith(todayDate))
      .reduce((s, w) => s + (w.amount || 0), 0);
    setTodayWater(todaySum);
  };

  useFocusEffect(
    useCallback(() => {
      // refresh today & monthly data when screen focuses
      loadMeals();
      computeMonthly();
    }, [])
  );

  // helper to compute monthly sums for a nutrient key
  const computeMonthly = async () => {
    const lastNDays = 30;
    const days = [];
    for (let i = lastNDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const meals = await getMeals();

    const proteinArr = [];
    const carbsArr = [];
    const fatArr = [];

    days.forEach((day) => {
      const dayMeals = meals.filter((m) => m.timestamp?.startsWith(day));
      const sumP = dayMeals.reduce((s, m) => s + (m.nutrients?.protein || 0), 0);
      const sumC = dayMeals.reduce((s, m) => s + (m.nutrients?.carbs || 0), 0);
      const sumF = dayMeals.reduce((s, m) => s + (m.nutrients?.fat || 0), 0);
      proteinArr.push(Number(sumP.toFixed(1)));
      carbsArr.push(Number(sumC.toFixed(1)));
      fatArr.push(Number(sumF.toFixed(1)));
    });

    const monthlyLabels = days.map((d, i) => {
      const date = new Date(d);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return i % 5 === 0 ? `${dd}/${mm}` : '';
    });

    setMonthlyData({
      labels: monthlyLabels,
      datasets: [
        { data: proteinArr, color: (opacity = 1) => `rgba(34,197,94,${opacity})`, strokeWidth: 3 },
        { data: carbsArr, color: (opacity = 1) => `rgba(255,159,67,${opacity})`, strokeWidth: 3 },
        { data: fatArr, color: (opacity = 1) => `rgba(142,68,173,${opacity})`, strokeWidth: 3 },
      ],
      legend: ['Protein (g)', 'Carbs (g)', 'Fat (g)'],
    });
  };

  const chartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{ data: [totals.protein, totals.carbs, totals.fat] }],
  };



  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      <Text style={styles.heading}>Today's Summary</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.caloriesText}>{totals.calories.toFixed(1)} kcal</Text>
        <View style={styles.nutrientsRow}>
          <Text style={styles.nutrientSmall}>P: {totals.protein.toFixed(1)} g</Text>
          <Text style={styles.nutrientSmall}>C: {totals.carbs.toFixed(1)} g</Text>
          <Text style={styles.nutrientSmall}>F: {totals.fat.toFixed(1)} g</Text>
        </View>
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#444', marginRight: 8 }}>💧</Text>
          <Text style={{ fontSize: 14, color: '#444' }}>{todayWater} ml</Text>
        </View>
      </View>

      <Text style={[styles.heading, { marginTop: 6 }]}>Monthly Dashboard</Text>
      {monthlyData ? (
        <View style={styles.chartCard}>
          <LineChart
            data={monthlyData}
            width={screenWidth - 48}
            height={260}
            chartConfig={{
              backgroundGradientFrom: '#f8fbff',
              backgroundGradientTo: '#f8fbff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              labelColor: () => '#666',
              propsForDots: { r: '3' },
            }}
            bezier
            style={{ borderRadius: 12 }}
            withDots={false}
          />
        </View>
      ) : (
        <Text style={{ color: '#777', marginBottom: 12 }}>Loading monthly data...</Text>
      )}

      <Text style={styles.heading}>Nutrient Chart (Today)</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={180}
        yAxisSuffix=""
        chartConfig={{
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#f6fbff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: () => '#333',
          style: { borderRadius: 12 },
        }}
        style={{
          borderRadius: 12,
          marginBottom: 24,
        }}
        fromZero
      />

      <Text style={styles.heading}>Meals Logged Today</Text>
      <View style={styles.mealsContainer}>
        {todayMeals.length === 0 ? (
          <Text style={{ color: '#777' }}>No meals logged today.</Text>
        ) : (
          <View style={{ width: '100%' }}>
            {todayMeals.map((meal, index) => (
              <View key={index} style={styles.mealItem}>
                <Text style={{ fontWeight: '600' }}>{meal.type}</Text>
                <Text style={{ color: '#444' }}>{meal.food} • {meal.quantity}g</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6fbff' },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#333' },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 12,
  },
  caloriesText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ff3b30',
    textAlign: 'center',
  },
  nutrientsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  nutrientSmall: { fontSize: 14, color: '#555', textAlign: 'center', flex: 1 },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 18,
    alignItems: 'center',
  },
  mealItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  mealsContainer: {
    // allow the outer ScrollView to control scrolling so all items remain reachable
    marginBottom: 20,
  },
});
