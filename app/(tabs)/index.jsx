import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MacroRatioPieChart from '../../components/charts/MacroRatioPieChart';
import { MultiProgressRing, ProgressRing } from '../../components/charts/ProgressRing';
import DailyNutritionSummary from '../../components/DailyNutritionSummary';
import HydrationProgress from '../../components/HydrationProgress';
import ResponsiveCard from '../../components/layout/ResponsiveCard';
import ResponsiveLayout from '../../components/layout/ResponsiveLayout';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../components/ui/ThemeProvider';
import { checkMealAchievements, initializeAchievements } from '../../utils/achievements';
import { generateNutritionInsights } from '../../utils/recommendations';
import { getCustomMacroTargets, suggestCalories } from '../../utils/storage';
import { deleteMeal, getMeals, getProfile, getWaterEntries, updateMeal } from '../../utils/supabaseStorage';
import { toast } from '../../utils/toast';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { theme } = useTheme();
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
  const [customTargets, setCustomTargets] = useState(null);
  const [nutritionInsights, setNutritionInsights] = useState([]);
  const [showInsights, setShowInsights] = useState(false);

  const loadMeals = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const filtered = await getMeals(today); // Get only today's meals

    const sum = filtered.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // Round totals for consistent display
    sum.calories = Math.round(sum.calories);
    sum.protein = Math.round(sum.protein * 10) / 10;
    sum.carbs = Math.round(sum.carbs * 10) / 10;
    sum.fat = Math.round(sum.fat * 10) / 10;

    setTodayMeals(filtered);
    setTotals(sum);

    // Initialize achievements system
    await initializeAchievements();

    // Check achievements
    await checkMealAchievements(filtered);

    // compute today's water total
    const waters = await getWaterEntries();
    const todayDate = new Date().toISOString().slice(0, 10);
    const todaySum = (waters || [])
      .filter(w => w.date === todayDate)
      .reduce((s, w) => s + (w.amount || 0), 0);
    setTodayWater(todaySum);

    const prof = await getProfile();
    if (prof?.dailyWaterGoalMl) setProfileGoal(prof.dailyWaterGoalMl);

    // Get custom targets or calculate defaults
    const customTargets = await getCustomMacroTargets();
    setCustomTargets(customTargets);

    const rec = suggestCalories(prof);
    if (rec) setRecommendedCal(rec);

    // Generate nutrition insights
    const insights = await generateNutritionInsights();
    setNutritionInsights(insights);
  };

  const handleDeleteMeal = async (mealId) => {
    const removed = await deleteMeal(mealId);
    await loadMeals();
    toast({ message: 'Meal deleted', type: 'error', action: { label: 'Undo', onPress: async () => { if (removed) { await saveMeal(removed); await loadMeals(); toast('Restored meal', 'success'); } } } });
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
    await updateMeal(editingMeal.id, updated);
    setEditModalVisible(false);
    setEditingMeal(null);
    await loadMeals();
    toast('Meal updated successfully!', 'success');
  };

  useFocusEffect(
    useCallback(() => {
      // refresh today when screen focuses
      loadMeals();
    }, [])
  );

  // monthly data moved to Monthly tab

  // simplified: we won't show nutrient chart on home — monthly tab handles trends





  return (
    <ResponsiveLayout>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.heading, { color: theme.text }]}>Today's Summary</Text>
      </View>

      {/* MyFitnessPal-Style Daily Summary */}
      <DailyNutritionSummary
        userId="current_user"
        date={new Date().toISOString().slice(0, 10)}
      />

      <ResponsiveCard size="large">
        {/* Progress Rings Section */}
        <ScrollView
          horizontal={screenWidth < 350}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressSection}
        >
          {recommendedCal && (
            <ProgressRing
              current={totals.calories}
              target={recommendedCal}
              size={screenWidth < 380 ? 80 : 100}
              label="Calories"
              unit="kcal"
              color={theme.danger}
            />
          )}

          {/* Multi-progress ring for macros */}
          <MultiProgressRing
            size={screenWidth < 380 ? 100 : 120}
            metrics={[
              {
                label: 'Protein',
                current: totals.protein,
                target: customTargets?.protein || (recommendedCal ? Math.round(recommendedCal * 0.25 / 4) : 125),
                color: theme.success,
              },
              {
                label: 'Carbs',
                current: totals.carbs,
                target: customTargets?.carbs || (recommendedCal ? Math.round(recommendedCal * 0.45 / 4) : 225),
                color: theme.primary,
              },
              {
                label: 'Fat',
                current: totals.fat,
                target: customTargets?.fat || (recommendedCal ? Math.round(recommendedCal * 0.30 / 9) : 67),
                color: theme.fat,
              },
            ]}
          />
        </ScrollView>

        {/* Macro Pie Chart */}
        <MacroRatioPieChart
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
          size="small"
          showLegend={false}
        />

        {/* Hydration Progress */}
        <View style={{ width: '100%', marginTop: 12 }}>
          <HydrationProgress currentMl={todayWater} goalMl={profileGoal} />
        </View>

        {/* Nutrition Insights */}
        {nutritionInsights.length > 0 && (
          <TouchableOpacity
            style={styles.insightsToggle}
            onPress={() => setShowInsights(!showInsights)}
          >
            <Ionicons
              name={showInsights ? 'chevron-up' : 'bulb-outline'}
              size={16}
              color={theme.primary}
            />
            <Text style={[styles.insightsText, { color: theme.primary }]}>
              {showInsights ? 'Hide Insights' : `${nutritionInsights.length} Nutrition Insights`}
            </Text>
          </TouchableOpacity>
        )}

        {showInsights && (
          <View style={styles.insightsContainer}>
            {nutritionInsights.slice(0, 3).map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightItem,
                  {
                    backgroundColor: insight.type === 'warning' ? theme.danger + '20' : theme.primary + '20',
                    borderColor: insight.type === 'warning' ? theme.danger : theme.primary,
                  }
                ]}
              >
                <Ionicons
                  name={insight.type === 'warning' ? 'warning-outline' : 'information-circle-outline'}
                  size={16}
                  color={insight.type === 'warning' ? theme.danger : theme.primary}
                />
                <Text style={[styles.insightText, { color: theme.text }]}>
                  {insight.message}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ResponsiveCard>

      <Text style={[styles.heading, { color: theme.text }]}>Meals Logged Today</Text>
      <View style={styles.mealsContainerSimple}>
        {todayMeals.length === 0 ? (
          <ResponsiveCard size="medium">
            <Text style={{ color: theme.subText, textAlign: 'center' }}>No meals logged today.</Text>
          </ResponsiveCard>
        ) : (
          todayMeals.map((meal) => (
            <ResponsiveCard key={meal.id} size="medium" style={[styles.mealCard, { borderColor: theme.border }]}>
              {/* Header with food name and actions */}
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <View style={styles.foodNameRow}>
                    <View style={[styles.mealTypeBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.mealTypeText, { color: theme.primary }]}>
                        {meal.mealType?.charAt(0).toUpperCase() + meal.mealType?.slice(1) || 'Meal'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={2}>
                    🍽️ {meal.food || meal.foodName}
                  </Text>
                </View>
                <View style={styles.mealActions}>
                  <TouchableOpacity onPress={() => openEditMeal(meal)} style={[styles.actionButton, { backgroundColor: theme.primaryLight }]} accessibilityLabel="Edit meal">
                    <Ionicons name="pencil" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteMeal(meal.id)} style={[styles.actionButton, { backgroundColor: theme.dangerLight || theme.primaryLight, marginLeft: 8 }]} accessibilityLabel="Delete meal">
                    <Ionicons name="trash" size={16} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calorie and quantity info */}
              <View style={styles.calorieRow}>
                <View style={styles.calorieInfo}>
                  <Text style={[styles.calorieCount, { color: theme.primary }]}>
                    {Math.round(meal.calories || 0)}
                  </Text>
                  <Text style={[styles.calorieLabel, { color: theme.subText }]}>kcal</Text>
                </View>
                <Text style={[styles.quantityText, { color: theme.subText }]}>
                  {meal.quantity}g
                </Text>
              </View>

              {/* Macro breakdown */}
              <View style={[styles.macroRow, { borderTopColor: theme.border }]}>
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: theme.success }]}>
                    {(meal.protein || 0).toFixed(1)}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: theme.subText }]}>Protein</Text>
                </View>
                <View style={[styles.macroSeparator, { backgroundColor: theme.border }]} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: theme.primary }]}>
                    {(meal.carbs || 0).toFixed(1)}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: theme.subText }]}>Carbs</Text>
                </View>
                <View style={[styles.macroSeparator, { backgroundColor: theme.border }]} />
                <View style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: theme.warning || theme.fat }]}>
                    {(meal.fat || 0).toFixed(1)}g
                  </Text>
                  <Text style={[styles.macroLabel, { color: theme.subText }]}>Fat</Text>
                </View>
              </View>
            </ResponsiveCard>
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
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    fontSize: screenWidth < 380 ? 18 : 20,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8
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
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  mealTitle: { fontWeight: '700', fontSize: screenWidth < 380 ? 14 : 16, flex: 1 },
  mealMeta: { marginTop: 6, fontSize: 13 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  macroText: { fontSize: 13 },
  macroTime: { fontSize: 12, marginLeft: 8 },
  inlinePct: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  inlinePctText: { fontWeight: '800' },
  mealHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mealTitleLeft: { flex: 1, paddingRight: 12, minWidth: 0 },
  mealRightTop: { alignItems: 'flex-end', flexShrink: 0 },
  mealQty: { fontWeight: '700', fontSize: screenWidth < 380 ? 12 : 13 },
  macroRowCompact: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  // New improved meal card styles
  mealCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
    paddingRight: 12,
  },
  foodNameRow: {
    marginBottom: 6,
  },
  mealTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  mealTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calorieInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  calorieLabel: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macroLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroSeparator: {
    width: 1,
    height: 20,
    // backgroundColor will be set inline with theme.border
    opacity: 0.5,
  },
  progressSection: {
    flexDirection: screenWidth < 380 ? 'column' : 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    gap: screenWidth < 380 ? 12 : 0,
  },
  insightsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  insightsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  insightsContainer: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 11,
    flex: 1,
    marginLeft: 6,
    lineHeight: 14,
  },
});
