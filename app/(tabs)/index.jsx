import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import HydrationProgress from '../../components/HydrationProgress';
import PaletteSwitcher from '../../components/ui/PaletteSwitcher';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../components/ui/ThemeProvider';
import { deleteMeal, getMeals, getProfile, getWaterEntries, suggestCalories, updateMeal } from '../../utils/storage';
import { toast } from '../../utils/toast';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { theme, toggle } = useTheme();
  const [todayMeals, setTodayMeals] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [recommendedCal, setRecommendedCal] = useState(null);
  const [todayWater, setTodayWater] = useState(0);
  const [profileGoal, setProfileGoal] = useState(2000);

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
    const prof = await getProfile();
    if (prof?.dailyWaterGoalMl) setProfileGoal(prof.dailyWaterGoalMl);
    const rec = suggestCalories(prof);
    if (rec) setRecommendedCal(rec);
  };

  const handleDeleteMeal = async (ts) => {
    const removed = await deleteMeal(ts);
    await loadMeals();
    toast({ message: 'Meal deleted', type: 'error', action: { label: 'Undo', onPress: async () => { if (removed) { const { saveMealEntry } = require('../../utils/storage'); await saveMealEntry(removed); await loadMeals(); toast('Restored meal', 'success'); } } } });
  };

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  const openEditMeal = (meal) => {
    setEditingMeal(meal);
    setEditQuantity(String(meal.quantity || ''));
    setEditModalVisible(true);
  };

  const handleSaveMealEdit = async () => {
    if (!editingMeal) return;
    const updated = { quantity: parseFloat(editQuantity) || editingMeal.quantity };
    await updateMeal(editingMeal.timestamp, updated);
    setEditModalVisible(false);
    setEditingMeal(null);
    await loadMeals();
    // reuse toast
    const { showToast } = require('../../components/ui/Toast');
  };

  useFocusEffect(
    useCallback(() => {
      // refresh today when screen focuses
      loadMeals();
    }, [])
  );

  // monthly data moved to Monthly tab

  // simplified: we won't show nutrient chart on home — monthly tab handles trends



  const anim = useRef(new Animated.Value(0)).current;

  const pressToggle = () => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(() => toggle());
  };

  const rotation = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '220deg'] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.heading, { color: theme.text }]}>Today's Summary</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <PaletteSwitcher compact />
          <TouchableOpacity onPress={pressToggle} accessibilityLabel="Toggle theme" style={{ padding: 8 }}>
            <Animated.View style={{ transform: [{ rotate: rotation }, { scale }] }}>
              <Ionicons name={theme.name === 'dark' ? 'moon' : 'sunny'} size={20} color={theme.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.card, shadowColor: theme.muted }]}>
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.caloriesLabel, { color: theme.subText }]}>Calories</Text>
            <Text style={[styles.caloriesText, { color: theme.primary, textAlign: 'left' }]}>{totals.calories.toFixed(0)} kcal</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {recommendedCal ? (
              <Text style={[styles.calorieSub, { color: theme.subText }]}>{`${totals.calories.toFixed(0)} / ${recommendedCal} kcal`}</Text>
            ) : null}
            {recommendedCal ? (
              <View style={styles.inlinePct}>
                <Text style={styles.inlinePctText}>{Math.round((totals.calories / recommendedCal) * 100)}%</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={[styles.nutrientsRow, { marginTop: 12 }]}>
          <View style={styles.macroItem}><Text style={[styles.macroLabel, { color: theme.subText }]}>Protein</Text><Text style={[styles.macroValue, { color: theme.success }]}>{totals.protein.toFixed(1)} g</Text></View>
          <View style={styles.macroItem}><Text style={[styles.macroLabel, { color: theme.subText }]}>Carbs</Text><Text style={[styles.macroValue, { color: theme.primary }]}>{totals.carbs.toFixed(1)} g</Text></View>
          <View style={styles.macroItem}><Text style={[styles.macroLabel, { color: theme.subText }]}>Fat</Text><Text style={[styles.macroValue, { color: theme.fat }]}>{totals.fat.toFixed(1)} g</Text></View>
        </View>
        <View style={{ width: '100%', marginTop: 12 }}>
          <HydrationProgress currentMl={todayWater} goalMl={profileGoal} />
        </View>

      </View>

      <Text style={[styles.heading, { color: theme.text }]}>Meals Logged Today</Text>
      <View style={styles.mealsContainerSimple}>
        {todayMeals.length === 0 ? (
          <Text style={{ color: theme.subText }}>No meals logged today.</Text>
        ) : (
          todayMeals.map((meal) => (
            <View key={meal.timestamp} style={styles.mealItem}>
              <View style={styles.mealHeaderTop}>
                <View style={styles.mealTitleLeft}>
                  <View style={styles.mealTitleRow}>
                    <View style={[styles.badge, { backgroundColor: theme.pillBg }]}>
                      <Text style={[styles.badgeText, { color: theme.text }]}>{meal.type}</Text>
                    </View>
                    <Text style={[styles.mealTitle, { color: theme.text }]}>{meal.food}</Text>
                  </View>
                </View>
                <View style={styles.mealRightTop}>
                  <Text style={[styles.mealQty, { color: theme.text }]}>{meal.quantity} g • {(meal.nutrients?.calories || 0).toFixed(0)} kcal</Text>
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    <TouchableOpacity onPress={() => openEditMeal(meal)} style={styles.iconButton} accessibilityLabel="Edit meal">
                      <Ionicons name="pencil" size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteMeal(meal.timestamp)} style={[styles.iconButton, { marginLeft: 8 }]} accessibilityLabel="Delete meal">
                      <Ionicons name="trash" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.macroRowCompact}>
                <Text style={[styles.macroText, { color: theme.subText }]}>P {(meal.nutrients?.protein || 0).toFixed(1)}g</Text>
                <Text style={[styles.macroText, { color: theme.subText }]}>C {(meal.nutrients?.carbs || 0).toFixed(1)}g</Text>
                <Text style={[styles.macroText, { color: theme.subText }]}>F {(meal.nutrients?.fat || 0).toFixed(1)}g</Text>
                <Text style={[styles.macroTime, { color: theme.subText }]}>{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          ))
        )}
      </View>
      <Modal visible={editModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, color: theme.text }}>Edit Meal</Text>
            <Text style={{ color: theme.subText, marginBottom: 8 }}>{editingMeal?.food}</Text>
            <TextInput value={editQuantity} onChangeText={setEditQuantity} placeholder="Quantity (g)" keyboardType="numeric" style={{ borderWidth: 1, borderColor: theme.muted, padding: 10, borderRadius: 8, marginBottom: 8, color: theme.text }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <PrimaryButton title="Cancel" onPress={() => setEditModalVisible(false)} style={{ marginRight: 8 }} />
              <PrimaryButton title="Save" onPress={handleSaveMealEdit} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryCard: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 12,
  },
  caloriesLabel: { fontSize: 12, fontWeight: '600' },
  caloriesText: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  nutrientsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  nutrientSmall: { fontSize: 14, textAlign: 'center', flex: 1 },
  chartCard: {
    borderRadius: 14,
    padding: 12,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 18,
    alignItems: 'center',
  },
  mealItem: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  mealsContainer: {
    // allow the outer ScrollView to control scrolling so all items remain reachable
    marginBottom: 20,
  },
  recommendedLabel: { fontSize: 12 },
  recommendedValue: { fontWeight: '700' },
  calorieRow: { flexDirection: 'row', alignItems: 'center' },
  caloriePercent: { width: 40, fontWeight: '800' },
  calorieBarBg: { flex: 1, height: 10, borderRadius: 8, overflow: 'hidden' },
  calorieBarFill: { height: 10 },
  miniRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  miniLabel: { width: 18, fontWeight: '700' },
  miniBg: { flex: 1, height: 8, borderRadius: 6, overflow: 'hidden', marginHorizontal: 8 },
  miniFill: { height: 8 },
  miniVal: { width: 48, textAlign: 'right' },
  /* new meal card styles */
  mealsContainerSimple: { marginBottom: 20 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mealInfo: { flex: 1, paddingRight: 8 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  mealTitle: { fontWeight: '700', fontSize: 16 },
  mealMeta: { marginTop: 6, fontSize: 13 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 6, borderRadius: 8 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  macroText: { fontSize: 13 },
  macroTime: { fontSize: 12, marginLeft: 8 },
  inlinePct: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  inlinePctText: { fontWeight: '800' },
  mealHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mealTitleLeft: { flex: 1, paddingRight: 8 },
  mealRightTop: { alignItems: 'flex-end' },
  mealQty: { fontWeight: '700' },
  macroRowCompact: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
