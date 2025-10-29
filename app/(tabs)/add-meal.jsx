import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import BarcodeScanner from '../../components/forms/BarcodeScanner';
import EnhancedFoodSearch from '../../components/forms/EnhancedFoodSearch';
import MealPhotoCapture from '../../components/forms/MealPhotoCapture';
import MealTemplateForm from '../../components/forms/MealTemplateForm';
import ResponsiveCard from '../../components/layout/ResponsiveCard';
import ResponsiveLayout from '../../components/layout/ResponsiveLayout';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { useTheme } from '../../components/ui/ThemeProvider';
import { getMealTypeRecommendations, recommendFoods } from '../../utils/recommendations';
import { findFoodByName, getFoodDatabase, saveMeal, saveWaterEntry } from '../../utils/supabaseStorage';
import { toast } from '../../utils/toast';

export default function AddMealScreen() {
  const { theme } = useTheme();
  const [mealType, setMealType] = useState('Breakfast');
  const [foodList, setFoodList] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [waterMl, setWaterMl] = useState('250');
  const [addMode, setAddMode] = useState('search'); // 'search', 'template', 'camera', 'barcode'
  const [recommendations, setRecommendations] = useState([]);
  const [mealRecommendations, setMealRecommendations] = useState([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [mealPhoto, setMealPhoto] = useState(null);
  const [showMealConfirmDialog, setShowMealConfirmDialog] = useState(false);
  const [showWaterConfirmDialog, setShowWaterConfirmDialog] = useState(false);
  const [pendingMealData, setPendingMealData] = useState(null);
  const [pendingWaterData, setPendingWaterData] = useState(null);
  const scale = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    loadFoodList();
    loadRecommendations();
  }, []);

  useEffect(() => {
    loadMealTypeRecommendations();
  }, [mealType]);

  const loadFoodList = async () => {
    const saved = await getFoodDatabase();
    setFoodList(saved);
  };

  const loadRecommendations = async () => {
    try {
      const recs = await recommendFoods(3);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const loadMealTypeRecommendations = async () => {
    try {
      const recs = await getMealTypeRecommendations(mealType);
      setMealRecommendations(recs);
    } catch (error) {
      console.error('Failed to load meal type recommendations:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!quantity) {
      toast('Please enter quantity', 'error');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0 || qty > 10000) {
      toast('Please enter a valid quantity (1-10000g)', 'error');
      return;
    }

    if (!selectedFood) {
      toast('Please select a food', 'error');
      return;
    }

    // Prepare meal data and show confirmation dialog
    const nutrients = {
      calories: Math.round((selectedFood.calories * qty) / 100),
      protein: Math.round(((selectedFood.protein * qty) / 100) * 10) / 10,
      carbs: Math.round(((selectedFood.carbs * qty) / 100) * 10) / 10,
      fat: Math.round(((selectedFood.fat * qty) / 100) * 10) / 10,
    };

    setPendingMealData({
      selectedFood,
      quantity: qty,
      mealType,
      nutrients,
      mealPhoto
    });
    setShowMealConfirmDialog(true);
  };

  const confirmAddMeal = async () => {
    const { selectedFood, quantity: qty, mealType, nutrients, mealPhoto } = pendingMealData;

    // Find the food in Supabase to get its ID
    const foodInDatabase = await findFoodByName(selectedFood.name);
    if (!foodInDatabase) {
      toast('Food not found in database. Please add it first.', 'error');
      setShowMealConfirmDialog(false);
      return;
    }

    const newMeal = {
      foodId: foodInDatabase.id,
      mealType: mealType.toLowerCase(),
      quantity: qty,
      servingSize: selectedFood.serving_size || '100g',
      date: new Date().toISOString().split("T")[0],
      notes: mealPhoto ? 'Meal photo attached' : null,
    };

    await saveMeal(newMeal);

    // Generate engaging food confirmation messages
    const getFoodMessage = (food, quantity, meal, calories) => {
      const mealEmojis = {
        breakfast: '🌅',
        lunch: '☀️',
        dinner: '🌙',
        snack: '🍎'
      };

      const encouragements = [
        'Nutrition on point!',
        'Great choice!',
        'Fueling your goals!',
        'Smart eating!',
        'Perfect portion!'
      ];

      const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
      const mealEmoji = mealEmojis[meal.toLowerCase()] || '🍽️';

      if (calories >= 300) {
        return `${mealEmoji} ${food} (${quantity}g) added to ${meal}! ${calories} cals - ${randomEncouragement} 💪`;
      } else if (calories >= 150) {
        return `${mealEmoji} ${food} (${quantity}g) logged for ${meal}! ${calories} cals - ${randomEncouragement} ⭐`;
      } else {
        return `${mealEmoji} ${food} (${quantity}g) tracked as ${meal}! ${calories} cals - ${randomEncouragement} ✨`;
      }
    };

    toast(getFoodMessage(selectedFood.name, qty, mealType, nutrients.calories), 'success');
    setQuantity('');
    setSelectedFood(null);
    setMealPhoto(null);
    setShowMealConfirmDialog(false);
    setPendingMealData(null);

    // Refresh recommendations after adding meal
    loadRecommendations();
  };

  const handleAddWater = async () => {
    const ml = parseInt(waterMl, 10);
    if (!ml || ml <= 0) {
      toast('Please enter a valid amount in ml', 'error');
      return;
    }

    // Show confirmation dialog
    setPendingWaterData({ amount: ml });
    setShowWaterConfirmDialog(true);
  };

  const confirmAddWater = async () => {
    const { amount: ml } = pendingWaterData;

    await saveWaterEntry({
      amount: ml,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    });

    // simple scale animation to indicate success
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();

    // Generate cool and catchy water confirmation messages
    const getWaterMessage = (amount) => {
      if (amount >= 500) {
        return `🌊 Fantastic! ${amount}ml logged - You're crushing your hydration goals! 💪`;
      } else if (amount >= 300) {
        return `💦 Great job! ${amount}ml added - Keep that hydration flow going! ✨`;
      } else if (amount >= 200) {
        return `🥤 Nice sip! ${amount}ml logged - Every drop counts towards wellness! 🌟`;
      } else {
        return `💧 Perfect! ${amount}ml tracked - Small sips, big results! 🎯`;
      }
    };

    toast(getWaterMessage(ml), 'success');
    setWaterMl('250');
    setShowWaterConfirmDialog(false);
    setPendingWaterData(null);
  };


  const addScale = useRef(new Animated.Value(1)).current;

  const onPressAdd = async () => {
    Animated.sequence([
      Animated.timing(addScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(addScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    await handleAddMeal();
  };

  const handleBarcodeFood = (foodInfo) => {
    // Convert barcode food info to our food format
    const food = {
      name: `${foodInfo.brand ? foodInfo.brand + ' ' : ''}${foodInfo.name}`,
      calories: foodInfo.nutrients.calories || 0,
      protein: foodInfo.nutrients.protein || 0,
      carbs: foodInfo.nutrients.carbs || 0,
      fat: foodInfo.nutrients.fat || 0,
    };

    setSelectedFood(food);
    setQuantity(foodInfo.servingSize ? foodInfo.servingSize.toString() : '100');
    setShowBarcodeScanner(false);
    toast('Product found!', 'success');
  };

  const handlePhotoTaken = (photoUri) => {
    setMealPhoto(photoUri);
    setShowPhotoCapture(false);
    if (photoUri) {
      toast('Photo added!', 'success');
    } else {
      toast('Photo removed', 'info');
    }
  };

  return (
    <ResponsiveLayout>
      <Text style={[styles.heading, { color: theme.text }]}>Log a Meal</Text>

      {/* Add Mode Selector */}
      <SegmentedControl
        options={[
          { key: 'search', label: 'Search' },
          { key: 'template', label: 'Templates' },
          { key: 'barcode', label: 'Barcode' },
        ]}
        value={addMode}
        onChange={setAddMode}
        style={styles.modeSelector}
      />

      <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
        <Text style={[styles.label, { color: theme.subText }]}>Meal Type</Text>
        <Picker
          selectedValue={mealType}
          onValueChange={setMealType}
          style={[styles.picker, {
            color: theme.text,
            backgroundColor: theme.card,
            borderColor: theme.border
          }]}
          itemStyle={{ color: theme.text }}
          dropdownIconColor={theme.text}
        >
          <Picker.Item label="Breakfast" value="Breakfast" color={theme.text} />
          <Picker.Item label="Lunch" value="Lunch" color={theme.text} />
          <Picker.Item label="Dinner" value="Dinner" color={theme.text} />
          <Picker.Item label="Snack" value="Snack" color={theme.text} />
          <Picker.Item label="Other" value="Other" color={theme.text} />
        </Picker>

        {/* Recommendations for meal type */}
        {mealRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={[styles.recommendationsTitle, { color: theme.text }]}>
              Recommended for {mealType}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mealRecommendations.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.recommendationChip,
                    {
                      backgroundColor: selectedFood?.name === food.name ? theme.primary : theme.muted,
                      borderColor: theme.primary,
                    }
                  ]}
                  onPress={() => setSelectedFood(food)}
                >
                  <Text style={[
                    styles.recommendationText,
                    { color: selectedFood?.name === food.name ? theme.onPrimary : theme.text }
                  ]}>
                    {food.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ResponsiveCard>

      {addMode === 'search' && (
        <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: theme.text }]}>Select Food</Text>
          <View style={[styles.pickerContainer, { backgroundColor: theme.background, borderColor: theme.muted }]}>
            <Picker
              selectedValue={selectedFood?.name || ''}
              onValueChange={(itemValue) => {
                if (itemValue) {
                  const food = foodList.find(f => f.name === itemValue);
                  setSelectedFood(food);
                }
              }}
              style={[styles.picker, { color: theme.text }]}
            >
              <Picker.Item label="Choose food item..." value="" />
              {foodList.map((food, index) => (
                <Picker.Item
                  key={index}
                  label={`${food.name} (${food.calories} cal/100g)`}
                  value={food.name}
                />
              ))}
            </Picker>
          </View>

          {/* Search option for finding new foods */}
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.muted, borderColor: theme.primary }]}
            onPress={() => setAddMode('searchForm')}
          >
            <Ionicons name="search-outline" size={20} color={theme.primary} />
            <Text style={[styles.searchButtonText, { color: theme.primary }]}>
              Search for new food items
            </Text>
          </TouchableOpacity>
        </ResponsiveCard>
      )}

      {addMode === 'searchForm' && (
        <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: theme.text }]}>🔍 Enhanced Food Search</Text>
          <EnhancedFoodSearch
            onFoodSelect={(food) => {
              setSelectedFood(food);
              setAddMode('search'); // Go back to dropdown after selection
              toast({
                type: 'success',
                message: `Selected ${food.name}`,
                details: `${food.calories} cal • ${food.source || 'Local'} database`
              });
            }}
            onBarcodePress={() => {
              setShowBarcodeScanner(true);
              setAddMode('search');
            }}
            placeholder="Search foods, brands, or scan barcode..."
            showRecentSearches={true}
          />

          {/* Fallback to old search */}
          <TouchableOpacity
            style={[styles.fallbackButton, { backgroundColor: theme.muted }]}
            onPress={() => {
              // Keep both options available during transition
            }}
          >
            <Text style={[styles.fallbackText, { color: theme.subText }]}>
              💡 Try the new smart search above, or use classic search if needed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.background }]}
            onPress={() => setAddMode('search')}
          >
            <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back to dropdown</Text>
          </TouchableOpacity>
        </ResponsiveCard>
      )}

      {addMode === 'template' && (
        <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
          <MealTemplateForm
            onTemplateSelect={(template) => {
              // Handle template selection
              if (template.foods && template.foods.length > 0) {
                const firstFood = template.foods[0];
                const food = foodList.find(f => f.name === firstFood.food);
                if (food) {
                  setSelectedFood(food);
                  setQuantity(firstFood.quantity.toString());
                }
              }
            }}
          />
        </ResponsiveCard>
      )}

      {addMode === 'barcode' && (
        <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: theme.text }]}>Barcode Scanner</Text>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: theme.muted }]}
            onPress={() => setShowBarcodeScanner(true)}
          >
            <Ionicons name="scan-outline" size={32} color={theme.primary} />
            <Text style={[styles.scanText, { color: theme.subText }]}>
              Scan product barcode
            </Text>
          </TouchableOpacity>
        </ResponsiveCard>
      )}

      {/* Meal Photo Section */}
      <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
        <Text style={[styles.label, { color: theme.text }]}>Meal Photo (Optional)</Text>
        {mealPhoto ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: mealPhoto }} style={styles.mealPhotoPreview} />
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: theme.muted }]}
                onPress={() => setShowPhotoCapture(true)}
              >
                <Ionicons name="camera-outline" size={16} color={theme.primary} />
                <Text style={[styles.photoActionText, { color: theme.text }]}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: theme.error }]}
                onPress={() => setMealPhoto(null)}
              >
                <Ionicons name="trash-outline" size={16} color="white" />
                <Text style={[styles.photoActionText, { color: 'white' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addPhotoButton, { backgroundColor: theme.muted, borderColor: theme.primary }]}
            onPress={() => setShowPhotoCapture(true)}
          >
            <Ionicons name="camera-outline" size={24} color={theme.primary} />
            <Text style={[styles.addPhotoText, { color: theme.subText }]}>
              Add photo of your meal
            </Text>
          </TouchableOpacity>
        )}
      </ResponsiveCard>

      {selectedFood && (
        <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: theme.text }]}>Selected Food</Text>
          <View style={[styles.selectedFoodCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.selectedFoodName, { color: theme.text }]}>
              {selectedFood.name}
            </Text>
            <Text style={[styles.selectedFoodDetails, { color: theme.subText }]}>
              {selectedFood.calories} kcal • P {selectedFood.protein}g • C {selectedFood.carbs}g • F {selectedFood.fat}g (per 100g)
            </Text>
          </View>
        </ResponsiveCard>
      )}

      <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
        <Text style={[styles.label, { color: theme.text }]}>Quantity (grams)</Text>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="e.g. 100"
          placeholderTextColor={theme.subText}
          style={[styles.input, { borderColor: theme.muted, color: theme.text }]}
        />

        <Animated.View style={{ transform: [{ scale: addScale }] }}>
          <PrimaryButton
            title="Add Meal"
            onPress={onPressAdd}
            disabled={!selectedFood || !quantity}
          />
        </Animated.View>
      </ResponsiveCard>

      <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
        <Text style={[styles.label, { color: theme.subText }]}>Quick Water</Text>
        <View style={styles.waterRow}>
          <View style={[styles.glassIconWrap, { backgroundColor: theme.muted }]}>
            <Ionicons name="water-outline" size={28} color={theme.primary} />
          </View>
          <TextInput
            value={waterMl}
            onChangeText={setWaterMl}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, color: theme.text, borderColor: theme.muted }]}
          />
          <Animated.View style={{ transform: [{ scale: addScale }] }}>
            <PrimaryButton title="Add" onPress={handleAddWater} style={{ paddingHorizontal: 16 }} />
          </Animated.View>
        </View>
      </ResponsiveCard>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showBarcodeScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <BarcodeScanner
          onFoodFound={handleBarcodeFood}
          onClose={() => setShowBarcodeScanner(false)}
          onError={(error) => {
            console.error('Barcode scanner error:', error);
            setShowBarcodeScanner(false);
            toast('Scanner error occurred', 'error');
          }}
        />
      </Modal>

      {/* Photo Capture Modal */}
      <Modal
        visible={showPhotoCapture}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <MealPhotoCapture
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setShowPhotoCapture(false)}
          existingPhoto={mealPhoto}
        />
      </Modal>

      {/* Meal Confirmation Dialog */}
      <Modal
        visible={showMealConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMealConfirmDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.card }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>
              Confirm Meal Log
            </Text>
            {pendingMealData && (
              <View style={styles.confirmContent}>
                <Text style={[styles.confirmText, { color: theme.subText }]}>
                  Add {pendingMealData.selectedFood?.name} ({pendingMealData.quantity}g) to {pendingMealData.mealType}?
                </Text>
                <Text style={[styles.confirmNutrition, { color: theme.text }]}>
                  {pendingMealData.nutrients?.calories} calories
                </Text>
              </View>
            )}
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.muted }]}
                onPress={() => setShowMealConfirmDialog(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: theme.primary }]}
                onPress={confirmAddMeal}
              >
                <Text style={[styles.confirmButtonText, { color: theme.onPrimary || '#fff' }]}>Log Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Water Confirmation Dialog */}
      <Modal
        visible={showWaterConfirmDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWaterConfirmDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: theme.card }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>
              Confirm Water Log
            </Text>
            {pendingWaterData && (
              <View style={styles.confirmContent}>
                <Text style={[styles.confirmText, { color: theme.subText }]}>
                  Add {pendingWaterData.amount}ml of water to your daily intake?
                </Text>
              </View>
            )}
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: theme.muted }]}
                onPress={() => setShowWaterConfirmDialog(false)}
              >
                <Text style={[styles.confirmButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary, { backgroundColor: theme.primary }]}
                onPress={confirmAddWater}
              >
                <Text style={[styles.confirmButtonText, { color: theme.onPrimary || '#fff' }]}>Log Water</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ResponsiveLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
  label: { marginTop: 12, fontWeight: '600' },
  modeSelector: { marginBottom: 16 },
  card: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    marginVertical: 24,
  },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glassIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 8,
  },
  addButtonText: { fontWeight: '700' },
  modeSelector: {
    marginBottom: 16,
  },
  recommendationsSection: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  recommendationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchSection: {
    marginBottom: 16,
  },
  templateSection: {
    marginBottom: 16,
  },
  barcodeSection: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  searchButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scanButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  scanText: {
    fontSize: 12,
    marginTop: 8,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoContainer: {
    marginTop: 8,
  },
  mealPhotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  photoActionText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  addPhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    marginTop: 8,
  },
  selectedFoodSection: {
    marginBottom: 16,
  },
  selectedFoodCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedFoodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedFoodDetails: {
    fontSize: 12,
  },
  fallbackButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  picker: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    minHeight: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    borderRadius: 16,
    padding: 24,
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmContent: {
    marginBottom: 24,
  },
  confirmText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  confirmNutrition: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    opacity: 0.8,
  },
  confirmButtonPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
