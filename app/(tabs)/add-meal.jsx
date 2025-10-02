import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTheme } from '../../components/ui/ThemeProvider';
import { getFoodDatabase, saveMealEntry, saveWaterEntry } from '../../utils/storage';
import { toast } from '../../utils/toast';

export default function AddMealScreen() {
  const { theme } = useTheme();
  const [mealType, setMealType] = useState('Breakfast');
  const [foodList, setFoodList] = useState([]);
  const [selectedFood, setSelectedFood] = useState('');
  const [quantity, setQuantity] = useState('');
  const [waterMl, setWaterMl] = useState('250');
  const scale = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    loadFoodList();
  }, []);

  const loadFoodList = async () => {
    const saved = await getFoodDatabase();
    setFoodList(saved);
    if (saved.length > 0) {
      setSelectedFood(saved[0].name);
    }
  };

  const handleAddMeal = async () => {
    if (!quantity) {
      toast('Please enter quantity', 'error');
      return;
    }

    const food = foodList.find((f) => f.name === selectedFood);
    if (!food) {
      toast('Selected food not found', 'error');
      return;
    }

    const qty = parseFloat(quantity);
    const nutrients = {
      calories: (food.calories * qty) / 100,
      protein: (food.protein * qty) / 100,
      carbs: (food.carbs * qty) / 100,
      fat: (food.fat * qty) / 100,
    };

    const newMeal = {
      type: mealType,
      food: selectedFood,
      quantity: qty,
      nutrients,
      date: new Date().toISOString().split("T")[0], // <-- add today's date
    };


    await saveMealEntry(newMeal);
    toast('Meal added!', 'success');
    setQuantity('');
  };

  const handleAddWater = async () => {
    const ml = parseInt(waterMl, 10);
    if (!ml || ml <= 0) {
      toast('Please enter a valid amount in ml', 'error');
      return;
    }

    await saveWaterEntry(ml);

    // simple scale animation to indicate success
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();

    toast(`${ml} ml added`, 'success');
    setWaterMl('250');
  };


  const addScale = useRef(new Animated.Value(1)).current;

  const onPressAdd = async () => {
    Animated.sequence([
      Animated.timing(addScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(addScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    await handleAddMeal();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: theme.text }]}>Log a Meal</Text>

        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.muted }]}>
          <Text style={[styles.label, { color: theme.subText }]}>Meal Type</Text>
          <Picker selectedValue={mealType} onValueChange={setMealType}>
            <Picker.Item label="Breakfast" value="Breakfast" />
            <Picker.Item label="Lunch" value="Lunch" />
            <Picker.Item label="Dinner" value="Dinner" />
            <Picker.Item label="Other" value="Other" />
          </Picker>

          <Text style={[styles.label, { color: theme.text }]}>Food</Text>
          <Picker selectedValue={selectedFood} onValueChange={setSelectedFood}>
            {foodList.map((food) => (
              <Picker.Item key={food.name} label={food.name} value={food.name} />
            ))}
          </Picker>

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
            <PrimaryButton title="Add Meal" onPress={onPressAdd} />
          </Animated.View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.muted }]}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
  label: { marginTop: 12, fontWeight: '600' },
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
});
